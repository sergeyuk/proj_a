
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var GameClass = function(){
	this.container;
	this.stats;
	this.camera;
	this.cameraTarget;
	this.scene; 
	this.renderer; 
	this.world;
	this.particleLight;
	this.pointLight;
	this.directionalLight;
	this.ambientLight;
	
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
GAME.world = new WorldClass();

init();
init_socket_io();
animate();

	function create_shoot( owner_ship_id ){
		GAME.world.add_shot( owner_ship_id );
		create_projectile_mesh( GAME.world.projectiles.length - 1 );	
	}

	function create_projectile_mesh( projectile_id ){
		var projectile_mesh = new THREE.Mesh( new THREE.SphereGeometry( 1, 32, 16 ), new THREE.MeshBasicMaterial( { color:0xFF0000, wireframe:false} ) );
		GAME.scene.add( projectile_mesh );
		if( GAME.world.projectiles.length > projectile_id ){
			GAME.world.projectiles[projectile_id].mesh = projectile_mesh;
		}
		else{
			alert( 'wrong projectile ID passed' );
		}
	}
	
	function delete_projectile( id ){
		GAME.scene.remove( GAME.world.projectiles[id].mesh );
	}

	function create_particle_system(){
		var geometry = new THREE.Geometry();
		var sprite = THREE.ImageUtils.loadTexture( "textures/sprites/spark1.png" );
		for ( i = 0; i < 10000; i++ ) {
			var x = 2000 * Math.random() - 1000;
			var y = 2000 * Math.random() - 1000;
			var z = 2000 * Math.random() - 1000;

			vector = new THREE.Vector3( x, y, z );
			geometry.vertices.push( new THREE.Vertex( vector ) );
		}	
	}
	
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
			GAME.scene.remove( GAME.world.ships[data].mesh );
			delete GAME.world.ships[data];
		});

		socket.on( 'update', function( data ){
				for( ship_id in data ){
					var server_ship = data[ship_id];
					var client_ship = GAME.world.ships[ship_id];
					client_ship.set_updated_position( server_ship.pos );
					client_ship.vel			= server_ship.vel;
					client_ship.acc 		= server_ship.acc;
					client_ship.forward_value	= server_ship.forward_value;
					client_ship.turn_value 		= server_ship.turn_value;
					client_ship.set_updated_angle( server_ship.angle );
					client_ship.angular_vel		= server_ship.angular_vel;
				}
			});
		socket.on( 'ship control update', function( data ){
				var ship_id = data[0];
				var forward = data[1];
				var turn = data[2];
				var client_ship = GAME.world.ships[ship_id];
				client_ship.set_forward( forward );
				client_ship.set_turn( turn );
			});
		socket.on( 'ship shoot event', function( data ){
			create_shoot( data[0] );
		});
		GAME.socket = socket;
	}	


	function init() {
		GAME.container = document.createElement( 'div' );
		document.body.appendChild( GAME.container );

		GAME.camera = new THREE.CombinedCamera( window.innerWidth, window.innerHeight, 45, 1, 10000, -2000, 10000 );
		GAME.camera.position.set( 0, -15, 5 );
		GAME.camera.up.x = GAME.camera.up.y = 0;
		GAME.camera.up.z = 1;
		GAME.cameraTarget = new THREE.Vector3(0,0,0); 
		GAME.camera.lookAt( GAME.cameraTarget );

		GAME.scene = new THREE.Scene();
		
		GAME.renderer = new THREE.WebGLRenderer();
		GAME.renderer.setSize(window.innerWidth, window.innerHeight);
		
		GAME.container.appendChild( GAME.renderer.domElement );
		
		GAME.ambientLight = new THREE.AmbientLight( 0x111111 );
		GAME.scene.add( GAME.ambientLight );
				
		GAME.pointLight = new THREE.PointLight( 0xFFFFFF );		
		GAME.pointLight.position.set( 10, 50, 130 );
		GAME.scene.add(GAME.pointLight);
		
		
		GAME.directionalLight = new THREE.DirectionalLight( 0xffffff );
		GAME.directionalLight.position.set( 10, 50, 130 ).normalize();
		GAME.scene.add( GAME.directionalLight );

		
		var plane = new THREE.Mesh( new THREE.PlaneGeometry(1000,1000,20,20), new THREE.MeshBasicMaterial( { color:0x555555, wireframe:true} ) );

		GAME.scene.add( plane );

		window.addEventListener('keydown',handle_keyboard_down,false);
		window.addEventListener('keyup',handle_keyboard_up,false);
		
		GAME.world.set_delete_projectile_callback( delete_projectile );
	}
	

	function create_ships_from_server_data( data ){
		for( client_id in data ){
			GAME.world.ships[client_id] = new ShipClass();
			load_ship( client_id, data[client_id] );
		}
	}

	function load_ship( client_id, server_obj ){
		var new_ship = GAME.world.ships[client_id];
		new_ship.set_position( server_obj.pos );

		var mesh_id = server_obj.mesh;
		
/////////////////////////////////////////////////		
				var path = "textures/skybox/";
				var format = '.jpg';
				var urls = [
						path + 'px' + format, path + 'nx' + format,
						path + 'py' + format, path + 'ny' + format,
						path + 'pz' + format, path + 'nz' + format
					];

				var reflectionCube = THREE.ImageUtils.loadTextureCube( urls );
///////////////////////////////////////////////////
			if( 1 ){
				var ambient = 0x111111, diffuse = 0xaaaaaa, specular = 0x080810, shininess = 2;

				var shader = THREE.ShaderUtils.lib[ "normal" ];
				var uniforms = THREE.UniformsUtils.clone( shader.uniforms );

				uniforms[ "tNormal" ].texture = THREE.ImageUtils.loadTexture( "obj/Gg/Gg_NRM.jpg" );
				uniforms[ "tAO" ].texture = THREE.ImageUtils.loadTexture( "obj/Gg/Gg_OCC.jpg" );

				uniforms[ "tDiffuse" ].texture = THREE.ImageUtils.loadTexture( "obj/Gg/Gg.png" ); // ok png?

				uniforms[ "enableAO" ].value = true;
				uniforms[ "enableDiffuse" ].value = true;
				uniforms[ "enableSpecular" ].value = false;
				uniforms[ "enableReflection" ].value = true;

				uniforms[ "uDiffuseColor" ].value.setHex( diffuse );
				//uniforms[ "uSpecularColor" ].value.setHex( specular );
				uniforms[ "uAmbientColor" ].value.setHex( ambient );

				uniforms[ "uShininess" ].value = shininess;

				uniforms[ "tCube" ].texture = reflectionCube;
				//uniforms[ "uReflectivity" ].value = 0.1;
				uniforms[ "uReflectivity" ].value = 0.1;

				var parameters = { fragmentShader: shader.fragmentShader, vertexShader: shader.vertexShader, uniforms: uniforms, lights: true, fog: false };
				var material = new THREE.ShaderMaterial( parameters );

				//loader = new THREE.JSONLoader( true );
				//document.body.appendChild( loader.statusDomElement );

				//loader.load( "obj/leeperrysmith/LeePerrySmith.js", function( geometry ) { createScene( geometry, 100, material ) } );

				new_ship.material = material;
			}
			else{
				new_ship.material = new THREE.MeshLambertMaterial( materials_array[mesh_id] );
			}
			
		var loader = new THREE.JSONLoader( true );	
		loader.load( { model: meshes_array[mesh_id], callback: function( geometry ) { 
		
			geometry.computeTangents();

			new_ship.mesh = new THREE.Mesh( geometry, new_ship.material );
			GAME.scene.add(new_ship.mesh);
			new_ship.mesh.position.set( new_ship.pos.x, new_ship.pos.y, new_ship.pos.z );
			} } );
	}
	
	var last_time_t = 0;
	
	function animate() {
		var timer = new Date().getTime() / 1000;
		var dt = timer - last_time_t;
		last_time_t = timer;
		if( dt > 0.033 ) dt = 0.033;
		tick( dt );

		if( GAME.this_ship_id != -1 ){
			var this_ship = GAME.world.ships[GAME.this_ship_id];
			if( this_ship ){
				GAME.camera.position.x = -25 * this_ship.dir.x + this_ship.pos.x;
				GAME.camera.position.y = -25 * this_ship.dir.y + this_ship.pos.y;
				//console.log( "updated camera x,y=" + GAME.camera.position.x + ', ' + GAME.camera.position.y );
				GAME.cameraTarget.set( this_ship.pos.x, this_ship.pos.y, this_ship.pos.z );	
				GAME.camera.lookAt( GAME.cameraTarget );
			}
		}
		GAME.renderer.render( GAME.scene, GAME.camera );
		
		requestAnimationFrame( animate );
	}
	
	function tick( dt ){
		GAME.world.tick(dt);
		GAME.world.update_render();
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
			if(key == 0 ) GAME.world.ships[this_user_id].set_forward( -1 );
			if(key == 1 ) GAME.world.ships[this_user_id].set_turn( 1 );
			if(key == 2 ) GAME.world.ships[this_user_id].set_forward( 1 );
			if(key == 3 ) GAME.world.ships[this_user_id].set_turn( -1 );
			//console.log('Pressed the key. is forward = ' + GAME.world.ships[this_user_id].forward_value );
			GAME.socket.emit( 'ship control on', 40-keyCode );
		}
		
		//console.log( keyCode );
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

			if(key == 0 ) GAME.world.ships[this_user_id].set_forward( 0 );
			if(key == 1 ) GAME.world.ships[this_user_id].set_turn( 0 );
			if(key == 2 ) GAME.world.ships[this_user_id].set_forward( 0 );
			if(key == 3 ) GAME.world.ships[this_user_id].set_turn( 0 );
			//console.log('Released the key. is forward = ' + GAME.world.ships[this_user_id].forward_value );
			GAME.socket.emit( 'ship control off', 40-keyCode );
		}
		if( keyCode == 32 ){
			create_shoot( GAME.this_ship_id );
			GAME.socket.emit( 'ship shot', [GAME.this_ship_id] );
		}
	}

