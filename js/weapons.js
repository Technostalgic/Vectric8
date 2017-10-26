var enum_damageType = {
	piercing: 0,
	bashing: 1,
	energy: 2,
	heat: 3,
	destructive: 4
}

class weapon{
	constructor(){
		this.name = "Weapon";
		this.uses = 100;
	}
	
	trigger(owner){
		if(this.uses <= 0)
			return;
	}
	update(owner){}
	drawHUD(owner, rdrr){}
	drawDisplay(owner, ctx, pos, selected = false){
		var pwPrc = Math.max(this.uses, 0) / 100;
		
		var width = 150;
		var height = 20;
		var fwidth = width * pwPrc;
		
		var filpol = new polygon();
		filpol.setVerts([
			new vec2(pos.x, pos.y),
			new vec2(pos.x + 20, pos.y + height),
			new vec2(pos.x + width + 20, pos.y + height),
			new vec2(pos.x + width, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,255,255, 0.15)");
		if(selected)
		filpol.drawOutline(ctx, "#bbb", 2);
		filpol.setVerts([
			new vec2(pos.x, pos.y),
			new vec2(pos.x + 20, pos.y + height),
			new vec2(pos.x + fwidth + 20, pos.y + height),
			new vec2(pos.x + fwidth, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,255,0,0.25)");
		
		//ctx.fillStyle = "rgba(255,255,255, 0.15)";
		//ctx.strokeStyle = "#bbb";
		//ctx.fillRect(pos.x, pos.y, 150, 20);
		//ctx.fillStyle = "rgba(255,255,0, 0.2)";
		//ctx.fillRect(pos.x, pos.y, 150 * pwPrc, 20);
		//if(selected) ctx.strokeRect(pos.x, pos.y, 150, 20);
		
		ctx.fillStyle = "#fff";
		ctx.font = "12px helvetica";
		ctx.fillText(this.name, pos.x + 85, pos.y + 14);
		
	}
	static drawNullWepDisplay(owner, ctx, pos, selected = false){
		var width = 150;
		var height = 20;
		
		var filpol = new polygon();
		filpol.setVerts([
			new vec2(pos.x, pos.y),
			new vec2(pos.x + 20, pos.y + height),
			new vec2(pos.x + width + 20, pos.y + height),
			new vec2(pos.x + width, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,255,255, 0.15)");
		if(selected)
			filpol.drawOutline(ctx, "#bbb", 2);
		
		//ctx.fillStyle = "rgba(255,255,255, 0.15)";
		//ctx.strokeStyle = "#bbb";
		//ctx.fillRect(pos.x, pos.y, 150, 20);
		//ctx.fillStyle = "rgba(255,255,0, 0.2)";
		//ctx.fillRect(pos.x, pos.y, 150 * pwPrc, 20);
		//if(selected) ctx.strokeRect(pos.x, pos.y, 150, 20);
		
		ctx.fillStyle = "#fff";
		ctx.font = "12px helvetica";
		ctx.fillText("- - empty - -", pos.x + 85, pos.y + 14);
	}
	
	destroyObject(obj){}
}

class wep_simpleGun extends weapon{
	constructor(){
		super();
		this.name = "Stock Laser";
		this.fireRate = 20;
		this._fireDelay = 0;
	}
	
	trigger(owner){
		if(this.uses <= 0)
			return;
		while(this._fireDelay <= 0){
			this.fire(owner);
			this._fireDelay += 1;
		}
	}
	fire(owner){
		var speed = 10;

		var off = new transformation(new vec2(), -owner.angle, 1).transformPoint(new vec2(15, 0));
		var pos = owner.pos.plus(off);

		var p = new simpleBullet(pos, this);
		p.setAngle(owner.angle);
		p.setVel(owner.vel.plus(vec2.fromAng(p.angle, speed)));
		
		p.setTeam(owner.team);
		p.worldAdd();
		this._fireDelay = this.fireRate;
	}
	
	update(owner){
		if(this._fireDelay < 0)
			this._fireDelay = 0;
		if(this._fireDelay > 0)
			this._fireDelay -= 1;
	}
	drawHUD(owner, rdrr){
		var p1 = new vec2(25, 0).rotate(owner.angle).plus(owner.pos);
		var ln1 = new dot(p1, 3);
		rdrr.push(ln1, "#ff0");
		
		p1 = new vec2(45, 0).rotate(owner.angle).plus(owner.pos);
		ln1 = new dot(p1, 3);
		rdrr.push(ln1, "#ff0");
		
		var a = (this.fireRate - this._fireDelay) / this.fireRate;
		p1 = new vec2(35, 0).rotate(owner.angle).plus(owner.pos);
		ln1 = new dot(p1, 3);
		rdrr.push(ln1, "rgba(255, 255, 0, " + a.toString() + ")");
	}
}
class wep_simpleAIGun extends wep_simpleGun{
	constructor(){
		super();
		this.fireRate = 20;
	}
	
	fire(owner){
		var speed = 5;

		var off = new transformation(new vec2(), -owner.angle, 1).transformPoint(new vec2(20, 0));
		var pos = owner.pos.plus(off);

		var p = new sbul_enemy(pos);
		p.life = 90;
		p.setAngle(owner.angle);
		p.setVel(owner.vel.plus(vec2.fromAng(p.angle, speed)));

		p.setTeam(owner.team);
		p.worldAdd();
		this._fireDelay = this.fireRate;
	}
	drawHUD(owner, rdrr){
		
	}
}

class wep_silkStrike extends wep_simpleGun{
	constructor(){
		super();
		this.name = "Silk Strike";
		this.fireRate = 5;
		this.xoff = -1;
	}
	
	fire(owner){
		var speed = 50;
		this.xoff *= -1;

		var off = new transformation(new vec2(), -owner.angle, 1).transformPoint(new vec2(0, this.xoff * 5));
		var pos = owner.pos.plus(off);

		var p = new sbul_silkStrike(pos, this);
		p.setAngle(owner.angle);
		p.setVel(owner.vel.plus(vec2.fromAng(p.angle, speed)));

		p.setTeam(owner.team);
		p.worldAdd();
		this._fireDelay = this.fireRate;
		
		this.uses -= 0.5;
	}
	drawHUD(owner, rdrr){
		var sp1 = new vec2(35, 5).rotate(owner.angle).plus(owner.pos);
		var ep1 = new vec2(40, 0).rotate(owner.angle).plus(owner.pos);
		var ln1 = new line(sp1, ep1);
		rdrr.push(ln1, null, "#fff", 2);
		sp1 = new vec2(40, 0).rotate(owner.angle).plus(owner.pos);
		ep1 = new vec2(35, -5).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, ep1);
		rdrr.push(ln1, null, "#fff", 2);
		
		sp1 = new vec2((this.fireRate - this._fireDelay) * 2, -this.xoff * 5).rotate(owner.angle).plus(owner.pos);
		ln1 = new dot(sp1, 3);
		rdrr.push(ln1, "#fff", null, 2);
		
		sp1 = new vec2(55, 5).rotate(owner.angle).plus(owner.pos);
		ep1 = new vec2(60, 0).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, ep1);
		rdrr.push(ln1, null, "#fff", 2);
		sp1 = new vec2(60, 0).rotate(owner.angle).plus(owner.pos);
		ep1 = new vec2(55, -5).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, ep1);
		rdrr.push(ln1, null, "#fff", 2);
		
	}
	
	destroyObject(obj){
		for(var i = obj.gibs.length - 1; i >= 0; i--){
			var gib = obj.gibs[i];
			var ogibi = iRand(0, obj.gibs.length);
			if(ogibi == i) continue;
			
			var b1 = obj.gibs[i].physBody.parts[iRand(0, obj.gibs[i].physBody.parts.length)];
			var p1 = vec2.fromOther(b1.vertices[iRand(0, b1.vertices.length)]).minus(obj.gibs[i].pos);
			
			var b2 = obj.gibs[ogibi].physBody.parts[iRand(0, obj.gibs[ogibi].physBody.parts.length)];
			var p2 = vec2.fromOther(b2.vertices[iRand(0, b2.vertices.length)]).minus(obj.gibs[ogibi].pos);
			
			var cstr = gib.createConstraint(p1, obj.gibs[ogibi], p2, 0.001, 0);
			var strand = new cstr_silkStrand(cstr);
			strand.worldAdd();
		}
	}
}
class wep_doomsday extends wep_simpleGun{
	constructor(){
		super();
		this.name = "Doomsday Rockets";
		this.fireRate = 12;
		this.ammo = 10;
		this.xoff = -1;
		this.target = null;
	}
	
	findTarget(owner){
		this.target = null;
		
		var ptargs = [];
		for(var i in physObjects){
			if(!(physObjects[i] instanceof character)) continue;
			if(physObjects[i].team != owner.team)
				ptargs.push(physObjects[i]);
		}
		var mADist = 0.75;
		for(var i in ptargs){
			var adist = Math.abs(angDist(owner.angle, ptargs[i].pos.minus(owner.pos).direction));
			if(adist <= mADist){
				this.target = ptargs[i];
				mADist = adist;
			}
		}
	}
	
	update(owner){
		this.findTarget(owner);
		super.update(owner);
	}
	fire(owner){
		var speed = 5;
		this.xoff *= -1;
		
		var off = new transformation(new vec2(), -owner.angle, 1).transformPoint(new vec2(0, this.xoff * 7));
		var pos = owner.pos.plus(off);
		
		var p = new missile(pos, this);
		p.setTarget(this.target);
		p.setAngle(owner.angle);
		p.setVel(owner.vel.plus(vec2.fromAng(p.angle + (this.xoff / 6) + rand(-0.2, 0.2), speed + rand(-1, 1))));
		p.aim = owner.angle;
		
		p.setTeam(owner.team);
		p.worldAdd();
		this._fireDelay = this.fireRate;
		this.uses -= 1;
	}
	drawHUD(owner, rdrr){
		if(this.target)
			this.drawTarget(owner, rdrr);
		
		var lockCol = !!this.target ? "#FC0" : "#665";
		var lockTr = !!this.target ? 2 : 0;
		
		var tri1 = new polygon();
		tri1.setVerts([
			new vec2(20, -15 + lockTr),
			new vec2(20, -9 + lockTr),
			new vec2(30, -9 + lockTr),
			]);
		tri1.transform(new vec2(), -owner.angle);
		tri1.transform(owner.pos.clone());
		
		var tri2 = new polygon();
		tri2.setVerts([
			new vec2(20, 15 - lockTr),
			new vec2(20, 9 - lockTr),
			new vec2(30, 9 - lockTr),
			]);
		tri2.transform(new vec2(), -owner.angle);
		tri2.transform(owner.pos.clone());
		
		var cen = polygon.Circle(4, 6);
		cen.transform(owner.pos.plus(new vec2(25, 0).rotate(owner.angle)));
		
		rdrr.push(tri1, "rgba(0,0,0,0)", "#FA0", 2);
		rdrr.push(tri2, "rgba(0,0,0,0)", "#FA0", 2);
		rdrr.push(cen, "rgba(0,0,0,0)", lockCol, 2);
	}
	drawTarget(owner, rdrr){
		var reticleSize = 40;
		var retColor = "#f00";
		var pos = this.target.pos.clone();
		
		var p1 = pos.plus(new vec2(0, -reticleSize).rotate(owner.angle));
		var p2 = pos.plus(new vec2(0, reticleSize).rotate(owner.angle));
		var p3 = pos.plus(new vec2(-reticleSize, 0).rotate(owner.angle));
		var p4 = pos.plus(new vec2(reticleSize, 0).rotate(owner.angle));
		
		var p1a = p1.plus(new vec2(10, -10).rotate(owner.angle));
		var p1b = p1.plus(new vec2(-10, -10).rotate(owner.angle));
		var p2a = p2.plus(new vec2(10, 10).rotate(owner.angle));
		var p2b = p2.plus(new vec2(-10, 10).rotate(owner.angle));
		var p3a = p3.plus(new vec2(-10, -10).rotate(owner.angle));
		var p3b = p3.plus(new vec2(-10, 10).rotate(owner.angle));
		var p4a = p4.plus(new vec2(10, -10).rotate(owner.angle));
		var p4b = p4.plus(new vec2(10, 10).rotate(owner.angle));
		
		var ln1 = new line(p1a, p1);
		var ln2 = new line(p1, p1b);
		var ln3 = new line(p2a, p2);
		var ln4 = new line(p2, p2b);
		var ln5 = new line(p3a, p3);
		var ln6 = new line(p3, p3b);
		var ln7 = new line(p4a, p4);
		var ln8 = new line(p4, p4b);
		
		rdrr.push(ln1, null, retColor, 3);
		rdrr.push(ln2, null, retColor, 3);
		rdrr.push(ln3, null, retColor, 3);
		rdrr.push(ln4, null, retColor, 3);
		rdrr.push(ln5, null, retColor, 3);
		rdrr.push(ln6, null, retColor, 3);
		rdrr.push(ln7, null, retColor, 3);
		rdrr.push(ln8, null, retColor, 3);
		
	}
	
	destroyObject(obj){
		
	}
}

class wep_ionCannon extends weapon{
	constructor(){
		super();
		this.name = "Ion Cannon";
		this.maxFireTime = 60;
		this.fireTime = 60;
		this.fireDelay = 10;
		this.cooldown = false;
		this._drawbeam = false;
		this.triggered = false;
	}
	
	trigger(owner){
		if(this.uses <= 0)
			return;
		
		this.triggered = true;
		if(this.cooldown) return;
		
		if(this.fireDelay <= 0){
			this.fire(owner);
			this.fireDelay = 0;
		}
		else
			this.fireDelay -= 1;
	}
	fire(owner){
		this.fired = true;
		this._drawbeam = true;
		this._hitdist = 500;
		this.fireTime -= 1;
		if(this.fireTime <= 0)
			this.cooldown = true;
		
		this.hitCheck(owner);
		this.uses -= 0.16;
	}
	
	hitCheck(owner, bodies = physWorld.bodies){
		var off = new transformation(new vec2(), -owner.angle, 1).transformPoint(new vec2(15, 0));
		var rstart = owner.pos.plus(off)
		var rend = rstart.plus(vec2.fromAng(owner.angle, 500));
		var rc = raycast(bodies, rstart, rend, true);
		
		var hits = [];
		for(var i = 0; i < rc.length; i++){
			particleEffect.ionBurst(rc[i].point, 30);
			if(hits.includes(rc[i].body.gameObject))
				continue;
			hits.push(rc[i].body.gameObject);
			this.hit(owner, rc[i].body.gameObject, rc[i].point);
			break;
		}
	}
	hit(owner, ob, colpos){
		ob.damage(0.35, enum_damageType.energy, colpos);
		ob.force(vec2.fromAng(owner.angle, 0.0006), colpos);
		if(ob.isDead)
			this.hitCheck(owner, object.bodiesFromObjectList(ob.gibs));
		this._hitdist = owner.pos.distance(ob.pos);
	}
	
	update(owner){
		var rechargeSpeed = 0.25;
		
		if(!this.triggered)
			this.fireDelay = 10;
		if(!this.fired){
			if(this.fireTime < this.maxFireTime){
				this.fireTime += 0.4;
				if(this.fireTime >= this.maxFireTime){
					this.cooldown = false;
					this.fireTime = this.maxFireTime;
				}
			}
			this._drawbeam = false;
		}
		
		this.fired = false;
		this.triggered = false;
	}
	drawHUD(owner, rdrr){
		var d1 = Math.max((this.fireTime - this.maxFireTime / 3 * 2) / this.maxFireTime * 3, 0);
		var d2 = Math.max(Math.min((this.fireTime - 20) / this.maxFireTime * 3, 1), 0);
		var d3 = Math.min(this.fireTime / this.maxFireTime * 3, 1);
		
		var cl = this.cooldown ? "#999" : "#0af";
		var sp1 = new vec2(32, 10).rotate(owner.angle).plus(owner.pos);
		var ln1 = new line(sp1, vec2.fromAng(Math.PI / -4, d1 * 8).rotate(owner.angle).plus(sp1));
		rdrr.push(ln1, null, cl, 3);
		sp1 = new vec2(32, -10).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, vec2.fromAng(Math.PI / 4, d1 * 8).rotate(owner.angle).plus(sp1));
		rdrr.push(ln1, null, cl, 3);
		
		cl = this.cooldown ? "#999" : "#0cf";
		sp1 = new vec2(25, 10).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, vec2.fromAng(Math.PI / -4, d2 * 8).rotate(owner.angle).plus(sp1));
		rdrr.push(ln1, null, cl, 3);
		sp1 = new vec2(25, -10).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, vec2.fromAng(Math.PI / 4, d2 * 8).rotate(owner.angle).plus(sp1));
		rdrr.push(ln1, null, cl, 3);
		
		cl = this.cooldown ? "#999" : "#0ef";
		sp1 = new vec2(18, 10).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, vec2.fromAng(Math.PI / -4, d3 * 8).rotate(owner.angle).plus(sp1));
		rdrr.push(ln1, null, cl, 3);
		sp1 = new vec2(18, -10).rotate(owner.angle).plus(owner.pos);
		ln1 = new line(sp1, vec2.fromAng(Math.PI / 4, d3 * 8).rotate(owner.angle).plus(sp1));
		rdrr.push(ln1, null, cl, 3);
		
