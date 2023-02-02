function setTab(tab) {
	document.getElementById("main-projects").style.display = tab == 0 ? "flex" : "none";
	document.getElementById("side-projects").style.display = tab == 1 ? "flex" : "none";
	document.getElementById("crying-projects").style.display = tab == 2 ? "flex" : "none";
	document.getElementById("prototypes").style.display = tab == 3 ? "flex" : "none";
}

setTab(0)