var C = {
	TW: 40,	//tile width
	TH: 40, //tile height
	IS: 15, //item size

	GAME_STATUS_INIT: 1,
	GAME_STATUS_RUNNING: 2,
	GAME_STATUS_PAUSE: 3,
	GAME_STATUS_OVER: 4
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = C;
} else if (typeof window !== 'undefined') {
	window.C = C;
}