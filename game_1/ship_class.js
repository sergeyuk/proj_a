var ShipClass = function(){
	this.material;
	this.ship_mesh;
	this.dir		= [0,0];
	this.pos		= [0,0,0];
	this.vel		= 0;//[0,0,0];
	this.acc 		= 0;//[0,0,0];
	this.force_acc 		= 0;//[0,0,0];

	this.tick = function( dt ){
		
	}
	this.set_position = function( _pos ){
		this.pos = _pos;
	}
}


try{
	exports.ShipClass = ShipClass;
	global.ShipClass = ShipClass;
}
catch(e){}
