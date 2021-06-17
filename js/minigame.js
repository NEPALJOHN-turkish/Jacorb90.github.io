var lsTitle = "jacorbMetaGame";
var player = {};
var intervals = {};
var tmp = {};

function getStartPlayer() { return {
	started: false,
	pts: new Decimal(0),
	upgs: [null, new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
	prestige: new Decimal(0),
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
	
	player.pts = player.pts.root(player.upgs[1].max(1)).plus(player.upgs[1].times(Decimal.pow(2, player.upgs[2]).times(Decimal.pow(OVERALL_DATA.totalScore, player.upgs[4]))).pow(tmp.mainExp).times(diff)).pow(player.upgs[1].max(1));
}

function updateTemp() {
	tmp.mainExp = Decimal.add(Math.log(OVERALL_DATA.totalScore+1)+1, 1).times(Decimal.mul(player.upgs[3], 0.25).plus(1));
	tmp.prestigeGain = player.pts.plus(1).log("1e12375").root(1.2).floor();
	tmp.nextPrestige = Decimal.pow("1e12375", tmp.prestigeGain.plus(1).pow(1.2));

	let p = player.prestige;
	tmp.prestigeEff = p.plus(1).log2().pow(1.1);
}

function getUpgCost(x) {
	if (x==1) return Decimal.pow(2, Decimal.pow(2, player.upgs[x].sub(tmp.prestigeEff))).sub(2).max(0);
	else if (x==2) return Decimal.pow(1e10, Decimal.pow(2, player.upgs[x].pow(1.1).sub(tmp.prestigeEff))).times(1e50);
	else if (x==3) return Decimal.pow(1e50, Decimal.pow(2, player.upgs[x].sub(tmp.prestigeEff))).times(1e165);
	else return Decimal.pow(1e75, Decimal.pow(2, player.upgs[x].sub(tmp.prestigeEff))).times("1e390");
}

function getUpgTarg(x) {
	if (x==1) return player.pts.plus(2).log2().log2().plus(tmp.prestigeEff).plus(1).floor();
	else if (x==2) return player.pts.div(1e50).max(1).log(1e10).max(1).log2().plus(tmp.prestigeEff).root(1.1).plus(1).floor();
	else if (x==3) return player.pts.div(1e165).max(1).log(1e50).max(1).log2().plus(tmp.prestigeEff).plus(1).floor();
	else return player.pts.div("1e390").max(1).log(1e75).max(1).log2().plus(tmp.prestigeEff).plus(1).floor();
}

function buyUpg(x) {
	let cost = getUpgCost(x);
	if (player.pts.lt(cost)) return;
	player.pts = player.pts.sub(cost)
	player.upgs[x] = player.upgs[x].plus(1);
}

function doPrestige() {
	if (player.pts.lt("1e12375")) return;
	if (player.prestige.lt(4)) if (!confirm("Are you sure you want to do this reset?")) return;
	player.prestige = player.prestige.plus(tmp.prestigeGain);
	player.pts = new Decimal(0);
	player.upgs = [null, new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)];
}

function maxAll() {
	if (player.prestige.gte(10)) {
		for (let i=1;i<=4;i++) {
			if (i>1) if (player.upgs[i-1].lt(1)) return;
			if (player.pts.lt(getUpgCost(i))) continue;
			player.upgs[i] = player.upgs[i].max(getUpgTarg(i));
		}
	}
}