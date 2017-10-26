class projectile extends object{
	constructor(pos = new vec2(), parentwep = new weapon()){
		super();
		this.physBody.frictionAir = 0;
		this.setPos(pos.clone());
		this.parentWep = parentwep;
		this._team = 0;
	}
	
	get team(){
		return this._team;
	}
	
	setTeam(team){
		this._team = team;
	}
	
	hitCheck(bodies = physWorld.bodies){
		var cols = Matter.Query.point(bodies, this.pos.toPhysVector())
		var ths = this;
		cols.forEach(function(col){
			if(col.id == ths.physBody.id){
				cols.splice(cols.indexOf(col), 1);
				return;
			}
			ths.hit(col.gameObject, ths.pos);
		});
		return cols.length > 0;
	}
	collideWith(body, collision, force, colpoint){
		console.log(colpoint);
		this.hit(body.gameObject, colpoint);
	}
	hit(gameObject, colpos){
	}
	
	update(){
		super.update();
		this.hitCheck();
	};
	draw(rdrr){
		super.draw(rdrr);
	};
}

class simpleBullet extends projectile{
	constructor(pos, parentwep){
		super(pos);
		this.disableCollisions();
		this.life = 60;
		this.caliber = 2;
		this.nodmg = false;
		this.parentWep = parentwep;
	}
	
	hitCheck(bodies = physWorld.bodies){
		if(super.hitCheck(bodies))
			return true;
		var stpos = this.pos;
		var epos = this.pos.plus(this.vel);
		var cols = raycast(bodies, stpos, epos);
		for(var i = cols.length - 1; i >= 0; i--){
			if(cols[i].body.id == this.physBody.id ||
				(cols[i].body.gameObject.team == this.team && this.team != 0))
				cols.splice(i, 1);
		}
		if(cols.length > 0){
			this.hit(cols[0].body.gameObject, cols[0].point);
		}
	}
	hit(gameObject, colpos){
		super.hit(gameObject);
		
		this.burst(colpos);
		gameObject.force(this.vel.multiply(0.00002 * this.caliber), this.pos);
		if(!this.nodmg)
			gameObject.damage(this.caliber);
		
		if(gameObject.isDead){
			this.nodmg = true;
			this.hitCheck(object.bodiesFromObjectList(gameObject.gibs));
			if(this.parentWep)
				this.parentWep.destroyObject(gameObject);
		}
		
		this.destroy();
	}
	burst(colpos){
		particleEffect.explosiveBurst(colpos, 3, 4, 0.2);
	}
	
	update(){
		super.update();
		this.life -= 1;
		if(this.life <= 0)
			this.destroy();
	}
	draw(rdrr){
		var ln = new line(this.pos.minus(this.vel.multiply(0.5)), this.pos.plus(this.vel.multiply(0.5)));
		rdrr.push(ln, null, "#ff0", 3);
	}
}
class sbul_enemy extends simpleBullet{
	draw(rdrr){
		var ln = new line(this.pos.minus(this.vel.normalized(5)), this.pos.plus(this.vel.normalized(5)));
		var col = lastTime % 8 < 4 ? "#ff0" : "#f00";
		rdrr.push(ln, null, col, 5);
	}
}
class sbul_silkStrike extends simpleBullet{
	constructor(pos, parentwep){
		super(pos, parentwep);
		this.particlepos = pos.clone();
		this.particleSystem = new pSystem_linearConnection(false);
		this.particleSystem.worldAdd();
		this.caliber = 1;
	}
	
	worldRemove(){
		this.particleSystem.destroyOnEmpty = true;
		super.worldRemove();
	}
	
