//Created by Technostalgic Games

class vec2{
  constructor(x = 0, y = x){
    this.x = x;
    this.y = y;
  }
  
  normalized(magnitude = 1){
    //returns a vector 2 with the same direction as this but
    //with a specified magnitude
    return this.multiply(magnitude / this.distance());
  }
  get inverted(){
    //returns the opposite of this vector
    return this.multiply(-1);
  }
  multiply(factor){
    //returns this multiplied by a specified factor    
    return new vec2(this.x * factor, this.y * factor);
  }
  plus(vec){
    //returns the result of this added to another specified vector2
    return new vec2(this.x + vec.x, this.y + vec.y);
  }
  minus(vec){
    //returns the result of this subtracted to another specified vector2
    return this.plus(vec.inverted);
  }
  rotate(rot){
    //rotates the vector by the specified angle
    var ang = this.direction;
    var mag = this.distance();
    ang += rot;
    return vec2.fromAng(ang, mag)
  }
  equals(vec, leniency = 0.0001){
    //returns true if the difference between rectangular distance of the two vectors is less than the specified leniency
    return (
      Math.abs(this.x - vec.x) <= leniency) && (
      Math.abs(this.y - vec.y) <= leniency);
  }
  toPhysVector(){
	  return Matter.Vector.create(this.x, this.y);
  }
  
  get direction(){
    //returns the angle this vector is pointing in radians
    return Math.atan2(this.y, this.x);
  }
  distance(vec = null){
    //returns the distance between this and a specified vector2
    if(vec === null)
      vec = new vec2();
    var d = Math.sqrt(
      Math.pow(this.x - vec.x, 2) + 
      Math.pow(this.y - vec.y, 2));
    return d;
  }
  
  clone(){
	return new vec2(this.x, this.y);
  }
  static fromAng(angle, magnitude = 1){
    //returns a vector which points in the specified angle
    //and has the specified magnitude
    return new vec2(
      Math.cos(angle) * magnitude, 
      Math.sin(angle) * magnitude);
  }
  static fromOther(vector){
	return new vec2(vector.x, vector.y);
  }
  
  toString(){
    return "vector<" + this.x + ", " + this.y + ">";
  }
}
class transformation{
	constructor(translate = new vec2(), rotate = 0, scale = 1, origin = new vec2()){
		this.translate = translate;
		this.rotate = rotate;
		this.scale = scale;
		this.origin = origin;
	}
	
	transformPoint(point){
		var v = point;
		v = v.minus(this.origin);
		
		v = v.plus(this.translate);
		v = v.multiply(this.scale)
		
		var ang = v.direction;
		var mag = v.distance();
		v = vec2.fromAng(ang - this.rotate, mag);
		
		v = v.plus(this.origin);
		return v;
	}
}
	
class dot{
	constructor(pos, size = 1){
		this.pos = pos;
		this.size = size;
	}
	
	distort(distortion){
		this.pos = distortion.distortPoint(this.pos);
		this.size *= distortion.distortTransAtPoint(this.pos).scale;
	}
	transform(translate, rotate = 0, scale = 1){
		var trans = new transformation(translate, rotate, scale);
		this.pos = trans.transformPoint(this.pos);
		this.size *= scale;
	}
	drawFill(ctx, color = "#fff"){
		ctx.fillStyle = color;
		ctx.fillRect(this.pos.x - this.size / 2, this.pos.y - this.size / 2, this.size, this.size);
	}
}
class textRender extends dot{
	constructor(pos, txt = "text",  size = 12){
		super(pos, size);
		this.txt = txt;
		this.font = "helvetica";
		this.align = "center";
	}
	
	distort(distortion){
		this.pos = distortion.distortPoint(this.pos);
	}
	drawFill(ctx, color = "#fff"){
		ctx.fillStyle = color;
		ctx.font = this.size + "px " + this.font;
		ctx.textAlign = this.align;
		ctx.fillText(this.txt, this.pos.x, this.pos.y + this.size / 4);
	}
}
class line{
	constructor(start, end){
		this.start = start;
		this.end = end;
	}
	
	distort(distortion){
		this.start = distortion.distortPoint(this.start);
		this.end = distortion.distortPoint(this.end);
	}
	transform(translate, rotate = 0, scale = 1){
		var trans = new transformation(translate, rotate, scale);
		this.start = trans.transformPoint(this.start);
		this.end = trans.transformPoint(this.end);
	}
	drawOutline(ctx, color = "#ff0", linewidth = 1){
		ctx.strokeStyle = color;
		ctx.lineWidth = linewidth;
		ctx.beginPath();
		ctx.moveTo(this.start.x, this.start.y);
		ctx.lineTo(this.end.x, this.end.y);
		ctx.stroke();
	}
}
class polygon{
  //type for drawing shapes and doing geometry calculations
  constructor(){
    this._points = [];
    this._position = new vec2();
    this._scale = 1;
    this._rotation = 0;
    this._absVerts = [];
    this._boundingbox = null;
    this._flipped = false;
  }
  
