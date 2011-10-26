
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

var GAME = {
	last_user_id : 0,
	positions : {}
};

var app = require('http').createServer(handler)
var io = require('socket.io').listen(app)
var fs = require('fs')

console.log("start the stuff....");

var update_client_position = function( socket, id_value ){
	socket.emit( 'pos update', [id_value, GAME.positions[id_value]] );
	socket.broadcast.emit( 'pos update', [id_value, GAME.positions[id_value]] );
};

io.sockets.on('disconnection', function (socket) {
	socket.get('id', function( err, client_id ) { 
		socket.broadcast.emit( 'disconnected', client_id );
	}); 
});

io.sockets.on('connection', function (socket) {
	var this_user_id = GAME.last_user_id++;
	positions[this_user_id] = {x:0,y:0,z:0};
	socket.set('id', this_user_id);
	socket.emit( 'connected', GAME.positions );
	update_client_position( socket, this_user_id );

	console.log( "connected one.." );

	socket.on( 'ship control', function( socket, key ){ socket.get( 'id', function( err, id_value ){
			GAME.positions[id_value].x--;
			update_client_position( socket, id_value ); 
	});});

});

app.listen(8000);