		if(this.fireDelay < 10 && this.fireDelay > 0){
			var fls = polygon.Circle((10 - this.fireDelay) + 5)
			fls.transform(new vec2(15, 0).rotate(owner.angle).plus(owner.pos));
			rdrr.push(fls, "#0ff", "#0af", 2);
		}
		
		if(this._drawbeam)
			this.drawBeam(owner, rdrr);
	}
	drawBeam(owner, rdrr){
		var off = new vec2(15, 0).rotate(owner.angle);
		var rstart = owner.pos.plus(off);
		var rend = rstart.plus(vec2.fromAng(owner.angle, this._hitdist - off.distance()));
		rdrr.push(new line(rstart, rend), null, "#0ff", 4);
		this._hitdist = 500;
		//this._drawbeam = false;
	}
}

class equipment extends weapon{
	constructor(){
		super();
	}
	
	trigger(owner){
		
	}
	update(owner){
		
	}
	
	drawHUD(owner, rdrr){}
	drawDisplay(owner, ctx, pos, selected = false){
		var pwPrc = Math.max(this.uses, 0) / 100;
		
		var width = 150;
		var height = 20;
		var fwidth = width * pwPrc;
		
		var filpol = new polygon();
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + width, pos.y + height),
			new vec2(pos.x + width + 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,255,255, 0.15)");
		if(selected)
		filpol.drawOutline(ctx, "#bbb", 2);
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + fwidth, pos.y + height),
			new vec2(pos.x + fwidth + 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(0,100,255,0.25)");
		
		//ctx.fillStyle = "rgba(255,255,255, 0.15)";
		//ctx.strokeStyle = "#bbb";
		//ctx.fillRect(pos.x, pos.y, 150, 20);
		//ctx.fillStyle = "rgba(255,255,0, 0.2)";
		//ctx.fillRect(pos.x, pos.y, 150 * pwPrc, 20);
		//if(selected) ctx.strokeRect(pos.x, pos.y, 150, 20);
		
		ctx.fillStyle = "#fff";
		ctx.font = "12px helvetica";
		ctx.fillText(this.name, pos.x + 85, pos.y + 14);
	}
	static drawNullEqDisplay(owner, ctx, pos, selected = false){
		var pwPrc = Math.max(this.uses, 0) / 100;
		
		var width = 150;
		var height = 20;
		var fwidth = width * pwPrc;
		
		var filpol = new polygon();
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + width, pos.y + height),
			new vec2(pos.x + width + 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,255,255, 0.15)");
		if(selected)
		filpol.drawOutline(ctx, "#bbb", 2);
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + fwidth, pos.y + height),
			new vec2(pos.x + fwidth + 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(0,100,255,0.25)");
		
		ctx.fillStyle = "#fff";
		ctx.font = "12px helvetica";
		ctx.fillText("- - empty - -", pos.x + 85, pos.y + 14);
	}
}