	hit(gameObject, colpos){
		this.setPos(colpos.clone())
		this.handleParticles();
		super.hit(gameObject, colpos);
	}
	burst(colpos){
		particleEffect.explosiveBurst(colpos, 3, 5, 1, 2, [200, 255, 255, 1]);
	}
	handleParticles(){
		while(this.particlepos.distance(this.pos) > 10){
			this.particlepos = this.particlepos.plus(this.pos.minus(this.particlepos).normalized(10));
			var p = new extParticle(this.particlepos.clone(), [240, 255, 255, 1]);
			p.vel = vec2.fromAng(rand(-Math.PI, Math.PI), 0.2);
			p.life = 15;
			p.fadeStart = p.life;
			p.add(this.particleSystem);
		}
	}
	
	update(){
		this.handleParticles();
		super.update();
	}
	draw(rdrr){
		var ln = new line(this.pos.minus(this.vel.multiply(0.5)), this.pos.plus(this.vel.multiply(0.5)));
		rdrr.push(ln, null, "#dff", 3);
	}
}

class missile extends projectile{
	constructor(pos = new vec2(), parentwep = new weapon()){
		super(pos, parentwep);
		this.target = null;
		this.setBody(bodyFromVerts([
			new vec2(-4, 0),
			new vec2(0, 2),
			new vec2(2, 0),
			new vec2(0, -2)
			]));
		this.outlineCol = "#FA0";
		this.setPos(pos);
		this.life = 0;
		this.aim = 0;
	}
	
	setTarget(target){
		this.target = target;
	}
	collideWith(body, collision, force){
		if(this._inWorld)
			this.detonate();
	}
	destroy(){
		super.destroy();
	}
	detonate(){
		this.destroy();
		AOE.createExplosion_char(this.pos, 40, 2, 0.002, this.team);
		AOE.createExplosion(this.pos, 40, 0, 0.001, [projectile]);
		particleEffect.smallMissileExplode(this.pos);
	}
	
	update(){
		this.setVel(this.vel.multiply(0.95));
		this.setAngle(this.vel.direction);
		
		if(this.life > 10)
			this.seek(this.target);
		
		this.life += 1;
	}
	seek(target = null){
		if(!this.tracerParticles){
			this.tracerParticles = new pSystem_linearConnection();
			this.tracerParticles.worldAdd();
		}
		
		if(!this.target) {
			this.force(vec2.fromAng(this.aim).multiply(0.00003), this.pos);
			this.addTracerParticle();
			return;
		}
		
		this.aim = this.target.pos.minus(this.pos).direction;
		if(this.target.isDead){
			if(this.target.gibs.length > 0)
				this.target = this.target.gibs[iRand(0, this.target.gibs.length)];
			else this.target = null;
		}
		
		this.force(vec2.fromAng(this.aim).multiply(0.00003), this.pos);
		this.addTracerParticle();
	}
	addTracerParticle(){
		var p1 = new extParticle(vec2.fromOther(this.pos), [255, 200, 0, 1], 2);
		p1.size = 1;
		p1.fadeStart = p1.life;
		p1.renderMode = 0;
		p1.add(this.tracerParticles);
	}
}

class proj_grappleHook extends projectile{
	constructor(pos, parentwep){
		super(pos, parentwep);
		this.setBody(proj_grappleHook.defaultBody);
		this.hooked = false;
		this.grappleTarget = null;
		this.projTarget = null;
	}
	
	hit(gameObject, colpos){
		if(this.hooked)
			return;
		this.hooked = true;
		this.parentWep.latch(this, gameObject, colpos, gameObject.angle);
		if(this.grappleTarget){
			var targ = this.grappleTarget.gameObj;
			var off = this.grappleTarget.offset || new vec2();
			var angOff = this.grappleTarget.angOff || 0;
			
			console.log(off.rotate(targ.angle - angOff));
			var toff = this.pos.minus(gameObject.pos);
			var cstr = gameObject.createConstraint(
				toff, 
				targ, 
				off.rotate(targ.angle - angOff), 
				0.002);
			var strand = new cstr_grappleRope(cstr);
			strand.parentWep = this.parentWep;
			strand.worldAdd();
			this.parentWep.constrainer = strand;	
		}
		else if(this.projTarget){
			var off = gameObject.pos.minus(colpos);
			var rotoff = gameObject.angle;
			this.projTarget.grappleTarget = {
				gameObj: gameObject,
				offset: off,
				angOff: rotoff };
			this.projTarget = null;
		}
		
		this.destroy();
	}
	
