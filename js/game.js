var canvas = document.getElementById("canvas");
var context = canvas.getContext("2d");
var width = canvas.width;
var height = canvas.height;
var lastTime = 0;
var dt = 0;
var odt = 0;
var curKeyState = [];
var stepTime = 16.6666;
var player1 = new player();
var playerView = new polyRenderer();
var physObjects = [];
var AOEs = [];
var physEngine;
var physWorld;

function clrCanvas(){
	context.fillStyle = "#222";
	context.fillRect(0, 0, width, height);
}
function init(){
	initKeyState();
	initControls();
	initStars();
	initPhysics();
	DEBUGINIT();
	player1 = new player();
	player1.worldAdd();
	clrCanvas();
	requestAnimationFrame(step);
}
function initKeyState(){
	curKeyState = [];
	for (var i = 256; i > 0; i--)
		curKeyState.push(false);
}
function step(){
	gameStep();
	requestAnimationFrame(step);
	dt = performance.now() - lastTime;
	lastTime = performance.now();
}
function gameStep(){
	odt += dt;
	while(odt >= stepTime){
		odt -= stepTime;
		update(1);
	}
	updateStars(player1.pos, player1.vel);
	updateParticles(dt / 16.6667);
	draw(context, playerView);
	handleSpawns(dt / 16.6667);
}
function update(){
	player1.resetStateVars();
	player1.control(curKeyState);
	playerView.track(player1.pos, player1.angle);
	updateObjects();
}
function draw(ctx, rdrr){
	clrCanvas();
	drawStars(playerView);
	drawParticles(playerView);
	drawObjects(rdrr);
	playerView.render(ctx);
	drawFrame(ctx);
	drawHUD(ctx, player1);
}

function DEBUGINIT(){
	var itm = new item();
	itm.setPos(new vec2(100, 0));
	itm.worldAdd();
}

function isRenderFrame(){
	return odt < stepTime;
}
function initPhysics(){
	physEngine = Matter.Engine.create();
	physWorld = physEngine.world;
	physWorld.gravity.x = 0;
	physWorld.gravity.y = 0;
	//Matter.Events.on(physEngine, 'collisionStart', physCollisionStart);
}
function physCollisionStart(event){
	//depricated. See `object.collideWith()`
	for(var i = event.pairs.length - 1; i >= 0; i--){
		var pair = event.pairs[i];
		if(!pair.bodyA.parent.gameObject && !pair.bodyB.parent.gameObject)
			continue;
		if(pair.bodyA.parent.gameObject)
			pair.bodyA.parent.gameObject.collideWith(pair.bodyB.parent, pair.collision);
		if(pair.bodyB.parent.gameObject)
			pair.bodyB.parent.gameObject.collideWith(pair.bodyA.parent, pair.collision);
	}
}

