var uiUtils = {
	i18n: function () {
		var elems = document.querySelectorAll(".i18n");
		for (var i = 0; i < elems.length; i++) {
			if (elems[i].getAttribute("title"))
				elems[i].setAttribute("title", uiUtils._translate(elems[i].getAttribute("title")));
			if (elems[i].getAttribute("placeholder"))
				elems[i].setAttribute("placeholder", uiUtils._translate(elems[i].getAttribute("placeholder")));
			if (elems[i].firstChild && elems[i].firstChild.data)
				elems[i].firstChild.data = uiUtils._translate(elems[i].firstChild.data);
		}
	},
	_translate: function (key) {
		if (key.startsWith("__MSG_") && key.endsWith("__")) {
			key = key.substr(6, key.length - 8);
			key = chrome.i18n.getMessage(key);
		}
		return key;
	},

	sortedList: function (id, creator, updater) {
		var ret = {
			elements: {},
			shown: [],
			container: document.querySelector("#" + id),
			isBefore: (keya, a, keyb, b) => true,
			isShown: (key, data) => true,

			createElement: creator,
			updateElement: updater,

			afterSelect: null,

			select: function() {
				document.body.classList.remove(id+"None", id+"One", id+"Multiple");
				var options = this.container.options;
				var selected = 0;
				for (var i = 0; i < options.length; i++) if (options[i].selected) selected++;
				if(selected == 0) document.body.classList.add(id+"None");
				else if(selected == 1) document.body.classList.add(id+"One");
				else document.body.classList.add(id+"Multiple");
				if(this.afterSelect) this.afterSelect();
			},

			refresh: function () {
				for (var i = 0; i < this.shown.length; i++) {
					if (!(this.shown[i] in this.elements)) {
						this.shown.splice(i, 1); i--;
					} else if (!this.isShown(this.shown[i], this.elements[this.shown[i]].data)) {
						this.container.removeChild(this.elements[this.shown[i]].element); this.shown.splice(i, 1); i--;
					}
				}
				for (var i = 0; i < this.shown.length - 1; i++) {
					if (i < 0) continue;
					if (!this.isBefore(this.shown[i], this.elements[this.shown[i]].data, this.shown[i + 1], this.elements[this.shown[i + 1]].data)) {
						this.container.removeChild(this.elements[this.shown[i]].element); this.shown.splice(i, 1); i -= 2;
					}
				}
				for (var key in this.elements) {
					if (this.shown.indexOf(key) !== -1) continue;
					if (!this.isShown(key, this.elements[key].data)) continue;
					for (var i = 0; i < this.shown.length; i++) {
						var before = this.isBefore(this.shown[i], this.elements[this.shown[i]].data, key, this.elements[key].data);
						if (!before) {
							this.container.insertBefore(this.elements[key].element, this.elements[this.shown[i]].element);
							this.shown.splice(i, 0, key);
							break;
						}
					}
					if (this.shown.indexOf(key) !== -1) continue;
					this.container.appendChild(this.elements[key].element);
					this.shown.push(key);
				}
				this.select();
			},

			updateItem: function (key, data) {
				if (!(key in this.elements)) {
					this.elements[key] = { data: data, element: this.createElement(key, data) };
					this.updateElement(this.elements[key].element, data)
				} else if (this.elements[key].data != data) {
					this.updateElement(this.elements[key].element, data);
					this.elements[key].data = data;
				}
			},

			removeItem: function (key) {
				this.container.removeChild(this.elements[key].element);
				delete this.elements[key];
			},

			updateAll: function (map) {
				for (var key in this.elements) if (!(key in map)) this.removeItem(key);
				for (var key in map) this.updateItem(key, map[key]);
				this.refresh();
			},

			foreachSelected: function (firstcallback, nextcallback, after) {
				if (nextcallback === undefined) nextcallback = firstcallback;
				var options = this.container.options;
				for (var i = 0; i < options.length; i++) {
					if (options[i].selected) {
						options[i].selected = false;
						this.select();
						firstcallback(this.shown[i], this.elements[this.shown[i]].data, () => this.foreachSelected(nextcallback, nextcallback, after));
						return;
					}
				}
				if (after !== undefined) after();
			}
		};
		ret.container.addEventListener("change", () => ret.select());
		return ret;
	}
};

uiUtils.i18n();