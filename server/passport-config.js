const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');

const users = {};

function addToUsers(user){
    users[user.email] = user;
}

function getUserByEmail(email){
    return users[email];
}

function initializePassport() {
  passport.use(new LocalStrategy({ usernameField: 'email', passwordField: 'password' }, authenticateUser))
  passport.serializeUser((user, done) => done(null, user.email))
  passport.deserializeUser((email, done) => {
    return done(null, getUserByEmail(email))
  })
}

async function authenticateUser(email, password, done) {
    const user = getUserByEmail(email);
    if (user == null) {
      return done(null, false, 'Email not Registered');
    }

    try {
      if (await bcrypt.compare(password, user.password)) {
        return done(null, user)
      } else {
        return done(null, false, 'Incorrect credentials');
      }
    } catch (e) {
      return done(e)
    }
  }

function checkAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.redirect('/login');
  }
  
function checkNotAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
      return res.redirect('/home');
    }
    next();
  }

initializePassport();

exports.passport = passport;
exports.addToUsers = addToUsers;
exports.getUserByEmail = getUserByEmail;
exports.checkAuthenticated = checkAuthenticated;
exports.checkNotAuthenticated = checkNotAuthenticated;