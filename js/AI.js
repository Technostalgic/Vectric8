class AI{
	constructor(parentcharacter){
		this.parentCharacter = parentcharacter;
		this.target = null;
		this.state = AI.State.idle;
	}
	
	update(ts){}
	collideWith(body, collision, force){}
	
	static get State(){
		return{
			idle: -1,
			nuetral: 1,
			seek: 2,
			pursue: 3,
			attack: 4,
			evade: 5,
			retreat: 6
		};
	}
}

class enemyAI extends AI{
	constructor(parentcharacter){
		super(parentcharacter);
		this.target = player1;
		this.state = AI.State.seek;
		this.baseBehaviors = [];
		this.activeBehaviors = [];
	}
	
	setActiveBehavior(state, activebehavior){
		if(this.activeBehaviors.length <= state)
			for(var i = state - (this.activeBehaviors.length - 1); i > 0; i--)
				this.activeBehaviors.push(null);
		this.activeBehaviors[state] = activebehavior;
	}
	
	activeBehave(ts){
		if(this.activeBehaviors.length > this.state)
			if(this.activeBehaviors[this.state]){
				this.activeBehaviors[this.state].update(ts);
				this.activeBehaviors[this.state].fireCheck(ts);
			}
	}
	
	update(ts){
		this.baseBehaviors.forEach(function(beh){
			beh.fireCheck(ts);
			beh.update(ts);
		});
		this.activeBehave(ts);
	}
	
	static AI_dummy(parentcharacter){
		var r = new enemyAI(parentcharacter);
		
		r.setActiveBehavior(AI.State.seek, new beh_dummy_seek(r));
		r.setActiveBehavior(AI.State.attack, new beh_dummy_attack(r));
		r.collideWith = function(body, collision, force){
			if(!(body.parent.gameObject instanceof player)) return;
			r.setActiveBehavior(AI.State.attack, new beh_dummy_selfDestruct(r));
			r.state = AI.State.attack;
			r.parentCharacter._fThrust = false;
		};
		r.baseBehaviors.push(new beh_dummy_seekcheck(r));
		
		return r;
	}
	static AI_shooter(parentcharacter){
		var r = new enemyAI(parentcharacter);
		
		r.setActiveBehavior(AI.State.seek, new beh_shooter_seek(r));
		r.setActiveBehavior(AI.State.pursue, new beh_shooter_pursue(r));
		r.setActiveBehavior(AI.State.retreat, new beh_shooter_retreat(r));
		r.setActiveBehavior(AI.State.attack, new beh_shooter_attack(r));
		
		return r;
	}
}

class behavior{
	constructor(parentAI, infrequency = 1){
		this.parentAI = parentAI;
		this.infrequency = infrequency;
		this.delay = 0;
	}
	
	get owner(){
		return this.parentAI.parentCharacter;
	}
	get target(){
		return this.parentAI.target;
	}
	
	setAIstate(state){
		this.parentAI.state = state;
	}
	
	fireCheck(ts){
		this.delay -= ts;
		if(this.delay <= 0){
			this.delay = this.infrequency;
			this.fire();
		}
	}
	
	update(ts){}
	fire(){}
}

class beh_dummy_seekcheck extends behavior{
	constructor(parentAI, infrequency = 60){
		super(parentAI, infrequency);
	}
	
	fire(){
		if(this.owner.inLOS(this.target.pos, [this.owner, this.target])){
			this.setAIstate(AI.State.seek);
			this.owner._fThrust = false;
		}
	}
}
class beh_dummy_seek extends behavior{
	constructor(parentAI, infrequency = 30){
		super(parentAI, infrequency);
	}
	
	fire(){
		if(this.owner.inLOS(this.target.pos, [this.owner, this.target]))
			this.setAIstate(AI.State.attack);
	}
}
class beh_dummy_attack extends behavior{
	constructor(parentAI, infrequency = 3){
		super(parentAI, infrequency);
	}
	
	update(ts){
		if(this.owner.facingTarget()){
			var svel = vec2.fromAng(this.owner.angle + rand(-1, 1), 3);
			this.owner.approachVel(svel, 0.05);
			this.owner._fThrust = true;
		}
		else this.owner._fThrust = false;
	}
	fire(){
		this.owner.approachAngle(this.parentAI.target.pos.minus(this.owner.pos).direction, 0.03);
	}
}
class beh_dummy_selfDestruct extends behavior{
	constructor(parentAI, infrequency = 30){
		super(parentAI, infrequency);
		this.delay = infrequency;
	}
	
	fire(){
		this.owner.detonate();
	}
}

class beh_shooter_seek extends behavior{
	constructor(parentAI, infrequency = 30){
		super(parentAI, infrequency);
		this.aimdir = this.owner.angle + rand(-Math.PI / 4, Math.PI / 4);
	}
	
	update(ts){
		this.owner.approachAngle(this.aimdir, 0.03);

		var svel = vec2.fromAng(this.owner.angle, 2);
		this.owner.approachVel(svel, 0.05);
	}
	fire(){
		this.aimdir = this.owner.angle + rand(-Math.PI / 4, Math.PI / 4);
		if(this.owner.inLOS(this.target.pos, [this.owner, this.target]))
			this.setAIstate(AI.State.pursue);
	}
}
class beh_shooter_pursue extends behavior{
	constructor(parentAI, infrequency = 30){
		super(parentAI, infrequency);
	}
	
	update(ts){
		var ang = this.parentAI.target.pos.minus(this.owner.pos).direction;
		this.owner.approachAngle(ang, 0.01);
		if(this.owner.facingTarget())
			this.owner.approachVel(vec2.fromAng(this.owner.angle, 2), 0.04);
		
		var dist = this.owner.pos.distance(this.parentAI.target.pos);
		if(dist < 300)
			this.setAIstate(AI.State.attack);
	}
}
class beh_shooter_retreat extends behavior{
	constructor(parentAI, infrequency = 30){
		super(parentAI, infrequency);
	}
	
	update(ts){
		var ang = this.parentAI.target.pos.minus(this.owner.pos).direction + Math.PI;
		this.owner.approachAngle(ang, 0.03);
		if(!this.owner.facingTarget(Math.PI / 2))
			this.owner.approachVel(vec2.fromAng(this.owner.angle, 2), 0.04);
		
		var dist = this.owner.pos.distance(this.parentAI.target.pos);
		if(dist > 150)
			this.setAIstate(AI.State.seek);
	}
}
class beh_shooter_attack extends behavior{
	constructor(parentAI, infrequency = 120){
		super(parentAI, infrequency);
		this.delay = infrequency;
		this.sl = 45;
	}
	
	update(ts){
		if(this.sl > 0 && this.owner.facingTarget()){
			this.owner.wep.trigger(this.owner);
			this.owner.wep.update();
			this.sl -= ts;
		}
		this.owner.approachAngle(this.parentAI.target.pos.minus(this.owner.pos).direction, 0.02);
	}
	fire(){
		if(!this.owner.inLOS(this.target.pos, [this.owner, this.target]))
			this.setAIstate(AI.State.seek);
		
		var dist = this.owner.pos.distance(this.parentAI.target.pos);
		if(dist < 125)
			this.setAIstate(AI.State.retreat);
		else if(dist >= 300)
			this.setAIstate(AI.State.pursue);

		else if(rand(0, 1) < 0.65)
			this.sl = 45;
		else this.setAIstate(AI.State.seek);
	}
}