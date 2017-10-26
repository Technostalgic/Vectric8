class character extends object{
	constructor(){
		super(null);
		this.visual = null;
		this.health = 10;
		this.controller = new AI();
	}
	
	get team(){
		return 0;
	}
	
	collideWith(body, collision, force){
		super.collideWith(body, collision, force);
		this.controller.collideWith(body, collision, force);
	}
	damage(dmg, type, point = this.pos){
		super.damage(dmg, type, point);
	}
	
	inLOS(pos, exceptions = []){
		//checks if the given position is in the line of sight
		var rc = raycast(physWorld.bodies, this.pos, pos, false);
		for(var i = rc.length - 1; i >= 0; i--)
			if(exceptions.includes(rc[i].body.gameObject))
				rc.splice(i, 1);
		return rc.length <= 0;
	}
	
	update(){
		super.update();
		this.controller.update(1);
	}
}

class player extends character{
	constructor(){
		super();
		this.outlineCol = "#4f4"
		this.constructPhysBody();
		this.controls = player.defaultControls;
		this.defWeapon = new wep_simpleGun();
		this.pWeapons = [new wep_doomsday(), new wep_ionCannon(), new wep_silkStrike(), null];
		this.pWep = 0;
		this.sWeapons = [new eq_grapplingHook(), null];
		this.sWep = 0;
		this.consumables = [null];
		this.cWep = 0;
		
		this.inventory = [];
		this._maxRotSpeed = 0.12;
		
		this._selecting = 0;
		this._selectMode = 0;
		this._selFlag = false;
		this._fThrust = false;
		this._bThrust = false;
		this._lThrust = false;
		this._rThrust = false;
		
		this.tracerParticlesL = null;
		this.tracerParticlesR = null;
	}
	
	constructPhysBody(){
		this.physBody = bodyFromVerts([
			new Matter.Vector.create(-10, -8),
			new Matter.Vector.create(10, 0),
			new Matter.Vector.create(-10, 8)
		]);
		this.physBody.frictionAir = 0;
		this.physBody.friction = 0;
		//Matter.Body.setInertia(this.physBody, Infinity);
	}
	
	get team(){
		return 1;
	}
	get primaryWep(){
		if(!this.pWeapons[this.pWep])
			return this.defWeapon
		return this.pWeapons[this.pWep];
	}
	get secondaryWep(){
		return this.sWeapons[this.sWep];
	}
	get consumableItem(){
		return this.consumables[this.cWep];
	}
	
	resetStateVars(){
		this._fThrust = false;
		this._bThrust = false;
		this._lThrust = false;
		this._rThrust = false;
	}
	
	destroy(){
		this.shatter();
	}
	update(){
		super.update();
		this.updateEquipment();
		this.applyMovementDamping();
		if(this.tracerParticlesAreSet())
			if(!(this._fThrust || 
				this._bThrust ||
				this._lThrust ||
				this._rThrust ))
				this.unsetTracerParticles();
	}
	updateEquipment(){
		this.primaryWep.update(this);
		if(this.secondaryWep)
			this.secondaryWep.update(this);
	}
	control(keystate){
		var strafing = keystate[this.controls.strafe];
		var selecting = keystate[this.controls.selectEquipment];
		
		if(!selecting){
			if(keystate[this.controls.forward])
				this.moveForward();
			if(keystate[this.controls.backward])
				this.moveBackward();
			
			this._selecting *= 0.75;
		}
		else{
			this._selecting += 0.1;
			if(this._selecting > 1) 
				this._selecting = 1;
			
			if(keystate[this.controls.forward]){
				if(!this._selFlag)
					this.selectUp();
				this._selFlag = true;
			}
			else if(keystate[this.controls.backward]){
				if(!this._selFlag)
					this.selectDown();
				this._selFlag = true;
			}
			else if(keystate[this.controls.rotateLeft]){
				if(!this._selFlag)
					this._selectMode = wrapValue(this._selectMode - 1, 3);
				this._selFlag = true;
			}
			else if(keystate[this.controls.rotateRight]){
				if(!this._selFlag)
					this._selectMode = wrapValue(this._selectMode + 1, 3);
				this._selFlag = true;
			}
			else
				this._selFlag = false;
		}
		
		if(Math.abs(this.physBody.angularVelocity) > this._maxRotSpeed){
			this.applyRotationDamping();
		}
		else{
			if(!selecting){
				if(strafing){
					this.applyRotationDamping();
					
					if(keystate[this.controls.rotateLeft])
						this.strafeLeft();
					if(keystate[this.controls.rotateRight])
						this.strafeRight();
				} else {
					var rotated = false;
					if(keystate[this.controls.rotateLeft]){
						this.rotateLeft();
						rotated = true;
					}
					if(keystate[this.controls.rotateRight]){
						this.rotateRight();
						rotated = !rotated;
					}
					if(!rotated){
						this.applyRotationDamping();
					}
				}
			}
			else this.applyRotationDamping();
		}
		
		if(keystate[this.controls.triggerPrimary])
			this.triggerPrimary();
		if(keystate[this.controls.triggerSecondary])
			this.triggerSecondary();
	}
	
