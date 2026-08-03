// 极简 DOM 辅助库，替代已停更的 Zepto（仅覆盖本项目用到的 API）
(function (global) {
	function isHtml(str) {
		return typeof str === "string" && str.charAt(0) === "<";
	}

	function make(html) {
		var tpl = document.createElement("template");
		tpl.innerHTML = html.trim();
		return tpl.content.firstChild;
	}

	function matches(el, sel) {
		return el.matches && el.matches(sel);
	}

	function Wrap(list) {
		this.length = list.length;
		this.list = list;
		for (var i = 0; i < list.length; i++) {
			this[i] = list[i];
		}
	}

	Wrap.prototype.show = function () {
		return this.each(function (el) { el.style.display = ""; });
	};
	Wrap.prototype.hide = function () {
		return this.each(function (el) { el.style.display = "none"; });
	};
	Wrap.prototype.css = function (prop, val) {
		if (val === undefined) {
			return this[0] ? getComputedStyle(this[0])[prop] : "";
		}
		return this.each(function (el) { el.style[prop] = val; });
	};
	Wrap.prototype.addClass = function (cls) {
		return this.each(function (el) { el.classList.add(cls); });
	};
	Wrap.prototype.removeClass = function (cls) {
		return this.each(function (el) { el.classList.remove(cls); });
	};
	Wrap.prototype.attr = function (name) {
		return this[0] ? this[0].getAttribute(name) : null;
	};
	Wrap.prototype.data = function (name) {
		return this[0] ? this[0].getAttribute("data-" + name) : null;
	};
	Wrap.prototype.is = function (sel) {
		return this[0] ? matches(this[0], sel) : false;
	};
	Wrap.prototype.html = function (str) {
		if (str === undefined) {
			return this[0] ? this[0].innerHTML : "";
		}
		return this.each(function (el) { el.innerHTML = str; });
	};
	Wrap.prototype.append = function (node) {
		return this.each(function (el) {
			if (typeof node === "string") {
				el.insertAdjacentHTML("beforeend", node);
			} else if (node.list) {
				node.list.forEach(function (n) { el.appendChild(n); });
			} else {
				el.appendChild(node);
			}
		});
	};
	Wrap.prototype.prepend = function (node) {
		return this.each(function (el) {
			if (typeof node === "string") {
				el.insertAdjacentHTML("afterbegin", node);
			} else if (node.list) {
				node.list.forEach(function (n) { el.insertBefore(n, el.firstChild); });
			} else {
				el.insertBefore(node, el.firstChild);
			}
		});
	};
	Wrap.prototype.click = function (fn) {
		return this.on("click", fn);
	};
	Wrap.prototype.on = function (evt, sel, fn) {
		if (fn === undefined) {
			fn = sel;
			sel = null;
		}
		return this.each(function (el) {
			el.addEventListener(evt, function (e) {
				if (sel) {
					var t = e.target;
					while (t && t !== el) {
						if (matches(t, sel)) {
							e.currentTarget = t;
							fn.call(t, e);
							return;
						}
						t = t.parentNode;
					}
				} else {
					fn.call(el, e);
				}
			});
		});
	};
	Wrap.prototype.index = function () {
		if (!this[0] || !this[0].parentNode) { return -1; }
		var kids = this[0].parentNode.children;
		for (var i = 0; i < kids.length; i++) {
			if (kids[i] === this[0]) { return i; }
		}
		return -1;
	};
	Wrap.prototype.each = function (fn) {
		for (var i = 0; i < this.list.length; i++) {
			fn(this.list[i], i);
		}
		return this;
	};

	function query(sel, root) {
		var r = root || document;
		if (sel && sel.nodeType) {
			return new Wrap([sel]);
		}
		if (isHtml(sel)) {
			return new Wrap([make(sel)]);
		}
		return new Wrap(Array.prototype.slice.call(r.querySelectorAll(sel)));
	}

	// 单元素查询
	query.one = function (sel, root) {
		var r = root || document;
		if (sel && sel.nodeType) {
			return new Wrap([sel]);
		}
		if (isHtml(sel)) {
			return new Wrap([make(sel)]);
		}
		var el = r.querySelector(sel);
		return new Wrap(el ? [el] : []);
	};

	// JSON GET
	function get(url, cb) {
		var xhr = new XMLHttpRequest();
		xhr.open("GET", url, true);
		xhr.onload = function () {
			if (cb) { cb(xhr.responseText, "success", xhr); }
		};
		xhr.onerror = function () {
			if (cb) { cb(null, "error", xhr); }
		};
		xhr.send();
	}

	// JSON POST
	function post(url, data, cb) {
		var xhr = new XMLHttpRequest();
		xhr.open("POST", url, true);
		xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		xhr.onload = function () {
			if (cb) { cb(xhr.responseText, "success", xhr); }
		};
		xhr.send(typeof data === "string" ? data : null);
	}

	// AJAX（覆盖本项目用到的 {url, type, data, success}）
	function ajax(opt) {
		var xhr = new XMLHttpRequest();
		xhr.open((opt.type || "GET"), opt.url, true);
		xhr.onload = function () {
			if (opt.success) { opt.success(xhr.responseText, "success", xhr); }
		};
		xhr.onerror = function () {
			if (opt.error) { opt.error(xhr); }
		};
		xhr.send(opt.data || null);
	}

	// 把静态方法挂到 query 和 query.one 上，兼容 $.get / $.ajax 写法
	["get", "post", "ajax"].forEach(function (name) {
		query[name] = name === "get" ? get : (name === "post" ? post : ajax);
		query.one[name] = name === "get" ? get : (name === "post" ? post : ajax);
	});

	// $ 采用 query（返回所有匹配元素，符合 zepto 原版语义），
	// 静态方法 $.get / $.post / $.ajax 仍可直接调用
	global.$ = query;
	global.$$ = query;
	global.ZeptoLite = query;
})(window);
