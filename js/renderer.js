class polyRenderer{
	constructor(){
		this.pos = new vec2();
		this.offset = new vec2(canvas.width / 2, canvas.height / 2);
		this.offsetAng = Math.PI / 2;
		this.rotation = 0;
		this.zoom = 1;
		this.renderQueue = [];
		this.distortions = [];
	}
	
	addDistortion(distort){
		this.distortions.push(distort);
	}
	push(poly, fillcolor = "#000", linecolor = "#fff", linewidth = 1){
		this.renderQueue.push({
			polygon:poly, 
			fillColor:fillcolor, 
			lineColor:linecolor, 
			lineWidth:linewidth
			});
	}
	render(ctx){
		/* // Distortion test:
		this.distortions.push(new distortion(
			new vec2(200 -  lastTime / 10, 0), 
			70, 
			new transformation(new vec2(0, 0), 0, 3),
			true
			));
		*/
		var ths = this;
		var ttrans = new transformation(ths.pos.inverted, ths.rotation + this.offsetAng, ths.zoom);
		
		this.distortions.forEach(function(dis){
			dis.pos = ttrans.transformPoint(dis.pos);
			dis.pos = dis.pos.plus(ths.offset);
		});
		this.renderQueue.forEach(function(poly){
			poly.polygon.transform(ths.pos.inverted, ths.rotation + ths.offsetAng, ths.zoom);
			poly.polygon.transform(ths.offset)
			
			ths.distortions.forEach(function(dis){
				dis.distortPoly(poly.polygon);
			});
			
			if(poly.polygon.drawFill) poly.polygon.drawFill(ctx, poly.fillColor);
			if(poly.polygon.drawOutline) poly.polygon.drawOutline(ctx, poly.lineColor, poly.lineWidth);
		});
		this.renderQueue = [];
		this.distortions = [];
	}
	track(pos, angle){
		this.pos = pos;
		this.rotation = angle;
	}
}