class eq_grapplingHook extends equipment{
	constructor(){
		super();
		this.name = "Grappling Hook";
		this.linkA = null;
		this.linkB = null;
		this.hookA = null;
		this.hookB = null;
		this.toHook = null;
		this.constrainer = null;
		this._lastFire = false;
		this._lastFire2 = false;
		this.holding = false;
	}
	
	trigger(owner){
		//calls when the 'fire' control is held
		if(!this._lastFire && !this._lastFire2)
			this.trigger_start(owner);
		this._lastFire = true;
	}
	trigger_start(owner){
		this.unsetHoldCheck();
		if(this.holding)
			this.unsetHolding();
		else {
			if(!this.hookA)
				this.launch_hookA(owner);
		}
	}
	trigger_end(owner){
		if(this.hookA){
			if(this.hookA.hooked){
				this.launch_hookB(owner);
				this.resetHooks();
			}
			else
				this.setHolding(owner);
		}
	}
	
	resetHooks(){
		this.linkA = null;
		this.linkB = null;
		this.hookA = null;
		this.hookB = null;
		this.toHook = null;
	}
	destroyHooks(){
		if(this.hookA)
			this.hookA.destroy();
		if(this.hookB)
			this.hookB.destroy();
	}
	destroyGrapple(){
		if(this.constrainer){
			this.constrainer.worldRemove();
			this.constrainer = null;
		}
	}
	launch_hookA(owner){
		var spd = 7;
		var off = new vec2(15, 0);
		
		this.hookA = new proj_grappleHook(owner.pos.plus(off.rotate(owner.angle)), this);
		this.hookA.setVel(vec2.fromAng(owner.angle, spd).plus(owner.vel));
		this.hookA.setAngle(this.hookA.vel.direction);
		this.hookA.worldAdd();
	}
	launch_hookB(owner){
		var spd = 7;
		var off = new vec2(15, 0);
		
		this.hookB = new proj_grappleHook(owner.pos.plus(off.rotate(owner.angle)), this);
		this.hookB.setVel(vec2.fromAng(owner.angle, spd).plus(owner.vel));
		this.hookA.setAngle(this.hookA.vel.direction);
		this.hookB.worldAdd();
		
		if(this.toHook){
			this.hookB.grappleTarget = this.toHook;
			this.toHook = null;
		}
	}
	
