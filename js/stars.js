var maxStars = 300;
var stars = [];
var maxStarDistance = 400;
var minStarDistance = 300;

function updateStars(focalpoint, movementvector = new vec2()){
	for(var i = stars.length - 1; i >= 0; i--){
		if(stars[i].pos.distance(focalpoint) > maxStarDistance){
			stars.splice(i, 1);
			spawnStar(focalpoint, movementvector);
		}
	}
}
function spawnStar(focalpoint, movementvector = new vec2()){
	var ang = Math.random() * Math.PI * 2;
	if(!movementvector.equals(new vec2(), 0.1))
		ang = movementvector.direction + Math.PI * (Math.random() -0.5);
	stars.push(new star(focalpoint.plus(vec2.fromAng(ang, minStarDistance))));
}
function initStars(focalpoint){
	stars = [];
	var sqdist = (Math.PI * (maxStarDistance * 2)) / 4;
	for(var i = maxStars; i > 0; i--)
		stars.push(new star(new vec2((Math.random() - 0.5) * sqdist, (Math.random() - 0.5) * sqdist)));
}
function drawStars(rdrr){
	stars.forEach(function(star){
		star.draw(rdrr);
	});
}

class star{
	constructor(pos){
		this.pos = pos;
		this.size = Math.random() * 2 + 1;
		this.brightness = Math.random();
	}
	
	get dot(){
		return new dot(this.pos, this.size);
	}
	get color(){
		var byt = Math.floor(128 + (this.brightness * 128));
		return "rgb(" + byt.toString() + "," + byt.toString() + "," + byt.toString() + ")";
	}
	draw(rdrr){
		rdrr.push(this.dot, this.color);
	}
}