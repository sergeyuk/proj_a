var url = require("url");
var ShipClass = require( "./ship_class" ).ShipClass;

function handler (req, res) {
	if (req.method === "GET" || req.method === "HEAD") {
		var pathname = url.parse(req.url).pathname;
		console.log( pathname );
		if( pathname === '/' ) pathname = '/index.html';
		fs.readFile('.' + pathname, function (err, data) {
			if (err) {
				res.writeHead(500);
				return res.end('Error loading ' + pathname);
			}

			res.writeHead(200);
			res.end(data);
		});
	}
}


var GAME = {
	last_user_id : 0,
	default_spawn_point : {x:0,y:0,z:0},
	ships : {}
};

var app = require('http').createServer(handler)
var io = require('socket.io').listen(app)
var fs = require('fs')

console.log("start the stuff....");
//io.set( 'log level', 1 );

io.sockets.on('connection', function (socket) {
	
	var this_user_id = GAME.last_user_id++;
//	socket.set('id', this_user_id);	
	console.log( "connected one.." );

	var new_ship = new ShipClass();
	new_ship.mesh = 1;
	new_ship.set_position( GAME.default_spawn_point );
	GAME.ships[this_user_id] = new_ship;
	socket.set('id', this_user_id );
	socket.emit( "connected", [this_user_id, GAME.ships] );
	socket.broadcast.emit( 'connected', [this_user_id, GAME.ships] );	

	socket.on( 'ship control on', function(key){ 
		socket.get( 'id', function( err, user_id ){
			console.log( "ship control on. id=" + user_id );
			if(key == 0 ) GAME.ships[user_id].set_forward( -1 );
			if(key == 1 ) GAME.ships[user_id].set_turn( 1 );
			if(key == 2 ) GAME.ships[user_id].set_forward( 1 );
			if(key == 3 ) GAME.ships[user_id].set_turn( -1 );
		});
	});

	socket.on( 'ship control off', function(key){ 
		socket.get( 'id', function( err, user_id ){
			if(key == 0 ) GAME.ships[user_id].set_forward( 0 );
			if(key == 1 ) GAME.ships[user_id].set_turn( 0 );
			if(key == 2 ) GAME.ships[user_id].set_forward( 0 );
			if(key == 3 ) GAME.ships[user_id].set_turn( 0 );
		});
	});

	socket.on('disconnect', function() {
		socket.get( 'id', function( err, user_id ){
			delete GAME.ships[user_id];
			console.log( "broadcasting disconnect message. Client id=" + user_id );
			socket.broadcast.emit( 'disconnected', user_id );
		});
	});
});

app.listen(8000);

var sync_function = function(){
	for( var ship_id in GAME.ships ){
		GAME.ships[ship_id].tick( 0.1 );
	}
	io.sockets.emit('update', GAME.ships);
}

setInterval( sync_function, 100 );

