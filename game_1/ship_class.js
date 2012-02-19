function normalize( vec ) {
	var denominator = veclen( vec );

	var return_vec = { x:0, y:0, z:0 };
	if( denominator > 0 ){
		return_vec.x = (vec.x / denominator ); 
		return_vec.y = (vec.y / denominator ); 
		return_vec.z = (vec.z / denominator );
	}
	return return_vec;	
};

function veclen( vec ){
	return Math.sqrt( vec.x*vec.x + vec.y*vec.y + vec.z*vec.z );
}

function compute_sq_distance( v1, v2 ){
	//console.log( 'compute_sq_distance: v1: ' + v1 + ', v2: ' + v2 );
	var dx = v1.x - v2.x;
	var dy = v1.y - v2.y;
	var dz = v1.z - v2.z;
	return dx*dx + dy*dy + dz*dz;
}

var ShipClass = function(){
	this.material;
	this.mesh;
	this.dir		= {x:0,y:1,z:0};
	this.correction_dir	= {x:0,y:0,z:0};
	this.correction_length 	= 0;

	this.pos		= {x:0,y:0,z:0};
	this.vel		= 0;//[0,0,0];
	this.acc 		= 0;//[0,0,0];

	this.angle		= 0;
	this.delta_angle	= 0;
	this.angular_vel	= 0;

	this.turning_angle_deg = 30;
	this.max_turning_angle_deg = 45;
	
	this.forward_value	= 0;
	this.turn_value		= 0;

	this.set_updated_angle = function( new_angle ){
		//this.delta_angle = new_angle - this.angle;
		this.angle = new_angle;
	};

	this.apply_angle_correction = function( dt ){
		if( this.delta_angle != 0 ){
			var sign = this.delta_angle < 0 ? -1 : 1;
			var correction_angular_speed = 60.0 + this.delta_angle;
			var abs_angle = Math.abs( this.delta_angle );
			var value_to_change = correction_angular_speed * dt;
			value_to_change = Math.min( value_to_change, abs_angle );
			value_to_change *= sign;
			this.angle += value_to_change;
			this.delta_angle -= value_to_change;
		}
	};

	this.set_updated_position = function( new_pos ){
		//compute correction dir and length
		var dir = {};
		dir.x = new_pos.x - this.pos.x;
		dir.y = new_pos.y - this.pos.y;
		dir.z = new_pos.z - this.pos.z;

		var length = veclen( dir );

		if( length > 0 ){
			dir.x = (dir.x / length ); 
			dir.y = (dir.y / length ); 
			dir.z = (dir.z / length );
		}
		this.correction_dir = dir;
		this.correction_length = length;
	};

	this.apply_pos_correction = function( dt ){
		if( this.correction_length > 0 ){
			//console.log( "correction length: " + this.correction_length );
			var correction_speed = 8.0 + this.correction_length;
			
			var new_pos = {};
			new_pos.x = this.pos.x + this.correction_dir.x * correction_speed * dt;
			new_pos.y = this.pos.y + this.correction_dir.y * correction_speed * dt;
			new_pos.z = this.pos.z + this.correction_dir.z * correction_speed * dt;

			var delta_vec = {};
			delta_vec.x = new_pos.x - this.pos.x;			
			delta_vec.y = new_pos.y - this.pos.y;
			delta_vec.z = new_pos.z - this.pos.z;
			
			var delta_vec_len = veclen( delta_vec );

			if( delta_vec_len > this.correction_length || ((this.correction_length - delta_vec_len) < 0.1) ){
				this.pos.x += this.correction_dir.x * this.correction_length;
				this.pos.y += this.correction_dir.y * this.correction_length;
				this.pos.z += this.correction_dir.z * this.correction_length;				
				this.correction_length = 0;
			}
			else{
				this.pos.x = new_pos.x;
				this.pos.y = new_pos.y;
				this.pos.z = new_pos.z;
				this.correction_length -= delta_vec_len;
			}
		}		 
	};

	this.tick_position = function( dt ){
		var forward_acceleration = 21.0;
		var friction_acceleration = 0.3 * this.vel;
		this.acc = forward_acceleration * this.forward_value - friction_acceleration;		

		this.vel = this.vel + this.acc * dt;
		if( this.vel < 0.2 && this.forward_value != 1 ){
			this.vel = 0;
			this.acc = 0;
		}

		this.apply_pos_correction( dt );

		this.pos.x = this.pos.x + this.dir.x * this.vel * dt;
		this.pos.y = this.pos.y + this.dir.y * this.vel * dt;
		this.pos.z = this.pos.z + this.dir.z * this.vel * dt;
	}

	this.tick_rotation = function( dt ) {
		this.apply_angle_correction( dt );

		var turn_speed = 60.0;
		this.angular_vel = turn_speed * this.turn_value;
		this.angle += this.angular_vel * dt;

		if( this.turn_value == 1 || this.turn_value == -1 ){
			var speed_multiplier = ( ( this.turning_angle_deg < 0 && this.turn_value == 1 ) || ( this.turning_angle_deg > 0 && this.turn_value == -1 ) ) ? 2 : 1;
			this.turning_angle_deg += this.turn_value * speed_multiplier * turn_speed * dt;
			if( this.turn_value == 1 )
				this.turning_angle_deg = Math.min( this.turning_angle_deg, this.max_turning_angle_deg );
			else
				this.turning_angle_deg = Math.max( this.turning_angle_deg, -this.max_turning_angle_deg );
		}
		else if( this.turn_value == 0 ){
			if( this.turning_angle_deg > 0 ){
				//console.log( 'turning_angle_deg: ' + this.turning_angle_deg );
				this.turning_angle_deg = Math.max( this.turning_angle_deg - 2 * turn_speed * dt, 0 );
				//console.log( 'turning_angle_deg: ' + this.turning_angle_deg );
				//exit();
			}
			else if( this.turning_angle_deg < 0 ){
				this.turning_angle_deg = Math.min( this.turning_angle_deg + 2 * turn_speed * dt, 0 );
			}
		}
		
		//console.log( 'turning_angle_deg' + this.turning_angle_deg );
		
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
			this.mesh.position.set( this.pos.x, this.pos.y, this.pos.z);
			this.mesh.rotation.z = -this.angle * Math.PI / 180;
			this.mesh.rotation.y = Math.cos( this.angle * Math.PI / 180 ) * ( this.turning_angle_deg * Math.PI / 180 );
			this.mesh.rotation.x = Math.sin( this.angle * Math.PI / 180 ) * ( this.turning_angle_deg * Math.PI / 180 );
		}
	}

	this.set_position = function( _pos )	{ this.pos.x = _pos.x; this.pos.y = _pos.y; this.pos.z = _pos.z;}
	this.get_position = function()		{ return this.pos; }
	this.get_velocity = function()		{ return this.vel; }
	this.get_acceleration = function() 	{ return this.acc; }
	this.get_direction = function() 	{ return this.dir; }
	this.set_forward = function( fwd_value) { this.forward_value = fwd_value; }
	this.set_turn = function( turn_val )	{ this.turn_value = turn_val; }
	this.get_forward = function() { return this.forward_value; }
	this.get_turn = function()	{ return this.turn_value; }
}

