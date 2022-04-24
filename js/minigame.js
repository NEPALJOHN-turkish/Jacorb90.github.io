var lsTitle = "jacorbMetaGame";
var player = {};
var intervals = {};
var tmp = {};

function getStartPlayer() { return {
	started: false,
	pts: new Decimal(0),
	upgs: [null, new Decimal(0), new Decimal(0), new Decimal(0), new Decimal(0)],
	autoUpgs: false,
	prestige: new Decimal(0),
	prestigeUpgs: [null, new Decimal(0), new Decimal(0)],
}}

function loadMinigameStuff() {
	let start = getStartPlayer();
	
	let data = localStorage.getItem(lsTitle);
	if (data) {
		try {
			player = JSON.parse(atob(data));
		} catch(e) {
			player = start;
		}
	} else player = start;
	
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
	
	player.pts = player.pts.root(player.upgs[1].times(tmp.upgPower).max(1)).plus(player.upgs[1].times(tmp.upgPower).times(Decimal.pow(2, player.upgs[2].times(tmp.upgPower)).times(Decimal.pow(OVERALL_DATA.totalScore, player.upgs[4].times(tmp.upgPower)))).pow(tmp.mainExp).times(diff)).pow(player.upgs[1].times(tmp.upgPower).max(1));
	if (player.autoUpgs && (player.prestige.gte(1e6)||player.prestigeUpgs[1].gte(12))) maxAll();
}

function updateTemp() {
	tmp.upgPower = player.prestigeUpgs[1].div(4).plus(1);
	tmp.mainExp = Decimal.add(Math.log(OVERALL_DATA.totalScore+1)+1, 1).times(Decimal.mul(player.upgs[3].times(tmp.upgPower), 0.25).plus(1)).times(player.pts.plus(1).log10().plus(1).log2().times(player.prestigeUpgs[2]).div(100).plus(1));
	tmp.prestigeGain = player.pts.plus(1).log("1e12375").root(1.2)
	if (tmp.prestigeGain.gte(50)) tmp.prestigeGain = Decimal.pow(50, tmp.prestigeGain.log(50).sqrt());
	tmp.prestigeGain = tmp.prestigeGain.times(Decimal.pow(2, player.prestigeUpgs[1])).times(player.pts.plus(1).log10().plus(1).log2().times(player.prestigeUpgs[2]).div(100).plus(1)).floor();
	
	let p2 = tmp.prestigeGain.plus(1).div(Decimal.pow(2, player.prestigeUpgs[1])).div(player.pts.plus(1).log10().plus(1).log2().times(player.prestigeUpgs[2]).div(100).plus(1));
	if (p2.gte(50)) p2 = Decimal.pow(50, p2.log(50).pow(2));
	tmp.nextPrestige = Decimal.pow("1e12375", p2.pow(1.2));

	let p = player.prestige;
	tmp.prestigeEff = p.plus(1).log2().pow(1.1).times(player.pts.plus(1).log10().plus(1).log2().times(player.prestigeUpgs[2]).div(100).plus(1));
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
	if (player.prestige.gte(10)||player.prestigeUpgs[1].gte(1)) {
		for (let i=1;i<=4;i++) {
			if (i>1) if (player.upgs[i-1].lt(1)) return;
			if (player.pts.lt(getUpgCost(i))) continue;
			player.upgs[i] = player.upgs[i].max(getUpgTarg(i));
		}
	}
}

let startPrestigeUpgCosts = [null, 100, 5e8]

function getPrestigeUpgCost(x) {
	let cost = Decimal.pow(9+x, Decimal.pow(1.3+0.1*x, player.prestigeUpgs[x].div(x).pow(.4+x/10)).sub(1)).times(startPrestigeUpgCosts[x]);
	if (cost.gte(25*startPrestigeUpgCosts[x])) cost = Decimal.pow(25*startPrestigeUpgCosts[x], cost.log(25*startPrestigeUpgCosts[x]).pow(3))
	return cost;
}

function buyPrestigeUpg(x) {
	let cost = getPrestigeUpgCost(x);
	if (player.prestige.lt(cost)) return;
	player.prestige = player.prestige.sub(cost)
	player.prestigeUpgs[x] = player.prestigeUpgs[x].plus(1);
}

function importSave() {
	const save = prompt("Input your save here: ");

	localStorage.setItem(lsTitle, save);
	loadMinigameStuff();
	location.reload();
}

function exportSave() {
	prompt("Here's your save: ", btoa(JSON.stringify(player)));
}