	setHolding(owner){
		this.holding = true;
		this.hookA.grappleTarget = {gameObj: owner};
	}
	unsetHolding(){
		this.destroyHooks();
		this.resetHooks();
		this.destroyGrapple();
		this.holding = false;
	}
	unsetHoldCheck(){
		if(this.holding)
			if(this.constrainer)
				if(!this.constrainer._inWorld)
					this.unsetHolding();
	}
	
	latch(proj, gameObject, colpos, angoff){
		if(!this.hookA) return;
		
		if(this.hookA.ID === proj.ID){
			this.toHook = {
				gameObj: gameObject,
				offset: colpos.minus(gameObject.pos),
				angOff: angoff
			}
		}
	}
	
	update(owner){
		if(!this._lastFire && this._lastFire2)
			this.trigger_end(owner);
		
		this._lastFire2 = this._lastFire;
		this._lastFire = false;
	}
	
	drawHUD(owner, rdrr){
		if(!this.hookB){
			if(this.hookA){
				if(this.hookA._inWorld){
					//draw line between player and grappling hook
					var ln = new line(this.hookA.pos, owner.pos);
					rdrr.push(ln, null, "#fff", 1);
				}
			}
		}
		if(this.toHook && !this.holding){
			var ln = new line(owner.pos, this.toHook.gameObj.pos.plus(this.toHook.offset.rotate(this.toHook.gameObj.angle - this.toHook.angOff)));
			rdrr.push(ln, null, "#fff", 1);
		}
	}
}

