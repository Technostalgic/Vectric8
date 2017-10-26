var particles = [];
var particleSystems = [];

function updateParticles(ts){
	for(var i = particleSystems.length - 1; i >= 0; i--){
		particleSystems[i].update(ts);
		particleSystems[i].removeCheck();
	}
	for(var i = particles.length - 1; i >= 0; i--)
		particles[i].update(ts);
}
function drawParticles(rdrr){
	particles.forEach(function(p){
		p.draw(rdrr);
	});
	particleSystems.forEach(function(ps){
		ps.draw(rdrr);
	});
}

class particleSystem{
	constructor(){
		this.children = [];
		this.destroyOnEmpty = false;
	}
	
	worldAdd(){
		particleSystems.push(this);
	}
	worldRemove(){
		var i = particleSystems.indexOf(this);
		if(i >= 0)
			particleSystems.splice(i, 1);
	}
	
	addParticle(particle){
		particle.parentSystem = this;
		particle.add();
		this.children.push(particle);
	}
	
	removeCheck(){
		if(this.destroyOnEmpty)
			if(this.children.length <= 0)
				this.worldRemove();
	}
	update(ts){}
	draw(rdrr){}
}
class pSystem_linearConnection extends particleSystem{
	constructor(drawConnectors = true){
		super();
		this._drawConnectors = drawConnectors;
	}
	addParticle(particle){
		particle.parentSystem = this;
		this.children.push(particle);
		if(this._drawConnectors)
			particle.add();
	}
	update(ts){
		if(!this._drawConnectors)
			this.children.forEach(function(p){
				p.update(ts);
			});
	}
	draw(rdrr){
		for(var i = 0; i < this.children.length; i++){
			var i2 = i + 1;
			if(i2 >= this.children.length) 
				break;
			var ln = new line(this.children[i].pos, this.children[i2].pos);
			rdrr.push(ln, null, this.children[i2].renderColor, this.children[i2].size);
		}
	}
}
class pSystem_formPoly extends particleSystem{
	constructor(){
		super();
	}
	addParticle(particle){
		particle.parentSystem = this;
		this.children.push(particle);
		if(this._drawConnectors)
			particle.add();
	}
	update(ts){
		var ths = this;
		this.children.forEach(function(p){
			p.update(ts);
		});
	}
	draw(rdrr){
		var verts = [];
		for(var i = 0; i < this.children.length; i++)
			verts.push(this.children[i].pos);
		
		var poly = new polygon();
		poly.setVerts(verts);
		rdrr.push(poly, this.children[0].renderColor, "rgba(0,0,0,0)");
	}
}
class pSystem_seek extends particleSystem{
	constructor(){
		super();
		this.destroyOnEmpty = true;
		this.seekSpeed = 1;
		this.maxSpeed = 10;
		this.dist = 7;
		this.target = null;
	}
	
	addTarget(targ){
		this.target = targ;
		return this;
	}
	
	update(ts){
		if(!this.target) return;
		for(var i = this.children.length - 1; i >= 0; i--){
			var p = this.children[i];
			if(p.pos.distance(this.target.pos) <= this.dist)
				p.destroy();
			if(!(p instanceof extParticle))
				continue;
			
			var acc = this.target.pos.minus(p.pos).normalized(this.seekSpeed);
			p.vel = p.vel.plus(acc);
		}
	}
}

class particle{
	constructor(pos = new vec2()){
		this.pos = pos;
		this.life = 60;
	}
	
	add(pSystem = null){
		if(pSystem)
			pSystem.addParticle(this);
		else
			particles.push(this);
	}
	get isDead(){
		return this.life <= 0;
	}
	destroy(){
		var i = particles.indexOf(this);
		if(i >= 0)
			particles.splice(i, 1)
		if(this.parentSystem){
			i = this.parentSystem.children.indexOf(this);
			if(i >= 0)
				this.parentSystem.children.splice(i, 1);
			this.parentSystem = null;
		}
	}
	
	get renderColor(){
		return "#fff";
	}
	
