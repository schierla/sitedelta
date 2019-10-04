namespace uiUtils {
	export function i18n() {
		var elems = document.querySelectorAll(".i18n");
		for (var i = 0; i < elems.length; i++) {
			var title = elems[i].getAttribute("title");
			if (title) elems[i].setAttribute("title", _translate(title));
			var placeholder = elems[i].getAttribute("placeholder");
			if (placeholder) elems[i].setAttribute("placeholder", _translate(placeholder));
			var firstChild = elems[i].firstChild;
			if ("data" in (firstChild as CharacterData))
				(firstChild as CharacterData).data = _translate((firstChild as CharacterData).data);
		}
	}

	function _translate(key: string): string {
		if (key.startsWith("__MSG_") && key.endsWith("__")) {
			key = key.substr(6, key.length - 8);
			key = chrome.i18n.getMessage(key);
		}
		return key;
	}

	export class SortedList<T> {
		id: string;
		elements: Record<string, {data: T, element: HTMLOptionElement}> = {};
		shown: string[] = [];
		container: HTMLSelectElement;
		isBefore: (keya: string, a: T, keyb: string, b: T) => boolean = (keya: string, a: T, keyb: string, b: T) => true;
		isShown: (key: string, data: T) => boolean = (key: string, data: T) => true;

		createElement: (key: string, data: T) => HTMLOptionElement;
		updateElement: (element: HTMLOptionElement, data: T) => void;

		afterSelect: (() => void) | null = null;

		constructor( id: string, createElement: (key: string, data: T) => HTMLOptionElement, updateElement: (element: HTMLOptionElement, data: T) => void) {
			this.id = id;
			this.createElement = createElement;
			this.updateElement = updateElement;
			var container = document.querySelector("#" + id);
			this.container = container as HTMLSelectElement;
			this.container.addEventListener("change", () => this.select());
		}

		select(): void {
			document.body.classList.remove(this.id + "None", this.id + "One", this.id + "Multiple");
			var options = this.container.options;
			var selected = 0;
			for (var i = 0; i < options.length; i++) if (options[i].selected) selected++;
			if(selected == 0) document.body.classList.add(this.id + "None");
			else if(selected == 1) document.body.classList.add(this.id + "One");
			else document.body.classList.add(this.id + "Multiple");
			if(this.afterSelect) this.afterSelect();
		}

		refresh(): void {
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
		}

		updateItem(key: string, data: T) {
			if (!(key in this.elements)) {
				this.elements[key] = { data: data, element: this.createElement(key, data) };
				this.updateElement(this.elements[key].element, data)
			} else if (this.elements[key].data != data) {
				this.updateElement(this.elements[key].element, data);
				this.elements[key].data = data;
			}
		}

		removeItem(key: string): void {
			this.container.removeChild(this.elements[key].element);
			delete this.elements[key];
		}

		updateAll(map: Record<string, T>): void {
			for (var key in this.elements) if (!(key in map)) this.removeItem(key);
			for (var key in map) this.updateItem(key, map[key]);
			this.refresh();
		}

		async foreachSelected (first: (key: string, data: T) => void, rest?: (key: string, data: T) => void) {
			var options = this.container.options;
			for (var i = 0; i < options.length; i++) {
				if (options[i].selected) {
					options[i].selected = false;
					this.select();
					await Promise.resolve(first(this.shown[i], this.elements[this.shown[i]].data));
					if(rest !== undefined) first = rest;
				}
			}
		}
	}
};

uiUtils.i18n();