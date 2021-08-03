var createError = require('http-errors');
var exphbs  = require('express-handlebars');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const PORT = '3000';

var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var apiRouter = require('./api');

var {getLiveBySessionId, updateClientId, deleteLiveBySessionId, incrementLikeBySessionId} = require('./db');

// view engine setup
app.set('views', path.join(__dirname, '/../views'));
app.engine('.hbs', exphbs({extname: '.hbs', layoutsDir: path.join(__dirname, '/../views'), defaultLayout: "layout"}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("live-stream"));
app.use(express.static(path.join(__dirname, '/../public')));

app.use(function(req, res, next) {
  if(req.path == "/login" || req.path == "/api/login"){
    next();
  }else if(!req.signedCookies.user){
    res.redirect("/login");
  }else{
    next();
  }
});

app.use('/api', apiRouter);

app.get('/', function(req, res) {
  res.redirect('/login');
});

app.get(['/login', '/home', '/host', '/live'], function(req, res) {
  res.render('loading', {});
});

app.get('/*', function(req, res) {
  res.redirect('/home');
});

io.on('connection', function(socket){
  socket.on('host-session', function(session_id, client_id){
    socket.join(session_id);
    updateClientId({session_id : session_id, client_id : client_id}, function(results){
      socket.session_id = session_id;
    });
  });

  socket.on('join-session', function(session_id, client_id){
    socket.join(session_id);
    socket.broadcast.to(session_id).emit('user-connected', client_id);
    getLiveBySessionId(session_id, function(result){
      socket.emit('client-id', result.client_id);
    });
  });

  socket.on('increment-like', function(session_id){
    socket.broadcast.to(session_id).emit('like');
    incrementLikeBySessionId(session_id, function(){
      
    });
  });

  socket.on('disconnect', function(session_id, client_id){
    if(socket.session_id){
      deleteLiveBySessionId(socket.session_id, function(){

      });
    }
  });
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  console.log(err.message);
  console.log(err.stack);
  res.render('error');
});


server.listen(PORT, function(){
  console.log("Listening on port "+PORT);
});

module.exports = app;
