class distortion{
	constructor(pos, size, distort, quadratic = false){
		this.pos = pos;
		this.size = size;
		this.distort = distort; 
		this.quadratic = quadratic;
	}
	
	distortTransAtPoint(point){
		var dist = this.pos.distance(point);
		if(dist > this.size)
			return new transformation();
		
		var mag = 1 - (dist / this.size);
		if(this.quadratic)
			mag = Math.pow(mag, 2);
		var ttrans = new transformation(
			this.distort.translate.multiply(mag), 
			this.distort.rotate * mag, 
			(this.distort.scale - 1) * mag + 1,
			this.distort.origin);
		return ttrans;
	}
	distortPoint(point){
		this.distort.origin = this.pos;
		var dist = this.pos.distance(point);
		if(dist > this.size)
			return point;
		var ttrans = this.distortTransAtPoint(point);
		
		return ttrans.transformPoint(point);
	}
	distortPoly(poly){
		poly.distort(this);
	}
}

