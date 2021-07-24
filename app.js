var createError = require('http-errors');
var express = require('express');
var exphbs  = require('express-handlebars');
var expressWs = require('express-ws');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');

const PORT = '3000';

var app = express();
var expWs = expressWs(app);
expWs.getUniqueID = function(user){
  if(user == "viewer"){
    return "viewer_"+Date.now();
  }else{
    return "streamer_"+Date.now();
  }
};

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('.hbs', exphbs({extname: '.hbs', layoutsDir: path.join(__dirname, 'views'), defaultLayout: "layout"}));
app.set('view engine', '.hbs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res) {
  res.render('index', {});
});

app.ws("/get_live",function(ws, req){
  ws.id = expWs.getUniqueID("viewer");
  console.log("viewer socket "+ws.id+" connected");
  ws.on('close',function(){
    console.log("viewer socket "+ws.id+" disconnected");
  });
});

app.ws("/stream",function(ws, req){
  ws.id = expWs.getUniqueID("streamer");
  console.log("streamer socket "+ws.id+" connected");
  ws.on('message',function(msg){
    expWs.getWss().clients.forEach(function(client){
      if(client.id.startsWith("viewer_")){
        client.send(msg);
      }
    });
  });

  ws.on('close', function(){
    console.log("streamer socket "+ws.id+" disconnected")
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
  res.render('error');
});


app.listen(PORT, function(){
  console.log("Listening on port "+PORT);
});

module.exports = app;