	draw(rdrr){
		super.draw(rdrr);
		if(this.grappleTarget){
			var ln = new line(this.pos, this.grappleTarget.gameObj.pos);			
			rdrr.push(ln, null, "#fff", 1);
		}
	}
	
	static get defaultBody(){
		var size = 3;
		return bodyFromVerts([
			new vec2(-size, -size),
			new vec2(size, 0),
			new vec2(-size, size)
		]);
	}
}

class AOE{
	constructor(pos = new vec2(), radius = 100, extypes = []){
		this.colBody = Matter.Bodies.circle(pos.x, pos.y, radius);
		this.typeExclusions = extypes;
	}
	
	get pos(){
		return vec2.fromOther(this.colBody.position);
	}
	setPos(pos){
		this.colBody.position = pos.toPhysVector();
		return this;
	}
	setCollisionMask(colbody, pos = null){
		this.colBody = colbody;
		if(pos) return this.setPos(pos);
		return this;
	}
	
	collisions(obs = physObjects){
		var cols = [];
		for (var i = 0; i < obs.length; i++) {
            var bodyA = obs[i].physBody;
			
			var res = false;
			for(var k in this.typeExclusions)
				if(obs[i] instanceof this.typeExclusions[k]){
					res = true; 
					break;
				}
			if(res) continue;
            if (Matter.Bounds.overlaps(bodyA.bounds, this.colBody.bounds)) {
                for (var j = bodyA.parts.length === 1 ? 0 : 1; j < bodyA.parts.length; j++) {
                    var part = bodyA.parts[j];
                    if (Matter.Bounds.overlaps(part.bounds, this.colBody.bounds)) {
                        var collision = Matter.SAT.collides(part, this.colBody);
                        if (collision.collided) {
                            collision.body = collision.bodyA = collision.bodyB = bodyA;
                            cols.push(obs[i]);
							console.log(collision);
                            break;
                        }
                    }
                }
            }
        }
		return cols;
	}
	
	applyEffect(){
		var cols = this.collisions();
		for(var i in cols){
			this.onHit(cols[i]);
		}
	}
	onHit(col){}
	
	static objectsInRadius(pos, radius){
		return new AOE(pos, radius).collisions();
	}
	static createExplosion(pos, radius = 100, damage = 2, force = 0.002, extypes = []){
		var exp = new AOE_explosion(pos, radius, damage, force, extypes);
		AOEs.push(exp);
	}
	static createExplosion_char(pos, radius, damage = 2, force = 0.002){
		var exp = new AOE_explosion_character(pos, radius, damage, force);
		AOEs.push(exp);
	}
}

class AOE_explosion extends AOE{
	/// TODO::
	///  Create detailed explosion physics {
	///  collect all collisions
	///  for each collision
	///   iterate through vertices of body
	///   get max and min theta vertices around explosion's origin for total force applied to body
	///   apply force to selected vertices based on distance from origin
	///  }
	constructor(pos, radius = 100, damage = 2, force = 0.002, extypes = []){
		super(pos, radius, extypes);
		this.damage = damage;
		this.force = force;
	}
	
	onHit(col){
		col.damage(this.damage, enum_damageType.destructive);
		var force = col.pos.minus(this.pos).normalized(this.force);
		col.force(force, this.pos);
	}
}
class AOE_explosion_character extends AOE_explosion{
	constructor(pos, radius = 100, damage = 2, force = 0.002, team = -1){
		super(pos, radius, damage, force, team);
		this.team = team;
	}
	
	collisions(objs = physObjects){
		var cols = super.collisions(physObjects);
		var r = [];
		for(var i = cols.length - 1; i >= 0; i--){
			if(cols[i] instanceof character)
				if(cols[i].team != this.team || cols[0].team == -1)
					r.push(cols[i]);
		}
		return r;
	}
}

