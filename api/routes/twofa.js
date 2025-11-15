const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../config/database');
const { authenticate, requireSuperAdmin } = require('../middleware/auth');
const TwoFactorAuth = require('../utils/twofa');
const logger = require('../utils/logger');

const router = express.Router();

// Setup 2FA for superadmin user
router.post('/setup', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;
    const usersCollection = database.getCollection('users');

    // Check if user already has 2FA enabled
    const user = await usersCollection.findOne({ id: userId });
    if (user.twofa_enabled) {
      return res.status(400).json({ detail: '2FA is already enabled for this account' });
    }

    // Generate 2FA secret
    const secretData = TwoFactorAuth.generateSecret(userEmail);
    const qrCode = await TwoFactorAuth.generateQRCode(secretData.otpauth_url);
    const backupCodes = TwoFactorAuth.generateBackupCodes();

    // Store the secret temporarily (not enabled until verified)
    await usersCollection.updateOne(
      { id: userId },
      {
        $set: {
          twofa_secret: secretData.secret,
          twofa_backup_codes: backupCodes,
          twofa_enabled: false,
          twofa_setup_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    logger.info('2FA setup initiated for superadmin', { userId, email: userEmail });

    res.json({
      message: '2FA setup initiated. Please scan the QR code with your authenticator app.',
      qr_code: qrCode,
      manual_entry_key: secretData.secret,
      backup_codes: backupCodes,
      instructions: {
        step1: 'Install Google Authenticator, Authy, or similar app on your phone',
        step2: 'Scan the QR code or enter the manual key',
        step3: 'Enter the 6-digit code from your app to complete setup'
      }
    });

  } catch (error) {
    logger.error('Error setting up 2FA', { error: error.message, userId: req.user.id });
    res.status(500).json({ detail: 'Failed to setup 2FA' });
  }
});

// Verify and enable 2FA
router.post('/verify-setup', authenticate, requireSuperAdmin, [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { token } = req.body;
    const userId = req.user.id;
    const usersCollection = database.getCollection('users');

    // Get user with temporary 2FA secret
    const user = await usersCollection.findOne({ id: userId });
    if (!user.twofa_secret) {
      return res.status(400).json({ detail: 'No 2FA setup in progress. Please start setup first.' });
    }

    if (user.twofa_enabled) {
      return res.status(400).json({ detail: '2FA is already enabled for this account' });
    }

    // Verify the token
    const isValid = TwoFactorAuth.verifyToken(token, user.twofa_secret);
    if (!isValid) {
      return res.status(400).json({ detail: 'Invalid 2FA token. Please try again.' });
    }

    // Enable 2FA
    await usersCollection.updateOne(
      { id: userId },
      {
        $set: {
          twofa_enabled: true,
          twofa_verified_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    logger.info('2FA enabled for superadmin', { userId, email: user.email });

    res.json({
      message: '2FA has been successfully enabled for your account',
      enabled: true,
      backup_codes_remaining: user.twofa_backup_codes?.length || 0
    });

  } catch (error) {
    logger.error('Error verifying 2FA setup', { error: error.message, userId: req.user.id });
    res.status(500).json({ detail: 'Failed to verify 2FA setup' });
  }
});

// Check 2FA status
router.get('/status', authenticate, requireSuperAdmin, async (req, res) => {
  try {
    const userId = req.user.id;
    const usersCollection = database.getCollection('users');

    const user = await usersCollection.findOne({ id: userId });
    
    res.json({
      enabled: user.twofa_enabled || false,
      setup_required: TwoFactorAuth.isRequired(user.role),
      backup_codes_remaining: user.twofa_backup_codes?.length || 0,
      setup_date: user.twofa_verified_at || null
    });

  } catch (error) {
    logger.error('Error checking 2FA status', { error: error.message, userId: req.user.id });
    res.status(500).json({ detail: 'Failed to check 2FA status' });
  }
});

// Disable 2FA (requires current 2FA token)
router.post('/disable', authenticate, requireSuperAdmin, [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { token } = req.body;
    const userId = req.user.id;
    const usersCollection = database.getCollection('users');

    const user = await usersCollection.findOne({ id: userId });
    if (!user.twofa_enabled) {
      return res.status(400).json({ detail: '2FA is not enabled for this account' });
    }

    // Verify current token before disabling
    const isValid = TwoFactorAuth.verifyToken(token, user.twofa_secret);
    if (!isValid) {
      return res.status(400).json({ detail: 'Invalid 2FA token. Cannot disable 2FA.' });
    }

    // Disable 2FA
    await usersCollection.updateOne(
      { id: userId },
      {
        $unset: {
          twofa_secret: '',
          twofa_backup_codes: '',
          twofa_enabled: '',
          twofa_setup_at: '',
          twofa_verified_at: ''
        },
        $set: {
          twofa_disabled_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    logger.info('2FA disabled for superadmin', { userId, email: user.email });

    res.json({
      message: '2FA has been disabled for your account',
      enabled: false
    });

  } catch (error) {
    logger.error('Error disabling 2FA', { error: error.message, userId: req.user.id });
    res.status(500).json({ detail: 'Failed to disable 2FA' });
  }
});

// Generate new backup codes
router.post('/backup-codes/regenerate', authenticate, requireSuperAdmin, [
  body('token').isLength({ min: 6, max: 6 }).withMessage('Token must be 6 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ detail: errors.array()[0].msg });
    }

    const { token } = req.body;
    const userId = req.user.id;
    const usersCollection = database.getCollection('users');

    const user = await usersCollection.findOne({ id: userId });
    if (!user.twofa_enabled) {
      return res.status(400).json({ detail: '2FA is not enabled for this account' });
    }

    // Verify current token
    const isValid = TwoFactorAuth.verifyToken(token, user.twofa_secret);
    if (!isValid) {
      return res.status(400).json({ detail: 'Invalid 2FA token. Cannot regenerate backup codes.' });
    }

    // Generate new backup codes
    const newBackupCodes = TwoFactorAuth.generateBackupCodes();

    await usersCollection.updateOne(
      { id: userId },
      {
        $set: {
          twofa_backup_codes: newBackupCodes,
          backup_codes_regenerated_at: new Date(),
          updated_at: new Date()
        }
      }
    );

    logger.info('2FA backup codes regenerated', { userId, email: user.email });

    res.json({
      message: 'New backup codes generated successfully',
      backup_codes: newBackupCodes,
      warning: 'Store these codes securely. Previous backup codes are no longer valid.'
    });

  } catch (error) {
    logger.error('Error regenerating backup codes', { error: error.message, userId: req.user.id });
    res.status(500).json({ detail: 'Failed to regenerate backup codes' });
  }
});

module.exports = router;