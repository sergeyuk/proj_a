
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var GameClass = function(){
	this.container;
	this.stats;
	this.camera; 
	this.scene; 
	this.renderer; 
	this.ships={};
	this.particleLight;
	this.pointLight;
	
	this.socket;
	this.this_ship_id = -1;
}

var materials_array = {
	1 : { map: THREE.ImageUtils.loadTexture( "obj/Gg/Gg.png" ) }
};

var meshes_array = { 
	1 : "obj/Gg/Gg.js"
};

var GAME = new GameClass();


init();
init_socket_io();
animate();

	function init_socket_io(){
		var socket = io.connect();

		socket.on('connected', function (data) {
			console.log('successfully connceted');
			var new_user_id = data[0];
			if( GAME.this_ship_id == -1 ){
				GAME.this_ship_id = new_user_id;
				create_ships_from_server_data(data[1]);
			}
			else{
				var one_user_array = {};
				
				one_user_array[ new_user_id ] = data[1][new_user_id];
				create_ships_from_server_data( one_user_array );
			}
		});

		socket.on('disconnected', function( data ){
			GAME.scene.remove( GAME.ships[data].mesh );
			delete GAME.ships[data];
		});

		socket.on( 'update', function( data ){
//return;
//console.log('update received');
				for( ship_id in data ){
					var server_ship = data[ship_id];
					var client_ship = GAME.ships[ship_id];
					client_ship.dir			= server_ship.dir;
					client_ship.pos			= server_ship.pos;
					client_ship.vel			= server_ship.vel;
					client_ship.acc 		= server_ship.acc;
					client_ship.forward_value	= server_ship.forward_value;
					client_ship.turn_value 		= server_ship.turn_value;
					client_ship.angle		= server_ship.angle;
					client_ship.angular_vel		= server_ship.angular_vel;
				}
			});
		GAME.socket = socket;
	}	


	function init() {
		GAME.container = document.createElement( 'div' );
		document.body.appendChild( GAME.container );

		GAME.camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
		GAME.camera.position.set( 0, 0, 50 );

		GAME.scene = new THREE.Scene();
		
		GAME.renderer = new THREE.WebGLRenderer();
		GAME.renderer.setSize(window.innerWidth, window.innerHeight);
		
		GAME.container.appendChild( GAME.renderer.domElement );
		
		GAME.pointLight = new THREE.PointLight( 0xFFFFFF );		
		GAME.pointLight.position.set( 10, 50, 130 );
		GAME.scene.add(GAME.pointLight);
		window.addEventListener('keydown',handle_keyboard_down,false);
		window.addEventListener('keyup',handle_keyboard_up,false);
	}
	

	function create_ships_from_server_data( data ){
		for( client_id in data ){
			GAME.ships[client_id] = new ShipClass();
			load_ship( client_id, data[client_id] );
		}
	}

	function load_ship( client_id, server_obj ){
		var new_ship = GAME.ships[client_id];
		new_ship.set_position( server_obj.pos );

		var mesh_id = server_obj.mesh;
		new_ship.material = new THREE.MeshLambertMaterial( materials_array[mesh_id] );
			
		var loader = new THREE.JSONLoader( true );	
		loader.load( { model: meshes_array[mesh_id], callback: function( geometry ) { 
			new_ship.mesh = new THREE.Mesh( geometry, new_ship.material );
			GAME.scene.add(new_ship.mesh);
			new_ship.mesh.position.set( new_ship.pos.x, new_ship.pos.y, new_ship.pos.z );
			} } );
	}
	
	var last_time_t = 0;
	
	function animate() {
		requestAnimationFrame( animate );
		
		var timer = new Date().getTime() / 1000;
		var dt = timer - last_time_t;
		last_time_t = timer;
		if( dt > 0.033 ) dt = 0.033;
		tick( dt );
		GAME.renderer.render( GAME.scene, GAME.camera );
	}
	
	function tick( dt ){
		for( ship in GAME.ships ){
			GAME.ships[ship].tick( dt );
			GAME.ships[ship].update_render();
		}
	}

	function handle_keyboard_down(event){
		var keyCode = 0;

		if( event == null ){
			keyCode = window.event.keyCode;
			window.event.preventDefault();
		}
		else {
			keyCode = event.keyCode;
			event.preventDefault();
		}
		if(keyCode>=37 && keyCode <=40)	{
			var key = 40-keyCode;
			var this_user_id = GAME.this_ship_id;
			if(key == 0 ) GAME.ships[this_user_id].set_forward( -1 );
			if(key == 1 ) GAME.ships[this_user_id].set_turn( 1 );
			if(key == 2 ) GAME.ships[this_user_id].set_forward( 1 );
			if(key == 3 ) GAME.ships[this_user_id].set_turn( -1 );
			console.log('Pressed the key. is forward = ' + GAME.ships[this_user_id].forward_value );
			GAME.socket.emit( 'ship control on', 40-keyCode );
		}
	}

	function handle_keyboard_up(event){
		var keyCode = 0;

		if( event == null ){
			keyCode = window.event.keyCode;
			window.event.preventDefault();
		}
		else {
			keyCode = event.keyCode;
			event.preventDefault();
		}
		if(keyCode>=37 && keyCode <=40)	{
			var key = 40-keyCode;
			var this_user_id = GAME.this_ship_id;

			if(key == 0 ) GAME.ships[this_user_id].set_forward( 0 );
			if(key == 1 ) GAME.ships[this_user_id].set_turn( 0 );
			if(key == 2 ) GAME.ships[this_user_id].set_forward( 0 );
			if(key == 3 ) GAME.ships[this_user_id].set_turn( 0 );
			console.log('Released the key. is forward = ' + GAME.ships[this_user_id].forward_value );
			GAME.socket.emit( 'ship control off', 40-keyCode );
		}
	}

