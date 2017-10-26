class enemy extends character{
	constructor(){
		super();
		this.outlineCol = "#f44";
		this.controller = new enemyAI();
	}
	
	get team(){
		return 2;
	}
	
	start(){
		
	}
	
	burst(){
		particleEffect.smallEnemyExplode(this.pos);
	}
	destroy(){
		this.burst();
		this.shatter();
		super.destroy();
	}
	worldAdd(){
		var r = super.worldAdd();
		if(r)
			enemyCount++;
		return r;
	}
	worldRemove(){
		var r = super.worldRemove();
		if(r)
			enemyCount--;
		return r;
	}
	
	dampenMovement(factor = 0.5){
		this.setVel(this.vel.multiply(factor));
	}
	facingTarget(leniency = 0.5){
		return Math.abs(angDist(this.controller.target.pos.minus(this.pos).direction, this.angle)) <= leniency;
	}
	approachVel(vel, strength){
		var dif = vel.minus(this.vel);
		var acc = vec2.fromAng(dif.direction, Math.min(dif.distance(), strength));
		
		Matter.Body.setVelocity(this.physBody, this.vel.plus(acc));
	}
	approachAngle(angle, strength){
		var dif = angDist(this.angle, angle);
		var dfact = Math.abs(dif) / (2.1) + 0.5;
		var fvel = Math.sign(dif) * strength;
		var acc = fvel * dfact;
		if(Math.abs(dif) < Math.abs(acc))
			acc = dif;
		
		this.approachAngVel(acc, strength);
	}
	approachAngVel(angvel, strength){
		var dif = angvel - this.physBody.angularVelocity;
		var acc = strength * Math.sign(dif);
		if(Math.abs(dif) < Math.abs(acc))
			acc = dif;
		
		Matter.Body.setAngularVelocity(this.physBody, this.physBody.angularVelocity + acc);
	}
}

class dummy extends enemy{
	constructor(){
		super();
		this.constructPhysBody();
		this.controller = enemyAI.AI_dummy(this);
		this.health = 1;
		this._fThrust = false;
	}
	
	constructPhysBody(){
		this.physBody = bodyFromVerts([
			Matter.Vector.create(-10, -8),
			Matter.Vector.create(0, -8),
			Matter.Vector.create(10, 0),
			Matter.Vector.create(0,  8),
			Matter.Vector.create(-10, 8)
		]);
	}
	
	detonate(){
		this.destroy();
		AOE.createExplosion(this.pos, 100, 0, 0.001);
	}
	
	start(){
		this.setAngle(rand(-Math.PI, Math.PI));
	}
	
	draw(rdrr){
		if(this._fThrust){
			var tpos = this.pos.plus(vec2.fromAng(this.angle, -5));
			particleEffect.thrust(tpos, this.angle, 0.7);
		}
		super.draw(rdrr);
	}
}
class shooter extends enemy{
	constructor(){
		super();
		this.constructPhysBody();
		this.controller = enemyAI.AI_shooter(this);
		this.setAngle(rand(-Math.PI, Math.PI));
		this.wep = new wep_simpleAIGun();
		this.health = 10;
	}
	
	burst(){
		particleEffect.mediumEnemyExplode(this.pos);
	}
	
	constructPhysBody(){
		var pol = new polygon();
		pol.setVerts([
			new vec2(-1, -2), 
			new vec2(0, -4), 
			new vec2(1, -2), 
			new vec2(1, -1), 
			new vec2(2, -1), 
			new vec2(3, -3), 
			new vec2(3, 1), 
			new vec2(2, 2), 
			new vec2(0, 3), 
			new vec2(-2, 2), 
			new vec2(-3, 1), 
			new vec2(-3, -3), 
			new vec2(-2, -1), 
			new vec2(-1, -1)
			]);
		pol.transform(new vec2(), Math.PI / -2, 5);
		this._renderPoly = pol;
		
		var verts = [];
		for(var i = pol._points.length - 1; i >= 0; i--){
			var vert = pol._points[i].toPhysVector();
			verts.push(vert);
		}
		this.physBody = bodyFromVerts(verts);
	}
	get poly(){
		this._renderPoly.setPos(this.pos);
		this._renderPoly.setRotation(this.angle);
		var p = new polygon();
		var verts = [];
		for(var i = this._renderPoly.absVerts.length - 1; i >= 0; i--){
			verts.push(this._renderPoly.absVerts[i].clone());
		}
		p.setVerts(verts);
		return p;
	}
}

class enemySegment extends enemy{
	constructor(){
		super();
		this.parentEnemy = null;
	}
	
	damage(dmg, type, point = null){
		super.damage(dmg, type, point);
		this.parentEnemy.damage(dmg, type);
	}
	
	destroy(){
		super.destroy();
		this.parentEnemy.destroySegment(this);
	}
	worldAdd(){
		if(physObjects.includes(this))
			return false;
		this.physBody.gameObject = this;
		Matter.World.add(physWorld, this.physBody);
		physObjects.push(this);
		this._inWorld = true;
		return true;
	}
	worldRemove(){
		if(!physObjects.includes(this))
			return false;
		physObjects.splice(physObjects.indexOf(this), 1);
		
		Matter.World.remove(physWorld, this.physBody);
		for(var i = this.constrainers.length - 1; i >= 0; i--){
			this.constrainers[i].worldRemove();
		}
		
		this._inWorld = false;
		return true;
	}
}
class segmentedEnemy extends enemy{
	constructor(){
		this.segments = [];
	}
	get physBody(){
		return this.segments[0];
	}
	
	addSegment(segment, index = this.segments.length){
		segment.parentEnemy = this;
		this.segments.splice(segment, 0, index);
	}
	destroySegment(segment){
	}
	
	worldAdd(){
		var r = true;
		for(var i in this.segments){
			if(!this.segments[i].worldAdd())
				r = false;
		}
		enemyCount++;
		return r;
	}
	worldRemove(){
		var r;
		for(var i in this.segments){
			if(!this.segments[i].worldRemove())
				r = false;
		}
		enemyCount--;
		return r;
	}
}