	tracerParticlesAreSet(){
		return this.tracerParticlesL != null;
	}
	unsetTracerParticles(){
		this.tracerParticlesL.destroyOnEmpty = true;
		this.tracerParticlesR.destroyOnEmpty = true;
		this.tracerParticlesL = null;
		this.tracerParticlesR = null;
	}
	setTracerParticles(){
		this.tracerParticlesL = new pSystem_linearConnection();
		this.tracerParticlesR = new pSystem_linearConnection();
		this.tracerParticlesL.worldAdd();
		this.tracerParticlesR.worldAdd();
	}
	
	selectUp(){
		switch(this._selectMode){
			case 0:
				// switch weapon
				this.pWep = wrapValue(this.pWep + 1, this.pWeapons.length);
				break;
			case 1:
				// switch consumable
				this.cWep = wrapValue(this.cWep + 1, this.consumables.length);
				break;
			case 2:
				// switch equipment
				this.sWep = wrapValue(this.sWep + 1, this.sWeapons.length);
				console.log(this.sWep);
				break;
		}
	}
	selectDown(){
		switch(this._selectMode){
			case 0:
				// switch weapon
				this.pWep = wrapValue(this.pWep - 1, this.pWeapons.length);
				break;
			case 1:
				// switch consumable
				this.cWep = wrapValue(this.cWep - 1, this.consumables.length);
				break;
			case 2:
				// switch equipment
				this.sWep = wrapValue(this.sWep - 1, this.sWeapons.length);
				break;
		}
	}
	moveForward(){
		if(!this.tracerParticlesAreSet())
			this.setTracerParticles();
		this._fThrust = true;
		if(isRenderFrame())
			this.emitThrustParticles();
		var fang = vec2.fromAng(this.physBody.angle, 0.0001);
		Matter.Body.applyForce(this.physBody, this.pos, fang.toPhysVector());
	}
	moveBackward(){
		if(!this.tracerParticlesAreSet())
			this.setTracerParticles();
		this._bThrust = true;
		if(isRenderFrame())
			this.emitTracerParticles();
		var fang = vec2.fromAng(this.physBody.angle, -0.0001);
		Matter.Body.applyForce(this.physBody, this.pos, fang.toPhysVector());
	}
	strafeLeft(){
		if(!this.tracerParticlesAreSet())
			this.setTracerParticles();
		this._lThrust = true;
		if(isRenderFrame())
			this.emitTracerParticles();
		
		var fang = vec2.fromAng(this.physBody.angle - Math.PI / 2, 0.0001);
		Matter.Body.applyForce(this.physBody, this.pos, fang.toPhysVector());
	}
	strafeRight(){
		if(!this.tracerParticlesAreSet())
			this.setTracerParticles();
		this._rThrust = true;
		if(isRenderFrame())
			this.emitTracerParticles();
		
		var fang = vec2.fromAng(this.physBody.angle + Math.PI / 2, 0.0001);
		Matter.Body.applyForce(this.physBody, this.pos, fang.toPhysVector());
	}
	
