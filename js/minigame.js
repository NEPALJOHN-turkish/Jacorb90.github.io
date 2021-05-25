var lsTitle = "jacorbMetaGame";
var player = {};
var intervals = {};
var tmp = {};

function getStartPlayer() { return {
	started: false,
	pts: new Decimal(0),
	upgs: [null, new Decimal(0), new Decimal(0), new Decimal(0)],
}}

function loadMinigameStuff() {
	let start = getStartPlayer();
	
	let data = localStorage.getItem(lsTitle);
	if (data) player = JSON.parse(atob(data));
	else player = start;
	
	fixPlayerObj(player, start);
	
	intervals.game = setInterval(function() { gameLoop(50/1000) }, 50)
	intervals.save = setInterval(save, 1000)
}

function fixPlayerObj(obj, start) {
	for (let x in start) {
		if (obj[x] === undefined) obj[x] = start[x]
		else if (typeof start[x] == "object" && !(start[x] instanceof Decimal)) fixPlayerObj(obj[x], start[x])
		else if (start[x] instanceof Decimal) obj[x] = new Decimal(obj[x])
	}
	if (Array.isArray(player.autos)) player.autos = {};
}

function save() { localStorage.setItem(lsTitle, btoa(JSON.stringify(player))) }

function gameLoop(diff) {
	updateTemp();
	
	player.pts = player.pts.root(player.upgs[1].max(1)).plus(player.upgs[1].times(Decimal.pow(2, player.upgs[2])).pow(tmp.mainExp).times(diff)).pow(player.upgs[1].max(1));
}

function updateTemp() {
	tmp.mainExp = Decimal.add(Math.log(OVERALL_DATA.totalScore+1)+1, 1).times(Decimal.mul(player.upgs[3], 0.25).plus(1));
}

function getUpgCost(x) {
	if (x==1) return Decimal.pow(2, Decimal.pow(2, player.upgs[x])).sub(2);
	else if (x==2) return Decimal.pow(1e10, Decimal.pow(2, player.upgs[x].pow(1.1))).times(1e50);
	else return Decimal.pow(1e50, Decimal.pow(2, player.upgs[x])).times(1e165);
}

function buyUpg(x) {
	let cost = getUpgCost(x);
	if (player.pts.lt(cost)) return;
	player.pts = player.pts.sub(cost)
	player.upgs[x] = player.upgs[x].plus(1);
}