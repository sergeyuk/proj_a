
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

var update_client_position = function( socket, id_value ){
	socket.emit( 'pos update', [id_value, positions[id_value]] );
	socket.broadcast.emit( 'pos update', [id_value, positions[id_value]] );
};

io.sockets.on('connection', function (socket) {
	socket.broadcast.emit( 'new user' );

	var this_user_id = last_user_id++;
	positions[this_user_id] = [0, 0];
	socket.set('id', this_user_id);
	socket.emit( 'connected', [this_user_id, positions] );
	update_client_position( socket, this_user_id );


	console.log( "connected one.." );

	socket.on( 'left pressed', function(){ socket.get( 'id', function( err, id_value ){
			positions[id_value][0]--;
			update_client_position( socket, id_value ); });});

	socket.on( 'up pressed', function(){ socket.get( 'id', function( err, id_value ){
			positions[id_value][1]--;
			update_client_position( socket, id_value ); });});

	socket.on( 'right pressed', function(){ socket.get( 'id', function( err, id_value ){
			positions[id_value][0]++;
			update_client_position( socket, id_value ); });});

	socket.on( 'down pressed', function(){ socket.get( 'id', function( err, id_value ){
			positions[id_value][1]++;
			update_client_position( socket, id_value ); });});

});

app.listen(8000);



