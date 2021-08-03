var express = require('express');
var router = express.Router();
var {v4 : uuidV4} = require('uuid');

var {getAllLive, postLive} = require('./db');

router.post('/login', function(req, res) {
    res.cookie("user", req.body.name, {
        maxAge : 1000 * 60 * 60 *24,
        signed : true
    });
    res.sendStatus(200);
});
  
router.get('/live', function(req, res) {
    getAllLive(function(results){
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(results));
    });
});

router.post('/live', function(req, res) {
    var session_id = uuidV4();
    var data = {
        host : req.signedCookies.user,
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