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
		p1.upDown = 2000;
	} else if (e.keyCode == 83) {
		if (!p1.downDown) {p1.downPress = true}
		p1.downDown = 2000;
	} else if (e.keyCode == 65) {
		if (!p1.leftDown) {p1.leftPress = true}
		p1.leftDown = 2000;
	} else if (e.keyCode == 68) {
		if (!p1.rightDown) {p1.rightPress = true}
		p1.rightDown = 2000;
	} else if (e.keyCode == 81) {
		if (!p1.itemDown) {p1.itemPress = true}
		p1.itemDown = 2000;
	} else if (e.keyCode == 38) {
		if (!p2.upDown) {p2.upPress = true}
		p2.upDown = 2000;
	} else if (e.keyCode == 40) {
		if (!p2.downDown) {p2.downPress = true}
		p2.downDown = 2000;
	} else if (e.keyCode == 37) {
		if (!p2.leftDown) {p2.leftPress = true}
		p2.leftDown = 2000;
	} else if (e.keyCode == 39) {
		if (!p2.rightDown) {p2.rightPress = true}
		p2.rightDown = 2000;
	} else if (e.keyCode == 191) {
		if (!p2.itemDown) {p2.itemPress = true}
		p2.itemDown = 2000;
	}
});
document.addEventListener('keyup', function (e) {
	if (e.keyCode == 87) {
		p1.upDown = 0;
	} else if (e.keyCode == 83) {
		p1.downDown = 0;
	} else if (e.keyCode == 65) {
		p1.leftDown = 0;
	} else if (e.keyCode == 68) {
		p1.rightDown = 0;
	} else if (e.keyCode == 81) {
		p1.itemDown = 0;
	} else if (e.keyCode == 38) {
		p2.upDown = 0;
	} else if (e.keyCode == 40) {
		p2.downDown = 0;
	} else if (e.keyCode == 37) {
		p2.leftDown = 0;
	} else if (e.keyCode == 39) {
		p2.rightDown = 0;
	} else if (e.keyCode == 191) {
		p2.itemDown = 0;
	}
	if (e.keyCode == 69) {
		if ($('.joining').css('display') != 'none') {
			joing();
		}
	}
	e.preventDefault();
});

$('.txt-input').on('keydown', function (e) {e.stopPropagation()})
$('.txt-input').on('keyup', function (e) {e.stopPropagation()})
$('.joining .joinBtn').click(function () {joing()});
$('.joining .join1Btn').click(function () {joing(1)});
$('.joining .join2Btn').click(function () {joing(2)});
$('.joining .dismissBtn').click(function () {
	$('.joining').hide();
});
$('.joining .joinBtn').text('按e加入');

initDone && initDone();