  get boundingBox(){
    if(this._boundingBox == null)
      this.updateBoundingBox();
    return this._boundingbox;
  }
  updateBoundingBox(){
    var absverts = this.absVerts;
    if(absverts.length < 1)
      return new box(this._position.x, this._position.y);
    var l = absverts[0].x;
    var r = absverts[0].x;
    var t = absverts[0].y;
    var b = absverts[0].y;
    for(var i = 1; i < absverts.length; i += 1){
      l = Math.min(l, absverts[i].x);
      r = Math.max(r, absverts[i].x);
      t = Math.min(t, absverts[i].y);
      b = Math.max(b, absverts[i].y);
    }
    this._boundingbox = new box(l, t, r-l, b-t);
  }
  get absoluteVertices(){
    if(this._absVerts == null)
      this.updateAbsVerts();
    return this._absVerts;
  }
  get absVerts(){
    return this.absoluteVertices;
  }
  updateAbsVerts(){
    this._absVerts = [];
    for(var i = 0; i < this._points.length; i += 1){
      var v = this._points[i];
      
      var ang = v.direction;
      var mag = v.distance();
      v = vec2.fromAng(ang + this._rotation, mag);
      
      v = v.multiply(this._scale);
      v = v.plus(this._position);
      this._absVerts.push(v);
    }
    this.updateBoundingBox();
  }
  setVerts(vertices){
    this._points = vertices;
    this.updateAbsVerts();
  }
  get verts(){
    return this._points;
  }
  
  distort(distortion){
	var nv = [];
	this.absVerts.forEach(function(vert){
		var v = distortion.distortPoint(vert);
		nv.push(v);
	});
	this._absVerts = nv;
  }
  move(translation){
    this._position = this._position.plus(translation);
    this._absVerts = null;
    return this;
  }
  setPos(pos){
    this._position = pos;
    this._absVerts = null;
    return this;
  }
  get pos(){
    return this._position;
  }
  setScale(scale){
    this._scale = scale;
    this._absVerts = null;
    return this;
  }
  get scale(){
    return this._scale;
  }
  setRotation(angle){
    this._rotation = angle;
    this._absVerts = null;
    return this;
  }
  get rotation(){
    return this._rotation;
  }
  setFlipped(flip = true){
    this._flipped = flip;
    this._absVerts = null;
  }
  get flipped(){
    return this._flipped;
  }
  transform(translate, rotate = 0, scale = 1){
    //transforms the point data of the polygon
    for(var i = 0; i < this._points.length; i += 1){
		var trans = new transformation(translate, rotate, scale);
		var v = trans.transformPoint(this._points[i]);
		this._points[i] = v;
    }
    this._absVerts = null;
  }
  
  worldPointToLocal(position){
    //transforms an absolute position to the same position in the scope of this polygon
    var v = position;
    
    v = v.minus(this.pos);
    v = v.multiply(1 / this.scale)
    
    var ang = v.direction;
    var mag = v.distance();
    v = vec2.fromAng(ang - this.rotation, mag);
    
    return v;
  }
  
  drawOutline(ctx, color = "#888", thickness = 1){
    var absverts = this.absVerts;
    if(absverts.length < 2)
      return;
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.beginPath();
    ctx.moveTo(absverts[0].x, absverts[0].y);
    for(var i = 0; i < absverts.length; i += 1){
      var i2 = i + 1;
      if(i2 >= absverts.length)
        i2 = 0;
      ctx.lineTo(absverts[i2].x, absverts[i2].y);
    }
    ctx.closePath();
	ctx.stroke();
  }
  drawFill(ctx, color = "#888"){
    var absverts = this.absVerts;
    if(absverts.length < 3)
      return;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(absverts[0].x, absverts[0].y);
    for(var i = 0; i < absverts.length; i += 1){
      var i2 = i + 1;
      if(i2 >= absverts.length)
        i2 = 0;
      ctx.lineTo(absverts[i2].x, absverts[i2].y);
    }
    ctx.fill();
  }
  
  static Rectangle(width, height = width){
    var p = new polygon();
    var verts = [
      new vec2(width / -2, height / -2),
      new vec2(width / -2, height / 2),
      new vec2(width / 2, height / 2),
      new vec2(width / 2, height / -2)
    ];
    p.setVerts(verts);
    return p;
  }
  static Circle(radius, segments = 12){
    var p = new polygon();
    var verts = [];
    for (var i = 0; i < segments; i += 1){
      var ang = (i / segments) * (Math.PI * 2);
      var vec = vec2.fromAng(ang, radius);
      verts.push(vec);
    }
    p.setVerts(verts);
    return p;
  }
}
class box{
  //axis aligned bounding box
  constructor(x = 0, y = 0, w = 0, h = 0){
    this.position = new vec2(x, y);
    this.size = new vec2(w, h);
  }
  
  get top(){
    return this.position.y;
  }
  get bottom(){
    return this.position.y + this.size.y;
  }
  get left(){
    return this.position.x;
  }
  get right(){
    return this.position.x + this.size.x;
  }
  
  drawOutline(ctx, color = "#888", thickness = 1){
    ctx.strokeStyle = color;
    ctx.lineWidth = thickness;
    ctx.strokeRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
  drawFill(ctx, color = "#888"){
    ctx.fillStyle = color;
    ctx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
  }
  
  containsPoint(point){
    return (
      point.x >= this.position.x &&
      point.x <= this.right() &&
      point.y >= this.position.y &&
      point.y <= this.bottom());
  }
  overlaps(boxB){
    return !(
        boxB.left > this.right ||
        boxB.right < this.left ||
        boxB.top > this.bottom ||
        boxB.bottom < this.top );
  }
}

function wrapValue(value, max = 256){
  if(value < 0)
    return max + (value % max);
  if(value >= max)
    return value % max;
  return value;
}