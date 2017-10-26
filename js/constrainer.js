class constrainer{
	constructor(constraint){
		this.constraint = constraint;
		this.objA = this.constraint.bodyA.gameObject;
		this.objB = this.constraint.bodyB.gameObject;
		this._inWorld = false;
	}
	
	setObjA(obj){
		if(this.objA)
			this.objA.constrainers.splice(this.objA.constrainers.indexOf(this), 1);
		this.constraint.bodyA = obj.physBody;
		this.objA = obj;
	}
	setObjB(obj){
		if(this.objB)
			this.objB.constrainers.splice(this.objB.constrainers.indexOf(this), 1);
		this.constraint.bodyB = obj.physBody;
		this.objB = obj;
	}
	
	get pointA(){
		return vec2.fromOther(this.constraint.pointA).plus(vec2.fromOther(this.constraint.bodyA.position));
	}
	get pointB(){
		return vec2.fromOther(this.constraint.pointB).plus(vec2.fromOther(this.constraint.bodyB.position));
	}
	
	worldAdd(){
		if(!this.objA.constrainers.includes(this))
			this.objA.constrainers.push(this);
		if(!this.objB.constrainers.includes(this))
			this.objB.constrainers.push(this);
		this._inWorld = true;
		Matter.World.addConstraint(physWorld, this.constraint);
	}
	worldRemove(){
		this.objA.constrainers.splice(this.objA.constrainers.indexOf(this), 1);
		this.objB.constrainers.splice(this.objB.constrainers.indexOf(this), 1);
		this._inWorld = false;
		Matter.World.remove(physWorld, this.constraint);
	}
	
	update(){}
	draw(rdrr){}
}

class cstr_silkStrand extends constrainer{
	constructor(constraint){
		super(constraint);
		this.maxLength = 50;
	}
	
	update(){
		super.update();
		
		var p1 = vec2.fromOther(this.constraint.pointA).plus(vec2.fromOther(this.constraint.bodyA.position));
		var p2 = vec2.fromOther(this.constraint.pointB).plus(vec2.fromOther(this.constraint.bodyB.position));
		
		if(p1.distance(p2) > this.maxLength)
			this.worldRemove();
	}
	draw(rdrr){
		var p1 = this.pointA;
		var p2 = this.pointB;
		var width = 1 - p1.distance(p2) / this.maxLength;
		
		var ln = new line(p1, p2);
		
		rdrr.push(ln, null, "#fff", 1 + 2 * width);
		super.draw(rdrr);
	}
}

class cstr_grappleRope extends constrainer{
	constructor(constraint){
		super(constraint);
		this.shrink = 2;
		this.restLength = 30;
		this.parentWep = null;
	}
	
	worldRemove(){
		super.worldRemove();
	}
	
	update(){
		if(this.constraint.length >= this.shrink + this.restLength){
			this.constraint.length -= this.shrink;
			
			var dist = this.pointA.distance(this.pointB);
			if(dist < this.constraint.length)
				this.constraint.length = dist;
		}
		else this.constraint.length = this.restLength;
	}
	draw(rdrr){
		var p1 = this.pointA;
		var p2 = this.pointB;
		
		var ln = new line(p1, p2);
		
		rdrr.push(ln, null, "#fff", 2);
		super.draw(rdrr);
	}
}