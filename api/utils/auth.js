const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Hash password - exactly matching Python SHA-256 implementation
const hashPassword = (password) => {
  return crypto.createHash('sha256').update(password).digest('hex');
};

// Verify password - exactly matching Python implementation
const verifyPassword = (password, hashedPassword) => {
  return crypto.createHash('sha256').update(password).digest('hex') === hashedPassword;
};

// Generate secure password - exactly matching Python implementation
const generateSecurePassword = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return password;
};

// Create JWT token - exactly matching Python implementation
const createAccessToken = (data, expiresIn = null) => {
  const toEncode = { ...data };
  const expireMinutes = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES) || 30;
  
  if (expiresIn) {
    toEncode.exp = Math.floor(Date.now() / 1000) + (expiresIn * 60);
  } else {
    toEncode.exp = Math.floor(Date.now() / 1000) + (expireMinutes * 60);
  }
  
  return jwt.sign(toEncode, process.env.SECRET_KEY, { algorithm: 'HS256' });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.SECRET_KEY, { algorithms: ['HS256'] });
  } catch (error) {
    return null;
  }
};

// Generate UUID - exactly matching Python uuid.uuid4()
const generateUUID = () => {
  return crypto.randomUUID();
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  createAccessToken,
  verifyToken,
  generateUUID
};