var ProjectileClass = function() {
	this.dir;
	this.vel;
	this.pos;
	this.owner_id;
	this.max_len;
	this.start;
	this.mesh;

	this.tick = function( dt ){
		this.pos.x += ( this.dir.x * this.vel * dt ); 
		this.pos.y += ( this.dir.y * this.vel * dt );
		this.pos.z += ( this.dir.z * this.vel * dt );
		var total_distance = veclen( {x:this.pos.x-this.start.x, y:this.pos.y-this.start.y, z:this.pos.z-this.start.z} );
		//console.log( 'total_distance = ' + total_distance );
		if( total_distance > this.max_len ){
			console.log( "Projectile should be deleted now." );
			return 1;
		}
		
		return 0;
	}
	
	this.update_render = function(){
		if( this.mesh ){
			this.mesh.position.set( this.pos.x, this.pos.y, this.pos.z);
		}	
	}
};

var WorldClass = function(){
	this.ships = {};
	this.projectiles = [];
	
	this.tick = function( dt ){		
		//console.log( dt );
		for( var ship in this.ships ){
			this.ships[ship].tick( dt );
		}
		
		var should_clear_projectiles_array = false;
		
		for( var i = 0; i < this.projectiles.length; i++ ){
			if( this.projectiles[i].tick( dt ) == 1 ){
				this.on_delete_projectile_callback ? this.on_delete_projectile_callback( i ) : 0;
				delete this.projectiles[i];
				should_clear_projectiles_array = true;
			}
		}
		
		if( should_clear_projectiles_array ){
			var old_len = this.projectiles.length;
			var newArr = new Array();for (k in this.projectiles) if(this.projectiles[k]) newArr.push(this.projectiles[k])
			this.projectiles = newArr;
			var new_len = this.projectiles.length;
			console.log( 'cleared some projectiles. old len: ' + old_len + ', new len: ' + new_len );
		}
		
		this.tick_collision( dt );
	}
	
	
	this.on_delete_projectile_callback;
	this.on_ship_ship_collision_callback;
	this.on_ship_projectile_collision_callback;
	
	this.set_ship_ship_collision_callback 		= function( callback ){ this.on_ship_ship_collision_callback = callback; }
	this.set_ship_projectile_collision_callback = function( callback ){ this.on_ship_projectile_collision_callback = callback; }
	this.set_delete_projectile_callback 		= function( callback ){ this.on_delete_projectile_callback = callback; }
	
	this.tick_collision = function( dt ){
		var ships = this.ships;
		var ship_ids = [];
		
		for( ship_id in ships ){ 
			ship_ids.push( ship_id ); 
		}
		
		var total_ships_num = ship_ids.length;
		
		for( var i = 0; i < total_ships_num; i++ ){
			var ship1_id = ship_ids[i];
			var ship1 = ships[ ship1_id ];
			
			for( var j = i + 1; j < total_ships_num; j++ ){
				var ship2 = ships[ ship_ids[j] ];
				var sq_distance = compute_sq_distance( ship1.get_position(), ship2.get_position() );
				//console.log( 'ship/ship. sq_distance=' + sq_distance );
				
				if( sq_distance < 4 ){
					this.onShipShipCollisionCallback ? this.onShipShipCollisionCallback( ship1, ship2 ) : 0;
					console.log( 'ship/ship collision happened.' );
					break;
				}
			}
			
			for( var j = 0; j < this.projectiles.length; j++ ){
				var projectile = this.projectiles[j];
				if( projectile.owner_id != ship1_id ){
					var sq_distance = compute_sq_distance( ship1.get_position(), projectile.pos );
					if( sq_distance < 4 ){
						this.onShipProjectileCollisionCallback ? this.onShipProjectileCollisionCallback( ship1, projectile ) : 0;
						console.log( 'ship/projectile collision' );
						break;
					}
				}
			}
		}
	}
	
	this.update_render = function(){
		for( var ship in this.ships ){
			this.ships[ship].update_render();
		}
		
		for( var i = 0; i < this.projectiles.length; i++ ){
			this.projectiles[i].update_render();
		}
	}
	
	this.add_projectile = function( pos, dir, type, owner_id ){
		var p = new ProjectileClass();
		p.dir = dir;
		p.pos = pos;
		p.vel = 50.0; // depends on type
		p.max_len = 300;// depends on type
		p.owner_id = owner_id;
		p.start = {x:pos.x, y:pos.y, z:pos.z};
		
		this.projectiles.push( p );
	}
	
	this.add_shot = function( ship_id ){
		if( this.ships.hasOwnProperty( ship_id ) ){
			var ship = this.ships[ship_id];
			
			var pos = ship.get_position();	//get from ship
			var dir = ship.get_direction(); //get from ship
			var type = 1; 
			var owner_id = ship_id;
			
			this.add_projectile( {x:pos.x,y:pos.y,z:pos.z}, {x:dir.x,y:dir.y,z:dir.z}, type, owner_id );
		}
	}
	
};

try{
	exports.ShipClass = ShipClass;
	global.ShipClass = ShipClass;
	
	exports.WorldClass = WorldClass;
	global.WorldClass = WorldClass;
	
	exports.ProjectileClass = ProjectileClass;
	global.ProjectileClass = ProjectileClass;
}
catch(e){}
