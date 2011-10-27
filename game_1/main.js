
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var GameClass = function(){
	this.container;
	this.stats;
	this.camera; 
	this.scene; 
	this.renderer; 
	this.objects={};
	this.particleLight;
	this.pointLight;
	
	this.socket;
}

var ShipClass = function(){
	this.material;
	this.mesh;
}

var GAME = new GameClass();
//var gg_ship = new ShipClass();

init();
init_socket_io();
animate();

	function init_socket_io(){
		var socket = io.connect();

		// initial data response
		socket.on('connected', function (data) {
			console.log('successfully connceted');
			create_ships_from_server_data(data);
		});

		socket.on('disconnected', function( data ){
			delete GAME.objects[data]
		});

		socket.on( 'pos update', function( data ){
				var client_id = data[0];
				var client_pos = data[1];
				if (GAME.objects[client_id] === undefined){
					GAME.objects[client_id] = new ShipClass();
					load_ship( client_id, client_pos );
				}
				else{
					if(GAME.objects[client_id].ship_mesh)
						GAME.objects[client_id].ship_mesh.position.set( client_pos.x,client_pos.y,client_pos.z);
				}
			});
		GAME.socket = socket;
	}	

	function create_ships_from_server_data( data ){
		for( client_id in data ){
			GAME.objects[client_id] = new ShipClass();
			load_ship( client_id, data[client_id] );
		}
	}

	function handle_keyboard(event){
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
			GAME.socket.emit( 'ship control', 40-keyCode );
		}
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
		window.addEventListener('keydown',handle_keyboard,false);
	}
	
	function load_ship( client_id, pos ){
		var new_ship = GAME.objects[client_id];
		new_ship.material = new THREE.MeshLambertMaterial( {
			map: THREE.ImageUtils.loadTexture( "obj/Gg/Gg.png" )
			});
			
		var loader = new THREE.JSONLoader( true );	
		loader.load( { model: "obj/Gg/Gg.js", callback: function( geometry ) { 
			new_ship.ship_mesh = new THREE.Mesh( geometry, new_ship.material );
			GAME.scene.add(new_ship.ship_mesh);
			new_ship.ship_mesh.position.set( pos.x, pos.y, pos.z );
			} } );
	}
	
	var last_time_t = 0;
	
	function animate() {
		requestAnimationFrame( animate );
		/*
		var timer = new Date().getTime() / 1000;
		var dt = timer - last_time_t;
		last_time_t = timer;
		if( dt > 0.033 ) dt = 0.033;
		tick( dt );*/
		GAME.renderer.render( GAME.scene, GAME.camera );
	}
	
	function tick( dt ){
		if( gg_ship.mesh ) {
			gg_ship.mesh.position.x = 20*Math.sin(new Date().getTime()/1000);// 10 * dt;
			}
	}
