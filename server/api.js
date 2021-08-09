const express = require('express');
const router = express.Router();
var {v4 : uuidV4} = require('uuid');
const bcrypt = require('bcrypt');

var {getAllLive, postLive} = require('./db');
var {passport, addToUsers, getUserByEmail, checkAuthenticated, checkNotAuthenticated} = require('./passport-config');


router.post('/register', checkNotAuthenticated, async function(req, res){
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    addToUsers({
      name: req.body.name,
      email: req.body.email,
      password: hashedPassword
    });
    res.sendStatus(200);
});

router.post('/login', checkNotAuthenticated, passport.authenticate('local', {}), function(req, res){
    res.sendStatus(200);
});

router.post('/logout', checkAuthenticated, function(req, res){
    req.logOut();
    res.sendStatus(200);
});
  
router.get('/user', checkAuthenticated, function(req, res){
    res.set('Content-Type', 'application/json');
    res.send(JSON.stringify(getUserByEmail(req.session.passport.user).name));
});

router.get('/live', checkAuthenticated, function(req, res) {
    getAllLive(function(results){
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(results));
    });
});

router.post('/live', checkAuthenticated, function(req, res) {
    var session_id = uuidV4();
    var data = {
        host : getUserByEmail(req.session.passport.user).name,
        name : req.body.name,
        description : req.body.description,
        session_id : session_id
    };
    postLive(data, function(results){
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(data));
    });
});

module.exports = router;