const createError = require('http-errors');
const exphbs  = require('express-handlebars');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session');

const PORT = '3000';

const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const apiRouter = require('./api');

var {getLiveBySessionId, updateClientId, deleteLiveBySessionId, incrementLikeBySessionId, incrementViewersBySessionId, decrementViewersBySessionId} = require('./db');


var {passport, checkAuthenticated, checkNotAuthenticated} = require('./passport-config');

// view engine setup
app.set('views', path.join(__dirname, '/../views'));
app.engine('.hbs', exphbs({extname: '.hbs', layoutsDir: path.join(__dirname, '/../views'), defaultLayout: "layout"}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("live-stream"));
app.use(express.static(path.join(__dirname, '/../public')));
app.use(session({
  secret: 'secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/api', apiRouter);

app.get('/register', checkNotAuthenticated, function(req, res){
  res.render('loading', {});
});

app.get('/login', checkNotAuthenticated, function(req, res){
  res.render('loading', {});
});

app.get(['/home', '/host', '/live'], checkAuthenticated, function(req, res) {
  res.render('loading', {});
});

app.get('/*', checkAuthenticated, function(req, res) {
  res.redirect('/home');
});

io.on('connection', function(socket){
  socket.on('host-session', function(session_id, client_id){
    socket.join(session_id);
    updateClientId({session_id : session_id, client_id : client_id}, function(results){
      socket.host = true;
      socket.session_id = session_id;
    });
  });

  socket.on('join-session', function(session_id, client_id, name){
    socket.join(session_id);
    socket.name = name;
    socket.session_id = session_id;
    socket.broadcast.to(session_id).emit('user-connected', name, client_id);
    incrementViewersBySessionId(session_id, function(){});
    getLiveBySessionId(socket.session_id, function(result){
      socket.emit('host-details', result);
    });
  });

  socket.on('increment-like', function(){
    socket.broadcast.to(socket.session_id).emit('like');
    incrementLikeBySessionId(socket.session_id, function(){});
  });

  socket.on('message', function(sender, message){
    socket.broadcast.to(socket.session_id).emit('message', sender, message);
  });

  socket.on('disconnect', function(){
    if(socket.host){
      deleteLiveBySessionId(socket.session_id, function(){});
      socket.broadcast.to(socket.session_id).emit('session-left');
    }else{
      decrementViewersBySessionId(socket.session_id, function(){});
      socket.broadcast.to(socket.session_id).emit('user-disconnected', socket.name);
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
