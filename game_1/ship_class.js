var ShipClass = function(){
	this.material;
	this.mesh;
	this.dir		= {x:0,y:1,z:0};

	this.pos		= {x:0,y:0,z:0};
	this.new_pos		= {x:0,y:0,z:0};
	this.vel		= 0;//[0,0,0];
	this.acc 		= 0;//[0,0,0];

	this.angle		= 0;
	this.new_angle		= 0;
	this.angular_vel	= 0;

	this.forward_value	= 0;
	this.turn_value		= 0;

	this.tick_position = function( dt ){
		var forward_acceleration = 5.0;
		var friction_acceleration = 0.5 * this.vel;
		this.acc = forward_acceleration * this.forward_value - friction_acceleration;		

		this.vel = this.vel + this.acc * dt;
		if( this.vel < 0.2 && this.forward_value != 1 ){
			this.vel = 0;
			this.acc = 0;
		}				

		if( this.forward_value == 1 ){
			console.log( 'dt=' + dt + 'velocity=' + this.vel );
		}

		var set_newpos_instantly = ( 	this.pos.x == this.new_pos.x && 
						this.pos.y == this.new_pos.y && 
						this.pos.z == this.new_pos.z );

		this.pos.x = this.pos.x + this.dir.x * this.vel * dt;
		this.pos.y = this.pos.y + this.dir.y * this.vel * dt;
		this.pos.z = this.pos.z + this.dir.z * this.vel * dt;
	}

	this.tick_rotation = function( dt ) {
		var turn_speed = 60.0;
		this.angular_vel = turn_speed * this.turn_value;
		this.angle += this.angular_vel * dt;

		this.update_dir_vector();
	}

	this.update_dir_vector = function(){
		this.dir.x = Math.sin( this.angle * Math.PI / 180 )
		this.dir.y = Math.cos( this.angle * Math.PI / 180 );
	}

	this.tick = function( dt ){
		this.tick_rotation( dt );		
		this.tick_position( dt );
	}

	this.update_render = function(){
		if( this.mesh ){
			if( this.mesh.position.y != this.pos.y ) {
				console.log('Update render pos for a ship. Change pos from ('  
					+ this.mesh.position.x + ','
					+ this.mesh.position.y + ','
					+ this.mesh.position.z + ') to (' 
					+ this.pos.x + ','
					+ this.pos.x + ','
					+ this.pos.x + ')');
			}
			this.mesh.position.set( this.pos.x, this.pos.y, this.pos.z);
			this.mesh.rotation.z = -this.angle * Math.PI / 180;
		}
	}

	this.set_position = function( _pos )	{ this.pos.x = _pos.x; this.pos.y = _pos.y; this.pos.z = _pos.z;}
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
