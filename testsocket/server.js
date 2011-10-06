
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

var last_user_id = 0;
var positions = {};

var app = require('http').createServer(handler)
var io = require('socket.io').listen(app)
var fs = require('fs')

console.log("start the stuff....");

io.sockets.on('connection', function (socket) {
	socket.broadcast.emit( 'new user' );

	var this_user_id = last_user_id++;
	positions[this_user_id] = [0, 0];
	socket.set('id', this_user_id, function(){
		socket.get('id', function( err, id_value ){
			socket.emit( 'connected', id_value );
			socket.emit( 'pos', positions[id_value] );
		});
	});

	console.log( "connected one.." );

	socket.on( 'key pressed', function (data ){ 
		console.log( "incrementing pos.." );
		socket.get( 'id', function( err, id_value ){
			var pos = positions[id_value];
			pos[0]++;
			socket.emit( 'pos', pos );
		});
	});
});

app.listen(8000);



