//pc的控制器
var p1 = {
	upDown: 0,
	downDown: 0,
	leftDown: 0,
	rightDown: 0,
	itemDown: false,
	team: 0
}

document.addEventListener('keydown', function (e) {
	if (e.keyCode == 87) {
		if (!p1.upDown) {p1.upPress = true}
		p1.upDown = true;
	} else if (e.keyCode == 83) {
		if (!p1.downDown) {p1.downPress = true}
		p1.downDown = true;
	} else if (e.keyCode == 65) {
		if (!p1.leftDown) {p1.leftPress = true}
		p1.leftDown = true;
	} else if (e.keyCode == 68) {
		if (!p1.rightDown) {p1.rightPress = true}
		p1.rightDown = true;
	} else if (e.keyCode == 81) {
		if (!p1.itemDown) {p1.itemPress = true}
		p1.itemDown = true;
	} else if (e.keyCode == 32) {
		if (!p1.spaceDown) {p1.spacePress = true}
		p1.spaceDown = true;
		e.preventDefault();
	}
});
document.addEventListener('keyup', function (e) {
	if (e.keyCode == 87) {
		p1.upDown = false;
	} else if (e.keyCode == 83) {
		p1.downDown = false;
	} else if (e.keyCode == 65) {
		p1.leftDown = false;
	} else if (e.keyCode == 68) {
		p1.rightDown = false;
	} else if (e.keyCode == 81) {
		p1.itemDown = false;
	} else if (e.keyCode == 32) {
		p1.spaceDown = false;
		e.preventDefault();
	} else if (e.keyCode == 69) {
		p1.onJoin && p1.onJoin();
	}
});
