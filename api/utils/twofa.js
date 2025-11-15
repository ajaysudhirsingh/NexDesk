const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const logger = require('./logger');

class TwoFactorAuth {
  /**
   * Generate a new 2FA secret for a user
   * @param {string} userEmail - User's email address
   * @param {string} serviceName - Service name (e.g., "NEXDESK")
   * @returns {Object} - Contains secret, qr_code, and backup_codes
   */
  static generateSecret(userEmail, serviceName = 'NEXDESK') {
    try {
      const secret = speakeasy.generateSecret({
        name: `${serviceName} (${userEmail})`,
        issuer: serviceName,
        length: 32
      });

      return {
        secret: secret.base32,
        otpauth_url: secret.otpauth_url,
        manual_entry_key: secret.base32
      };
    } catch (error) {
      logger.error('Error generating 2FA secret', { error: error.message });
      throw new Error('Failed to generate 2FA secret');
    }
  }

  /**
   * Generate QR code for 2FA setup
   * @param {string} otpauthUrl - The otpauth URL from generateSecret
   * @returns {Promise<string>} - Base64 encoded QR code image
   */
  static async generateQRCode(otpauthUrl) {
    try {
      const qrCodeDataURL = await QRCode.toDataURL(otpauthUrl);
      return qrCodeDataURL;
    } catch (error) {
      logger.error('Error generating QR code', { error: error.message });
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Verify a 2FA token
   * @param {string} token - The 6-digit token from authenticator app
   * @param {string} secret - The user's 2FA secret
   * @param {number} window - Time window for token validation (default: 2)
   * @returns {boolean} - True if token is valid
   */
  static verifyToken(token, secret, window = 2) {
    try {
      if (!token || !secret) {
        return false;
      }

      // Remove any spaces or formatting from token
      const cleanToken = token.replace(/\s/g, '');

      // Verify the token
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: cleanToken,
        window: window
      });

      logger.info('2FA token verification', { 
        success: verified,
        tokenLength: cleanToken.length 
      });

      return verified;
    } catch (error) {
      logger.error('Error verifying 2FA token', { error: error.message });
      return false;
    }
  }

  /**
   * Generate backup codes for 2FA recovery
   * @param {number} count - Number of backup codes to generate (default: 10)
   * @returns {Array<string>} - Array of backup codes
   */
  static generateBackupCodes(count = 10) {
    const codes = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric codes
      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify a backup code
   * @param {string} code - The backup code to verify
   * @param {Array<string>} backupCodes - Array of valid backup codes
   * @returns {boolean} - True if backup code is valid
   */
  static verifyBackupCode(code, backupCodes) {
    if (!code || !Array.isArray(backupCodes)) {
      return false;
    }

    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    return backupCodes.includes(cleanCode);
  }

  /**
   * Remove a used backup code from the list
   * @param {string} code - The backup code that was used
   * @param {Array<string>} backupCodes - Array of backup codes
   * @returns {Array<string>} - Updated array with the used code removed
   */
  static removeBackupCode(code, backupCodes) {
    if (!code || !Array.isArray(backupCodes)) {
      return backupCodes;
    }

    const cleanCode = code.replace(/\s/g, '').toUpperCase();
    return backupCodes.filter(backupCode => backupCode !== cleanCode);
  }

  /**
   * Check if 2FA is required for a user role
   * @param {string} role - User role
   * @returns {boolean} - True if 2FA is required
   */
  static isRequired(role) {
    // 2FA is required for superadmin users
    return role === 'superadmin';
  }

  /**
   * Generate a temporary 2FA bypass token (for emergency access)
   * @param {string} userId - User ID
   * @returns {string} - Temporary bypass token
   */
  static generateBypassToken(userId) {
    const timestamp = Date.now();
    const randomPart = Math.random().toString(36).substring(2, 15);
    return `bypass_${userId}_${timestamp}_${randomPart}`;
  }
}

module.exports = TwoFactorAuth;