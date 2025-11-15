const passport = require('passport');
const database = require('./database');
const logger = require('../utils/logger');

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (userId, done) => {
  try {
    const usersCollection = database.getCollection('users');
    const user = await usersCollection.findOne({ id: userId });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;