	update(ts){
		this.life -= ts;
		if(this.isDead)
			this.destroy();
	}
	draw(rdrr){
		rdrr.push(new dot(this.pos, this.size), this.renderColor);
	}
}
class extParticle extends particle{
	constructor(pos = new vec2(), color = [255, 255, 255, 1], size = 2){
		super(pos);
		this.vel = new vec2();
		this.damping = 1; //the velocity is multiplied by this each step, usually used to emulate air friction
		this.color = color;
		this.size = size;
		this.fadeStart = 20; //when the particle starts to fade; only works when `this.color` is an array as opposed to a string
		
		//1 renders as a line with variable length based on velocity
		//0 renders as a square
		this.renderMode = 1; 
		
		//if `this.rendermode` is set to 1, this is the length of the line that is rendered, if left `null`, the length will be dependent on the particle's velocity
		this.length = null;
	}
	
	get renderColor(){
		var a = this.color[3];
		
		//checks to see if `this.color` is a string and returns it if so
		if(typeof(this.color)[0] == 's') return this.color;
		
		//sets the alpha to account for the particles starting fade time
		if(this.life < this.fadeStart)
			a *= this.life / this.fadeStart;
		
		return "rgba(" + this.color[0] + "," + this.color[1] + "," + this.color[2] + "," + a + ")";
	}
	
	update(ts){
		super.update(ts);
		this.vel = this.vel.multiply((this.damping - 1) * ts + 1);
		this.pos = this.pos.plus(this.vel.multiply(ts));
	}
	draw(rdrr){
		if(this.renderMode == 1){
			var length = Math.max(this.length, 1);
			if(this.length == null && this.vel.distance() >= 1)
				rdrr.push(new line(this.pos, this.pos.plus(this.vel)), null, this.renderColor, this.size);
			else
				rdrr.push(new line(this.pos, this.pos.plus(this.vel.normalized(length))), null, this.renderColor, this.size);
		}
		else
			rdrr.push(new dot(this.pos, this.size), this.renderColor);
	}
}
class polyParticle extends particle{
	constructor(pos, poly){
		super(pos);
		this.poly = poly;
		this.outlineCol = "#fff";
		this.fillCol = "#000";
		this.lineWidth = 2;
	}
	
	draw(rdrr){
		this.poly.transform(this.pos);
		rdrr.push(this.poly, this.fillCol, this.outlineCol, this.lineWidth);
	}
}

class distort_fadeExpansion extends particle{
	constructor(rendertarget, pos, distort, grow, life, fadestart){
		super(pos);
		distort.pos = this.pos;
		this.rendertarget = rendertarget;
		this.distort = distort;
		this.grow = grow;
		this.life = life;
		this.fadestart = fadestart;
	}
	update(ts){
		super.update(ts);
		this.distort.size += this.grow * ts;
		var ttrans = this.distort.distort;
		if(this.life < this.fadestart){
			var td = this.life / this.fadestart;
			ttrans = new transformation(
				this.distort.distort.translate.multiply(td), 
				this.distort.distort.rotate * td, 
				(this.distort.distort.scale - 1) * td + 1,
				this.distort.distort.origin);
		}
		var tdist = new distortion(
			this.distort.pos, 
			this.distort.size, 
			ttrans, 
			this.distort.quadratic);
		this.rendertarget.addDistortion(tdist);
	}
	draw(rdrr){};
}

