var debrisCount = 0;
var enemyCount = 0;
var enemyFrequency = 5;
var enemySpawnDelay = 120;

function handleSpawns(ts){
	despawnCheck();
	if(debrisCount < 5)
		spawnDebris()
	handleEnemySpawns(ts);
}
function handleEnemySpawns(ts){
	var inverseFreq = 1 / enemyFrequency;
	var maxSpawnTime = inverseFreq * 600 * (enemyCount + 1);
	
	enemySpawnDelay = Math.min(maxSpawnTime, enemySpawnDelay);
	enemySpawnDelay -= ts;
	
	if(enemySpawnDelay <= 0){
		spawnEnemy();
		enemySpawnDelay = maxSpawnTime * rand(0.5, 1);
	}
}
function despawnCheck(){
	for(var i = physObjects.length - 1; i >= 0; i--){
		if(physObjects[i].pos.distance(player1.pos) > 500)
			physObjects[i].worldRemove();
	}
}

function spawnDebris(pos = null, ob = null){
	if(pos == null)
		pos = vec2.fromAng(rand(0, Math.PI * 2), 450).plus(player1.pos);
	if(ob == null)
		ob = new debris();
	ob.setPos(pos);
	ob.worldAdd();
}
function spawnEnemy(pos = null, ob = null){
	if(pos == null)
		pos = vec2.fromAng(rand(0, Math.PI * 2), 350).plus(player1.pos);
	if(ob == null)
		ob = chooseSpawnEnemy();
	ob.setPos(pos);
	ob.worldAdd();
	ob.start();
}
function chooseSpawnEnemy(){
	return rand(0, 1) > 0.75 ? new dummy() : new shooter();
}