	applyMovementDamping(){
		Matter.Body.setVelocity(this.physBody, 
			{x:this.physBody.velocity.x * 0.99, y:this.physBody.velocity.y * 0.99});
	}
	movementStrafe(){}
	rotateLeft(){
		if(this.physBody.angularVelocity < -this._maxRotSpeed){
			this.applyRotationDamping();
			return;
		}
		Matter.Body.setAngularVelocity(this.physBody, 
			this.physBody.angularVelocity + -0.004 );
	}
	rotateRight(){
		if(this.physBody.angularVelocity > this._maxRotSpeed){
			this.applyRotationDamping();
			return;
		}
		Matter.Body.setAngularVelocity(this.physBody, 
			this.physBody.angularVelocity + 0.004 );
	}
	applyRotationDamping(){
		Matter.Body.setAngularVelocity(this.physBody, this.physBody.angularVelocity * 0.9);
	}
	triggerPrimary(){
		this.primaryWep.trigger(this);
	}
	triggerSecondary(){
		if(this.secondaryWep)
			this.secondaryWep.trigger(this);
	}
	swap(){}
	
	emitThrustParticles(){
		var p3 = new extParticle(this.pos, [255,Math.floor(Math.random() * 128 + 128),0, 1], 2);
		p3.pos = p3.pos.plus(vec2.fromAng(Math.random() * Math.PI * 2, 3));
		p3.vel = vec2.fromAng(this.angle + (Math.random() - 0.5) * 0.5, Math.random() * -10 - 10);
		p3.damping = 0.8;
		p3.size = 3;
		p3.renderMode = 1;
		p3.life = 8;
		p3.fadeStart = 5;
		p3.add();
		
		this.emitTracerParticles();
	}
	emitTracerParticles(){
		var p1 = new extParticle(vec2.fromOther(this.physBody.vertices[0]), [0, 255, 0, 1], 2);
		var p2 = new extParticle(vec2.fromOther(this.physBody.vertices[2]), [0, 255, 0, 1], 2);
		p1.fadeStart = p1.life;
		p2.fadeStart = p2.life;
		p1.renderMode = 0;
		p2.renderMode = 0;
		p1.add(this.tracerParticlesL);
		p2.add(this.tracerParticlesR);
	}
	
	drawFThrust(rdrr){
		var tpos = this.pos.plus(vec2.fromAng(this.angle, -5));
		particleEffect.thrust(tpos, this.angle, 1);
	}
	drawBThrust(rdrr){
		var dAng = Math.PI / 2;
		var tpos1 = this.pos.plus(vec2.fromAng(this.angle - dAng, 4));
		var tpos2 = this.pos.plus(vec2.fromAng(this.angle + dAng, 4));
		
		particleEffect.thrust(tpos1, this.angle + Math.PI - dAng / 2, 0.5);
		particleEffect.thrust(tpos2, this.angle + Math.PI + dAng / 2, 0.5);
	}
	
	draw(rdrr){
		if(this._fThrust)
			this.drawFThrust(rdrr);
		if(this._bThrust)
			this.drawBThrust(rdrr);
		this.primaryWep.drawHUD(this, rdrr);
		if(this.secondaryWep)
			this.secondaryWep.drawHUD(this, rdrr);
		super.draw(rdrr);
	}
	
	static get defaultControls(){
		return {
			forward:38,
			backward:40,
			rotateLeft:37,
			rotateRight:39,
			triggerPrimary:67,
			triggerSecondary:88,
			selectEquipment:83,
			strafe:90,
			swap:32
		};
	}
}