//移动的控制器
var p1 = {
	upDown: false,
	downDown: false,
	leftDown: false,
	rightDown: false,
	itemDown: false
}
var p2 = {
	upDown: false,
	downDown: false,
	leftDown: false,
	rightDown: false,
	itemDown: false
}

$('.joining .btn').click(function (){joing(true)});

$('body').on('touchmove', function (e) {
	e.preventDefault();
});
$('.notice').hide();
$('.mobileController').show();
var stick = $('.mobileController .centerBtn');
var controlPanel = $('.mobileController .panel');
var cx,cy,cw,ch

function check (e) {
	var t = e.touches[0];
	var dx = Math.floor(t.pageX - cx);
	var dy = Math.floor(t.pageY - cy);
	var r = Math.atan2(dy, dx);
	var dist = Math.sqrt(dx*dx + dy*dy);

	stick.css('left', Math.cos(r) * Math.min(75, dist) + cw);
	stick.css('top', Math.sin(r) * Math.min(75, dist) + ch);
	r = r*180/Math.PI
	if (r > 30 && r < 150 && dist > 10) {
		p1.downDown = dist;
	} else {
		p1.downDown = false;
	}
	if (r < -30 && r > -150 && dist > 10) {
		if (!p1.upDown) {
			p1.upPress = dist;
		}
		p1.upDown = dist;
	} else {
		p1.upDown = false;
	}
	if (r > -60 && r < 60 && dist > 10) {
		p1.rightDown = dist;
	} else {
		p1.rightDown = false;
	}
	if (r < -120 || r > 120 && dist > 10) {
		p1.leftDown = dist;
	} else {
		p1.leftDown = false;
	}
}
$('.mobileController .panel').on('touchstart', function (e) {
	var stickPos = controlPanel.offset();
	cw = controlPanel.width()/2;
	ch = controlPanel.height()/2;
	cx = stickPos.left + cw;
	cy = stickPos.top + ch;
	check(e);
});
$('.mobileController .panel').on('touchmove', check);
$('.mobileController .panel').on('touchend', function (e) {
	stick.css('left', cw);
	stick.css('top', ch);
	p1.leftDown = false;
	p1.rightDown = false;
	p1.upDown = false;
	p1.downDown = false;
});
$('.mobileController .item').on('touchstart', function (e) {
	if (!p1.itemDown) {
		p1.itemPress = true;
	}
	p1.itemDown = true;
});
$('.mobileController .item').on('touchend', function (e) {
	p1.itemDown = false;
});

initDone && initDone();