//stupid format, I don't know why I did it this way.
//TODO:: make into static class
var particleEffect = {
	init:function(){
		this.explosiveBurst = function(pos, size, spikes = 6, depth = 0.8, jagg = 1, color = [255,255,0,2]){
			var psyst = new pSystem_formPoly();
			
			var pcount = spikes * 2;
			var tjag = jagg / spikes;
			var spd = size;
			var dspd = spd * depth;
			var angoff = rand(0, Math.PI);
			var ang = angoff;
			for(var i = pcount; i > 0; i--){
				var vspd = i % 2 == 0 ? spd : dspd;
				
				var p = new extParticle(pos, color, 2);
				p.vel = vec2.fromAng(ang, vspd);
				p.life = size + 5;
				p.fadeStart = p.life / 2;
				p.damping = 0.97;
				p.renderMode = 0;
				p.add(psyst);
				
				ang += (1 / pcount) * Math.PI * 2 + rand(-tjag, tjag);
			}
			
			psyst.destroyOnEmpty = true;
			psyst.worldAdd();
		};
		this.smallEnemyExplode = function(pos){
			this.explosiveBurst(pos, 5);
			
			//create a few explosion particles:
			for(var i = 20; i > 0; i--){
				var p = new extParticle(pos, [255, iRand(150, 255), 0, 1], rand(1, 3));
				p.vel = vec2.fromAng(rand(0, Math.PI * 2), (p.size - 1) * 1.5);
				p.life = rand(100, 200);
				p.fadeStart = p.life / 3;
				p.add();
			}
			
			//create distortion:
			var dist = new distortion(
				pos,
				25,
				new transformation(new vec2(), 0, 2),
				true
			);
			var dfe = new distort_fadeExpansion(
				playerView, 
				pos, 
				dist, 
				10, 20, 20);
			dfe.add();
		}
		this.smallMissileExplode = function(pos){
			this.explosiveBurst(pos, 3);
			
			//create a few explosion particles:
			for(var i = 14; i > 0; i--){
				var p = new extParticle(pos, [255, iRand(150, 255), 0, 1], rand(1, 3));
				p.vel = vec2.fromAng(rand(0, Math.PI * 2), (p.size - 1) * 6);
				p.life = rand(10, 20);
				p.fadeStart = p.life / 3;
				p.add();
			}
			
			//create distortion:
			var dist = new distortion(
				pos,
				15,
				new transformation(new vec2(), 0, 1.5),
				true
			);
			var dfe = new distort_fadeExpansion(
				playerView, 
				pos, 
				dist, 
				10, 20, 20);
			dfe.add();
		}
		this.mediumEnemyExplode = function(pos){
			this.explosiveBurst(pos, 6);
			
			//create a few explosion particles:
			for(var i = 35; i > 0; i--){
				var p = new extParticle(pos, [255, iRand(150, 255), 0, 1], rand(1, 3));
				p.vel = vec2.fromAng(rand(0, Math.PI * 2), (p.size - 1) * 1.5);
				p.life = rand(100, 200);
				p.fadeStart = p.life / 3;
				p.add();
			}
			
			//create distortion:
			var dist = new distortion(
				pos,
				25,
				new transformation(new vec2(), 0, 2),
				true
			);
			var dfe = new distort_fadeExpansion(
				playerView, 
				pos, 
				dist, 
				10, 30, 20);
			dfe.add();
		}
		this.thrust = function(pos, angle, size = 1){
			var tpoly = new polygon();
			var verts = [
				new vec2(0, -3),
				new vec2(0, 3),
				new vec2(rand(-15, -10), rand(5, 8)),
				new vec2(rand(-12, -4), 2),
				new vec2(rand(-25, -20), rand(-3, 3)),
				new vec2(rand(-12, -4), -2),
				new vec2(rand(-15, -10), rand(-8, -5)),
				];
			tpoly.setVerts(verts);
			tpoly.transform(new vec2(), -angle, size);
			
			var p = new polyParticle(pos, tpoly);
			p.outlineCol = "#f90";
			
			p.draw(playerView);
		}
		this.ionBurst = function(pos, size){
			var psyst = new pSystem_formPoly();
			var spikes = 4;
			var depth = 0.6;
			var jagg = 1;
			
			var pcount = spikes * 2;
			var tjag = jagg / spikes;
			var angoff = rand(0, Math.PI);
			var ang = angoff;
			for(var i = pcount; i > 0; i--){
				var vspd = i % 2 == 0 ? size : size * depth;
				
				var p = new extParticle(pos, [0, 255, 155, 1], 2);
				p.pos = p.pos.plus(vec2.fromAng(ang, vspd));
				p.life = 2;
				p.fadeStart = 1;
				p.renderMode = 0;
				p.add(psyst);
				
				ang += (1 / pcount) * Math.PI * 2 + rand(-tjag, tjag);
			}
			
			psyst.destroyOnEmpty = true;
			psyst.worldAdd();
		};
	}
}
particleEffect.init();