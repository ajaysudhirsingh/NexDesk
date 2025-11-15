const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { verifyPassword, createAccessToken } = require('../utils/auth');
const { authenticate } = require('../middleware/auth');

const logger = require('../utils/logger');

const router = express.Router();

// Login endpoint
router.post('/login', [
  body('username').notEmpty().withMessage('Username is required'),
  body('password').notEmpty().withMessage('Password is required'),
  body('client_code').notEmpty().withMessage('Client code is required')
], async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { username, password, client_code, twofa_token, backup_code } = req.body;
    const clientsCollection = database.getCollection('clients');
    const usersCollection = database.getCollection('users');

    // Find client by code (convert to uppercase for case-insensitive matching)
    const client = await clientsCollection.findOne({ code: client_code.trim().toUpperCase() });
    if (!client) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // Check if client is active
    if (!client.is_active) {
      return res.status(401).json({ detail: 'Client account is deactivated. Please contact support.' });
    }

    // Find user
    const user = await usersCollection.findOne({ 
      username: username, 
      client_id: client.id 
    });

    if (!user) {
      logger.warn('Login attempt with non-existent user', { 
        username, 
        client_code, 
        client_id: client.id 
      });
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return res.status(401).json({ detail: 'Invalid credentials' });
    }

    // Initialize 2FA variables
    let used_backup_code = false;

    // Check TOTP for superadmin users
    if (user.role === 'superadmin') {
      console.log('🔐 SuperAdmin login attempt:', {
        username: user.username,
        totp_enabled: user.totp_enabled,
        twofa_enabled: user.twofa_enabled,
        has_totp_secret: !!user.totp_secret,
        has_twofa_secret: !!user.twofa_secret,
        has_twofa_token: !!twofa_token,
        has_backup_code: !!backup_code
      });

      // Check if any 2FA is enabled (old twofa_enabled or new totp_enabled)
      const has2FAEnabled = user.totp_enabled || user.twofa_enabled;
      const has2FASecret = user.totp_secret || user.twofa_secret;

      // If no 2FA is enabled but there's an old secret, migrate it
      if (!has2FAEnabled && user.twofa_secret) {
        console.log('🔐 Migrating old 2FA to new TOTP system');
        await usersCollection.updateOne(
          { id: user.id },
          {
            $set: {
              totp_enabled: true,
              totp_secret: user.twofa_secret,
              totp_backup_codes: user.twofa_backup_codes || [],
              updated_at: new Date()
            }
          }
        );
        // Update user object for this request
        user.totp_enabled = true;
        user.totp_secret = user.twofa_secret;
        user.totp_backup_codes = user.twofa_backup_codes || [];
      }

      // If TOTP is not enabled, require setup
      if (!user.totp_enabled && !user.twofa_enabled) {
        console.log('🔐 TOTP not enabled, requiring setup');
        return res.status(403).json({ 
          detail: 'Google Authenticator setup is required for superadmin accounts.',
          requires_totp_setup: true,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            client_id: user.client_id,
            totp_enabled: false
          }
        });
      }

      // If TOTP is enabled, require verification
      if (!twofa_token && !backup_code) {
        console.log('🔐 TOTP enabled but no token provided, requiring verification');
        return res.status(403).json({ 
          detail: 'Google Authenticator code is required for superadmin login.',
          requires_totp: true
        });
      }

      // Verify TOTP token
      if (twofa_token) {
        const speakeasy = require('speakeasy');
        const secret = user.totp_secret || user.twofa_secret;
        const verified = speakeasy.totp.verify({
          secret: secret,
          encoding: 'base32',
          token: twofa_token,
          window: 2
        });
        
        if (!verified) {
          return res.status(401).json({ detail: 'Invalid Google Authenticator code' });
        }
      }
      // Verify backup code (if implemented)
      else if (backup_code) {
        const backupCodes = user.totp_backup_codes || user.twofa_backup_codes || [];
        if (!backupCodes.includes(backup_code)) {
          return res.status(401).json({ detail: 'Invalid backup code' });
        }
        
        // Remove used backup code
        const updatedBackupCodes = backupCodes.filter(code => code !== backup_code);
        await usersCollection.updateOne(
          { id: user.id },
          { $set: { 
            totp_backup_codes: updatedBackupCodes,
            twofa_backup_codes: updatedBackupCodes
          } }
        );
        used_backup_code = true;
      }
    }

    // Update last login
    await usersCollection.updateOne(
      { id: user.id },
      {
        $set: {
          last_login: new Date(),
          updated_at: new Date()
        }
      }
    );

    // Create access token
    const accessToken = createAccessToken({
      sub: user.username,
      client_id: user.client_id,
      role: user.role
    });

    logger.info('User login successful', { 
      userId: user.id, 
      role: user.role,
      twofa_used: user.role === 'superadmin' && (twofa_token || backup_code),
      backup_code_used: used_backup_code
    });

    res.json({
      access_token: accessToken,
      token_type: 'bearer',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        client_id: user.client_id,
        twofa_enabled: user.twofa_enabled || false,
        backup_codes_remaining: user.twofa_backup_codes?.length || 0
      }
    });
  } catch (error) {
    logger.error('Login error', { error: error.message, stack: error.stack });
    res.status(500).json({ detail: 'Login failed' });
  }
});

// Get current user info
router.get('/me', authenticate, (req, res) => {
  res.json({
    id: req.user.id,
    username: req.user.username,
    email: req.user.email,
    role: req.user.role,
    client_id: req.user.client_id
  });
});

module.exports = router;