class object{
	constructor(body = null){
		if(!body)
			this.setBody(object.defaultBody);
		else
			this.setBody(body);
		this.outlineCol = "#fff";
		this.fillCol = "#000";
		this.health = 1;
		this.gibs = [];
		this.constrainers = [];
		this.corpse = Matter.Composite.create();
		this._dead = false;
		this._inWorld = false;
	}
	setBody(body, pos = null){
		var lpos = !!this.physBody ? this.pos.clone() : new vec2();
		if(pos)
			lpos = pos;
		Matter.Body.setPosition(body, new vec2().toPhysVector());
		this.physBody = body;
		body.gameObject = this;
		this.setPos(lpos);
	}
	
	get team(){
		return 0;
	}
	get pos(){
		if(this.physBody)
			return new vec2(this.physBody.position.x, this.physBody.position.y);
	}
	get vel(){
		if(this.physBody)
			return new vec2(this.physBody.velocity.x, this.physBody.velocity.y);
	}
	get angle(){
		if(this.physBody)
			return this.physBody.angle;
	}
	get angVel(){
		if(this.physBody)
			return this.physBody.angularVelocity;
	}
	get density(){
		if(this.physBody)
			return this.physBody.density;
	}
	get mass(){
		if(this.physBody)
			return this.physBody.mass;
	}
	get ID(){
		return this.physBody.id;
	}
	
	setPos(vec){
		Matter.Body.setPosition(this.physBody, vec.toPhysVector());
	}
	setVel(vec){
		Matter.Body.setVelocity(this.physBody, vec.toPhysVector());
	}
	setAngle(angle){
		Matter.Body.setAngle(this.physBody, angle);
	}
	setAngVel(angvel){
		Matter.Body.setAngularVelocity(this.physBody, angvel);
	}
	setDensity(density){
		Matter.Body.setDensity(this.physBody, density);
		var moment = this.physBody.inertia / (this.physBody.mass / 6);
		this.physBody.inertia = moment * (this.physBody.mass / 6);
	}
	
	force(force, point = this.pos){
		//console.log("-----");
		//console.log(this.vel);
		//console.log(force);
		Matter.Body.applyForce(
			this.physBody,
			point.toPhysVector(), 
			force.toPhysVector());
		//console.log(this.vel);
	}
	damage(dmg, type, point = null){
		this.health -= dmg;
		this.deathCheck();
	}
	deathCheck(){
		if(this._dead) return true;
		if(this.isDead){
			this.destroy();
			this._dead = true;
			return true;
		}
		return false;
	}
	get isDead(){
		return this.health <= 0;
	}
	
	get poly(){
		//returns the polygon to draw
		//var istart: so that if a body has multiple parts, it doesn't draw the first part(since the first part is just the parent body)
		var r  = new polygon();
		var verts = [];
		var istart = this.physBody.parts.length <= 1 ? 0 : 1;
		for(var i = this.physBody.parts.length - 1; i >= istart; i--){
			for(var k = this.physBody.parts[i].vertices.length - 1; k >= 0; k--){
				if(this.physBody.parts[i].vertices[k].isInternal)
					continue;
				var vv = new vec2(
					this.physBody.parts[i].vertices[k].x , 
					this.physBody.parts[i].vertices[k].y );
				verts.push(vv);
			}
		}
		r.setVerts(verts);
		return r;
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
			console.log(this.constrainers.toString() + i.toString());
			this.constrainers[i].worldRemove();
		}
		