class consumable extends weapon{
	constructor(){
		this.uses = 1;
	}
	
	drawDisplay(owner, ctx, pos, selected = false){
		var pwPrc = Math.max(this.uses, 0) / 1;
		
		var width = 100;
		var height = 15;
		var fwidth = width * pwPrc;
		
		var filpol = new polygon();
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + width, pos.y + height),
			new vec2(pos.x + width - 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,255,255, 0.15)");
		if(selected)
		filpol.drawOutline(ctx, "#bbb", 2);
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + fwidth, pos.y + height),
			new vec2(pos.x + fwidth + 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,100,0,0.25)");
		
		ctx.fillStyle = "#fff";
		ctx.font = "12px helvetica";
		ctx.fillText(this.name, pos.x + 85, pos.y + 14);
	}
	static drawNullCmDisplay(owner, ctx, pos, selected = false){
		var pwPrc = Math.max(this.uses, 0) / 1;
		
		var width = 100;
		var height = 15;
		var fwidth = width * pwPrc;
		
		var filpol = new polygon();
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + width, pos.y + height),
			new vec2(pos.x + width - 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,255,255, 0.15)");
		if(selected)
		filpol.drawOutline(ctx, "#bbb", 2);
		filpol.setVerts([
			new vec2(pos.x + 20, pos.y),
			new vec2(pos.x, pos.y + height),
			new vec2(pos.x + fwidth, pos.y + height),
			new vec2(pos.x + fwidth + 20, pos.y)
		]);
		filpol.drawFill(ctx, "rgba(255,100,0,0.25)");
		
		ctx.fillStyle = "#fff";
		ctx.font = "12px helvetica";
		ctx.fillText("- - empty - -", pos.x + 50, pos.y + 11);
	}
}
