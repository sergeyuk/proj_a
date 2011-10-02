
function handler (req, res) {
  fs.readFile('./index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading index.html');
    }

    res.writeHead(200);
    res.end(data);
  });
}

var app = require('http').createServer(handler)
var io = require('socket.io').listen(app)
var fs = require('fs')

console.log("start the stuff....");

io.sockets.on('connection', function (socket) {
  socket.emit('news', { msg: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
    console.log( "received other event......" )
  });
 setInterval(1000, function(){

});
});

app.listen(8000);

