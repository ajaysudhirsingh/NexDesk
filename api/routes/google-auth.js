const express = require('express');
const passport = require('../config/passport');
const { createAccessToken } = require('../utils/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Initiate Google OAuth
router.get('/google', (req, res, next) => {
  logger.info('Initiating Google OAuth flow');
  passport.authenticate('google', {
    scope: ['profile', 'email']
  })(req, res, next);
});

// Google OAuth callback
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`,
    session: false
  }),
  async (req, res) => {
    try {
      const user = req.user;
      
      if (!user) {
        logger.error('No user found after Google OAuth callback');
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=auth_failed`);
      }

      // Verify user is superadmin
      if (user.role !== 'superadmin') {
        logger.warn('Non-superadmin user attempted Google OAuth login', { 
          userId: user.id, 
          role: user.role 
        });
        return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=insufficient_permissions`);
      }

      // Create JWT token
      const accessToken = createAccessToken({
        sub: user.username,
        client_id: user.client_id,
        role: user.role,
        auth_provider: 'google'
      });

      logger.info('Google OAuth login successful', { 
        userId: user.id, 
        email: user.email 
      });

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/auth/google/success?token=${accessToken}&user=${encodeURIComponent(JSON.stringify({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        auth_provider: 'google',
        google_profile: user.google_profile
      }))}`);

    } catch (error) {
      logger.error('Error in Google OAuth callback', { error: error.message });
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=callback_error`);
    }
  }
);

// Check Google OAuth status
router.get('/google/status', (req, res) => {
  const googleConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const authorizedEmails = (process.env.GOOGLE_AUTHORIZED_EMAILS || '').split(',').map(e => e.trim()).filter(e => e);
  
  res.json({
    enabled: googleConfigured,
    configured: googleConfigured,
    authorized_emails_count: authorizedEmails.length,
    callback_url: process.env.GOOGLE_CALLBACK_URL || "http://localhost:8001/api/auth/google/callback"
  });
});

module.exports = router;