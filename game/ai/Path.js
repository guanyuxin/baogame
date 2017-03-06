
var C = require('../../static/js/const.js');

//get All possible dest in one move from location [i,j]
// return [y,x,distance,method]
function getDest (map, i, j) {
	var res = [];
	var f = map.floor
	//move
	if (f[i][j] && f[i][j + 1]) {
		res.push([i, j + 1, 1, 'moveRight']);
	}
	if (f[i][j] && f[i][j - 1]) {
		res.push([i, j - 1, 1, 'moveLeft']);
	}
	//climb
	for (var pilla of map.pilla) {
		if (pilla.x > j && pilla.x < j + 1 && i >= pilla.y1 && i <= pilla.y2) {
			for (var k = pilla.y1; k <= pilla.y2; k++) {
				if (k > i) {
					res.push([k, j, k - i, 'climbUp']);
				} else {
					res.push([k, j, i - k, 'climbDown']);
				}
			}
		}
	}
	//jump on floor
	if (f[i][j]) {
		if (f[i][j - 1] && f[i][j + 3]) {
			res.push([i, j + 3, 4, 'jumpRight3']);
		}
		if (f[i][j + 1] && f[i][j - 3]) {
			res.push([i, j - 3, 4, 'jumpLeft3']);
		}
		if (f[i][j - 1] && f[i][j + 4]) {
			res.push([i, j + 4, 5, 'jumpRight4']);
		}
		if (f[i][j + 1] && f[i][j - 4]) {
			res.push([i, j - 4, 5, 'jumpLeft4']);
		}
	}
	//jump down
	if (!f[i][j - 1]) {
		for (var k = 1; k <= 2; k++) {
			if (f[i - k] && f[i - k][j - 1]) {
				res.push([i - k, j - 1, k + 1, 'jumpDownLeft']);
				break;
			}
		}
		for (var k = 3; k <= 4; k++) {
			if (f[i - k] && f[i - k][j - 2]) {
				res.push([i - k, j - 2, k + 1, 'jumpDownLeft']);
				break;
			}
		}
		for (var k = 5; k <= 7; k++) {
			if (f[i - k] && f[i - k][j - 3]) {
				res.push([i - k, j - 3, k + 1, 'jumpDownLeft']);
				break;
			}
		}
	}
	if (!f[i][j + 1]) {
		for (var k = 1; k < 2; k++) {
			if (f[i - k] && f[i - k][j + 1]) {
				res.push([i - k, j + 1, k + 1, 'jumpDownRight']);
				break;
			}
		}
		for (var k = 3; k <= 4; k++) {
			if (f[i - k] && f[i - k][j + 2]) {
				res.push([i - k, j + 2, k + 1, 'jumpDownRight']);
				break;
			}
		}
		for (var k = 5; k <= 7; k++) {
			if (f[i - k] && f[i - k][j + 3]) {
				res.push([i - k, j + 3, k + 1, 'jumpDownRight']);
				break;
			}
		}
	}
	return res;
}

function onPillar(map, i, j) {
	for (var pilla of map.pilla) {
		if (pilla.x > j && pilla.x < j + 1 && i >= pilla.y1 && i <= pilla.y2) {
			return true;
		}
	}
	return false;
}


function deepSearch (map, lengthMap, dirMap) {
	var t = 0;
	while (t < 1000) {
		var find = false;
		for (var i = 0; i < lengthMap.length; i++) {
			for (var j = 0; j < lengthMap[i].length; j++) {
				if (lengthMap[i][j] == -1) {
					continue;
				}
				dest = getDest(map, i, j);
				for (var k = 0; k < dest.length; k++) {
					if (lengthMap[dest[k][0]][dest[k][1]] == -1 || lengthMap[dest[k][0]][dest[k][1]] > lengthMap[i][j] + dest[k][2]) {
						lengthMap[dest[k][0]][dest[k][1]] = lengthMap[i][j] + dest[k][2];
						dirMap[dest[k][0]][dest[k][1]] = dirMap[i][j] || dest[k][3];
						find = true;
					}
				}
			}
		}
		t++;
		if (!find) {
			break;
		}
	}
}

function DR_MAP (dirMap) {
	console.log('\n\n');
	for (var dd = 0; dd < dirMap.length; dd++){
		console.log(dirMap[dd].join(' '))
	}
	console.log('\n\n');
}

var Path = function (map, P) {
	this.lengthMap = [];
	this.dirMap = [];
	//init
	var wc = P.w/C.TW;	
	var hc = P.h/C.TH;
	for (var i = 0; i < hc; i++) {
		this.lengthMap[i] = [];
		this.dirMap[i] = [];
		for (var j = 0; j < wc; j++) {
			this.lengthMap[i][j] = [];
			this.dirMap[i][j] = [];
			if (!map.floor[i][j] && !onPillar(map, i, j)) {
				continue;
			}
			var lengthMap = [];
			var dirMap = [];
			for (var ix = 0; ix < hc; ix++) {
				lengthMap[ix] = [];
				dirMap[ix] = [];
				for (var jx = 0; jx < wc; jx++) {
					if (ix == i && jx == j) {
						lengthMap[ix][jx] = 0;
					} else {
						lengthMap[ix][jx] = -1;
					}
					dirMap[ix][jx] = '';
				}
			}
			deepSearch(map, lengthMap, dirMap);
			this.lengthMap[i][j] = lengthMap;
			this.dirMap[i][j] = dirMap;
		}
	}
}
module.exports = Path;