function drawFrame(ctx){
	ctx.fillStyle = "#000";
	ctx.strokeStyle = "#fff";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(width, height)
	ctx.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
	ctx.lineTo(width, 0);
	ctx.lineTo(0, 0);
	ctx.lineTo(0, height);
	ctx.closePath();
	ctx.fill();
	//ctx.stroke();
}
function drawHUD(ctx, plr){
	
	///
	/// draw health display
	///
	var healthPos = new vec2(width - 50, 50);
	var hsize = 45;
	var hprc = Math.max(plr.health, 0) / 10;
	
	ctx.fillStyle = "#050";
	ctx.strokeStyle = "#0f0";
	ctx.beginPath();
	ctx.arc(healthPos.x, healthPos.y, hsize, 0, Math.PI * 2);
	ctx.fill();
	ctx.fillStyle = "#500";
	if(lastTime % 200 < 100)
		ctx.fillStyle = hprc > 0.35 ? "#500" : "#a00";
	ctx.beginPath();
	ctx.arc(healthPos.x, healthPos.y, hsize - hsize * hprc, 0, Math.PI * 2);
	ctx.fill();
	ctx.strokeStyle = "#0f0";
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(healthPos.x, healthPos.y, hsize, 0, Math.PI * 2);
	ctx.stroke();
	
	ctx.fillStyle = "#fff";
	ctx.align = "center;"
	ctx.font = "12px helvetica";
	ctx.fillText("Hull Integrity:", healthPos.x, healthPos.y - 8);
	ctx.font = "24px helvetica";
	var vhlth = Math.round(hprc * 100);
	ctx.fillText(vhlth + "%", healthPos.x, healthPos.y + 16);
	
	///
	/// draw equipment display
	///
	var wepPos = new vec2(10, height - 30);
	var eqPos = new vec2(width - 180, height - 30);
	var cmPos = new vec2(width / 2 - 50, height - 20);
	
	if(plr._selecting > 0.1){
		switch(plr._selectMode){
			case 0:
				for(var i in plr.pWeapons){
					if(!plr.pWeapons[i]){
						weapon.drawNullWepDisplay(plr, ctx, wepPos.plus(new vec2(0, (-30 * i - 30) * plr._selecting)), i == plr.pWep);
						continue;
					}
					plr.pWeapons[i].drawDisplay(plr, ctx, wepPos.plus(new vec2(0, (-30 * i - 30) * plr._selecting)), i == plr.pWep);
				}
				break;
			case 1:
				for(var i in plr.consumables){
					if(!plr.consumables[i]){
						consumable.drawNullCmDisplay(plr, ctx, cmPos.plus(new vec2(0, (-30 * i - 30) * plr._selecting)), i == plr.cWep);
						continue;
					}
					plr.consumables[i].drawDisplay(plr, ctx, cmPos.plus(new vec2(0, (-30 * i - 30) * plr._selecting)), i == plr.cWep);
				}
				break;
			case 2:
				for(var i in plr.sWeapons){
					if(!plr.sWeapons[i]){
						equipment.drawNullEqDisplay(plr, ctx, eqPos.plus(new vec2(0, (-30 * i - 30) * plr._selecting)), i == plr.sWep);
						continue;
					}
					plr.sWeapons[i].drawDisplay(plr, ctx, eqPos.plus(new vec2(0, (-30 * i - 30) * plr._selecting)), i == plr.sWep);
				}
				break;
		}
	}
	
	plr.primaryWep.drawDisplay(plr, ctx, wepPos, true);
	
	if(!plr.secondaryWep) equipment.drawNullEqDisplay(plr, ctx, eqPos, true);
	else plr.secondaryWep.drawDisplay(plr, ctx, eqPos, true);
	
	if(!plr.consumable) consumable.drawNullCmDisplay(plr, ctx, cmPos, true);
	else plr.consumableItem.drawDisplay(plr, ctx, eqPos, true);
}

function drawObjects(rdrr){
	physObjects.forEach(function(obj){
		obj.draw(rdrr);
	});
}
function updateObjects(){
	Matter.Engine.update(physEngine, stepTime);
	physObjects.forEach(function(obj){
		obj.update();
	});
	doAOEs();
}
function doAOEs(){
	for(var i in AOEs)
		AOEs[i].applyEffect();
	AOEs = [];
}

function initControls(){
	document.addEventListener('keydown', function(event){ keyDownHandle(event); });
	document.addEventListener('keyup', function(event){ keyUpHandle(event); });
}
function keyDownHandle(event){
	curKeyState[event.keyCode] = true;
	//console.log(event.keyCode);
}
function keyUpHandle(event){
	curKeyState[event.keyCode] = false;
}

function rand(min = 0, max = 1){
	return (Math.random() * (max - min) + min);
}
function iRand(min = 0, max = 100){
	return Math.floor(Math.random() * (max - min) + min);
}
function mod(div, max){
	if(div > 0)
		return div % max;
	return div % max + max;
}
function angDist(source, target){
	var dif = target - source;
	dif = mod(dif + Math.PI, Math.PI * 2) - Math.PI;
	return dif;
}

init();