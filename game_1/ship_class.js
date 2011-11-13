var ShipClass = function(){
	this.material;
	this.mesh;
	this.dir		= {x:0,y:1,z:0};
	this.pos		= {x:0,y:0,z:0};
	this.vel		= 0;//[0,0,0];
	this.acc 		= 0;//[0,0,0];
	this.forward_value	= 0;
	this.turn_value		= 0;

	this.tick = function( dt ){
		var forward_acceleration = 1.0;
		var friction_acceleration = 0.2 * this.vel;
		this.acc = forward_acceleration * this.forward_value - friction_acceleration;
		if( this.turn_value == 1 ){
			
		}
		
		this.vel = this.vel + this.acc * dt;
		if( this.vel < 0.03 ){
			this.vel = 0;
			this.acc = 0;
		}				

		this.pos.x = this.pos.x + this.dir.x * this.vel * dt;
		this.pos.y = this.pos.y + this.dir.y * this.vel * dt;
		this.pos.z = this.pos.z + this.dir.z * this.vel * dt;
	}

	this.update_render = function(){
		if( this.mesh ){
			this.mesh.position.set( this.pos.x, this.pos.y, this.pos.z);
		}
	}

	this.set_position = function( _pos )	{ this.pos = _pos; }
	this.get_position = function()		{ return this.pos; }
	this.get_velocity = function()		{ return this.vel; }
	this.get_acceleration = function() 	{ return this.acc; }
	this.get_direction = function() 	{ return this.dir; }
	this.set_forward = function( fwd_value) { this.forward_value = fwd_value; }
	this.set_turn = function( turn_val )	{ this.turn_value = turn_val; }
}


try{
	exports.ShipClass = ShipClass;
	global.ShipClass = ShipClass;
}
catch(e){}
