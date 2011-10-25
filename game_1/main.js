
if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var GameClass = function(){
	this.container;
	this.stats;
	this.camera; 
	this.scene; 
	this.renderer; 
	this.objects;
	this.particleLight;
	this.pointLight;
}

var ShipClass = function(){
	this.material;
	this.mesh;
}

var GAME = new GameClass();
var gg_ship = new ShipClass();

init();
load_ship();
animate();
	
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
	}
	
	function load_ship(){
		gg_ship.material = new THREE.MeshLambertMaterial( {
			map: THREE.ImageUtils.loadTexture( "obj/Gg/Gg.png" )
			});
			
		var loader = new THREE.JSONLoader( true );	
		loader.load( { model: "obj/Gg/Gg.js", callback: function( geometry ) { 
			gg_ship.mesh = new THREE.Mesh( geometry, gg_ship.material );
			GAME.scene.add(gg_ship.mesh);
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
		if( gg_ship.mesh ) {
			gg_ship.mesh.position.x = 20*Math.sin(new Date().getTime()/1000);// 10 * dt;
			}
	}