		this._inWorld = false;
		return true;
	}
	createConstraint(lpos, oobj, opos, stiff, len = null){
		// creates a constraint object between this object and another specified
		// lpos: the starting position of the constraint
		// oobj: the object to constrain this object to
		// opos: the ending position of the constraint
		// stiff: how stiff the constraint is (0 to 1)
		// len: the length of the constraint
		var cstr = Matter.Constraint.create({
			bodyA: this.physBody,
			bodyB: oobj.physBody,
			pointA: lpos.toPhysVector(),
			pointB: opos.toPhysVector(),
			stiffness: stiff,
			length: len
		});
		
		return cstr;
	}
	shatter(){
		if(this.physBody.area <= 125){
			this.worldRemove();
			return [];
		}
		
		var bits = [];
		if(this.physBody.parts.length > 1){
			for(var i = this.physBody.parts.length - 1; i >= 1; i--){
				var verts = this.physBody.parts[i].vertices;
				var ob = new debris(bodyFromVerts(verts));
				ob.setPos(vec2.fromOther(this.physBody.parts[i].position));
				ob.setAngle(this.physBody.parts[i].angle);
				ob.outlineCol = this.outlineCol;
				ob.setVel(this.vel);
				ob.setAngVel(this.angVel);
				ob.worldAdd();
				bits.push(ob);
			}
		}
		else{
			var center = this.physBody.position;
			for(var i = this.physBody.vertices.length - 1; i >= 0; i--){
				var i0 = i - 1;
				var i2 = i + 1;
				if(i0 < 0) i0 = this.physBody.vertices.length - 1;
				if(i2 > this.physBody.vertices.length - 1) i2 = 0;
				var md0 = vec2.fromOther(this.physBody.vertices[i0] ).plus( 
					vec2.fromOther(this.physBody.vertices[i])
					).multiply(0.5);
				var md2 = vec2.fromOther(this.physBody.vertices[i2] ).plus( 
					vec2.fromOther(this.physBody.vertices[i])
					).multiply(0.5);
				var verts = [md0, this.physBody.vertices[i], md2, center];
				var bcent = Matter.Vertices.centre(verts);
				var bod = bodyFromVerts(verts, bcent);
				var ob = new debris(bod);
				ob.setPos(vec2.fromOther(bcent));
				ob.outlineCol = this.outlineCol;
				ob.setVel(this.vel);
				ob.setAngVel(this.angVel);
				ob.worldAdd();
				bits.push(ob);
			}
		}
		
		this.worldRemove();
		this.gibs = bits;
		for(var i = bits.length - 1; i >= 0; i--)
			Matter.Composite.add(this.corpse, bits[i].physBody);
		return this.gibs;
	}
	destroy(){
		this.worldRemove();
		this.health = Math.min(0, this.health);
	}
	
	disableCollisions(){
		this.physBody.collisionFilter = {};
	}
	collideWith(body, collision, force, colpoint){
		///
		//		MATTER.JS ENGINE MODIFICATION CALLBACK
		//		see matter.js line 3175
		///
		var absForce = force.distance();
		
		if(absForce >= 0.2){
			var dmg = absForce * 5;
			this.damage(dmg, enum_damageType.bashing);
		}
	}
	
	update(){
		for(var i = this.constrainers.length - 1; i >= 0; i--)
			this.constrainers[i].update();
	};
	draw(rdrr){
		this.drawConstraints(rdrr);
		rdrr.push(this.poly, this.fillCol, this.outlineCol, 2);
	};
	drawConstraints(rdrr){
		for(var i = this.constrainers.length - 1; i >= 0; i--)
			this.constrainers[i].draw(rdrr);
	}
	
	static bodiesFromObjectList(oblist){
		var r = [];
		for(var i = oblist.length - 1; i >= 0; i--)
			r.push(oblist[i].physBody);
		return r;
	}
	static get defaultBody(){
		var size = 2;
		return bodyFromVerts([
			new vec2(size,-size), 
			new vec2(size,size), 
			new vec2(-size,size), 
			new vec2(-size,-size)
		]);
	}
}

class debris extends object{
	constructor(bod = null){
		if(bod == null)
			bod = debris.createRandBody();
		super(bod);
		this.physBody.frictionAir = 0;
		this.physBody.frictionStatic = 0;
		this.color = "#fff";
		this.health = this.physBody.area / 25;
	}

	static createRandBody(size = 100){
		var verts = [];
		for(var i = rand(4,5); i > 0; i--)
			verts.push(new vec2(rand(0, size), rand(0, size)));
		var cent = new vec2();
		for(var i in verts)
			cent = cent.plus(verts[i])
		cent = cent.multiply(verts.length);
		for(var i in verts)
			verts[i] = verts[i].minus(cent);
		for(var i in verts)
			verts[i] = verts[i].toPhysVector();
		verts = Matter.Vertices.clockwiseSort(Matter.Vertices.create(verts));
		return bodyFromVerts(verts);
	}

	destroy(){
		this.shatter();
	}
	
	worldAdd(){
		var r = super.worldAdd();
		if(r)
			debrisCount++;
		return r;
	}
	worldRemove(){
		var r = super.worldRemove();
		if(r)
			debrisCount--;
		return r;
	}
}

class item extends object{
	constructor(){
		super();
		this.setBody(item.defaultBody);
		this.displayTxt = "WEP";
	}
	
	pickUp(plr){
		plr.inventory.push(this);
		this.pickParticles(plr);
		this.worldRemove();
	}
	pickParticles(plr){
		var syst = new pSystem_seek().addTarget(plr);
		syst.seekSpeed = 0.5;
		for(var i = 17; i > 0; i--){
			var part = new extParticle(this.pos, [0, iRand(100, 255), 255, 1]);
			part.damping = 0.95;
			part.life = rand(30, 160);
			part.vel = vec2.fromAng(rand(0, Math.PI * 2), rand(5, 10));
			part.size = 3;
			part.add(syst);
		}
		syst.worldAdd();
	}
	collideWith(body, collision, force){
		if(!this._inWorld)
			return;
		var ob = body.gameObject;
		if(ob instanceof player)
			this.pickUp(ob);
	}
	
	destroy(){
		this.pickParticles(null);
		super.destroy();
	}
	
	draw(rdrr){
		this.outlineCol = lastTime % 200 >= 100 ? "#00F" : "#0FF";
		super.draw(rdrr);
		
		var tx = new textRender(this.pos, this.displayTxt, 14);
		rdrr.push(tx, "#FFF");
	}
	
	static get defaultBody(){
		var size = 20;
		var sides = 6;
		
		var points = [];
		for(var i = sides; i > 0; i--){
			var vert = vec2.fromAng(i / sides * (Math.PI * 2), size);
			points.push(vert.clone());
		}
		var bod = bodyFromVerts(points);
		return bod;
	}
}

function bodyFromVerts(verts, pos = new vec2()){
	var bod = Matter.Bodies.fromVertices(pos.x, pos.y, verts, {}, true);
	return bod;
}