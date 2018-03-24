
var regionUtils = {

	showOutline: function (doc, xpath, color) {
		if (regionUtils._outlined.length > 0)
			regionUtils.removeOutline();

		if(xpath.startsWith("/") || xpath.startsWith("id(")) {
			var elements = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
			for(var element = elements.iterateNext(); element != null; element = elements.iterateNext()) {
				regionUtils._outlined.push({ "e": element, "o": element.style.outline });
			}
		} else {
			var elements = doc.querySelectorAll(xpath);
			for(var j=0; j<elements.length; j++) {
				regionUtils._outlined.push({ "e": elements.item(j), "o": elements.item(j).style.outline });
			} 
		}
		for (var i = 0; i < regionUtils._outlined.length; i++) {
			regionUtils._outlined[i].e.style.outline = color + " dotted 2px";
		}

	},

	removeOutline: function () {
		while (regionUtils._outlined.length > 0) {
			var outlined = regionUtils._outlined.shift();
			outlined.e.style.outline = outlined.o;
		}
	},

	selectRegion: function (doc, callback) {
		regionUtils._doc = doc;
		regionUtils._needText = false;
		regionUtils._destelement = null;
		regionUtils._callback = callback;
		doc.addEventListener("mouseover", regionUtils._mouseover, true);
		doc.addEventListener("mousedown", regionUtils._mousedown, true);
		doc.addEventListener("mouseup", regionUtils._mouseup, true);
		doc.addEventListener("mouseout", regionUtils._mouseout, true);
	},

	abortSelect: function () {
		if (regionUtils._destelement !== null)
			regionUtils._destelement.style.outline = "none";
		if (regionUtils._doc === null) return;

		regionUtils._doc.removeEventListener("mouseover", regionUtils._mouseover, true);
		regionUtils._doc.removeEventListener("mousedown", regionUtils._mousedown, true);
		regionUtils._doc.removeEventListener("mouseup", regionUtils._mouseup, true);
		regionUtils._doc.removeEventListener("mouseout", regionUtils._mouseout, true);

		regionUtils._needText = false;
		regionUtils._destelement = null;
		regionUtils._callback = null;
		regionUtils._doc = null;
	},

	_mouseover: function (e) {
		if (regionUtils.needText && !e.target.firstChild.data &&
			(!e.target.id || e.target.id.substr(0, 16) == "sitedelta-change"))
			return;
		e.target.style.outline = "red dotted 2px";
		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	_mouseout: function (e) {
		if (e.target && e.target != regionUtils._destelement)
			e.target.style.outline = "none";
		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	_mousedown: function (e) {
		regionUtils._needText = true;
		regionUtils._destelement = e.target;
		e.target.style.outline = "green solid 2px;";
		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	_mouseup: function (e) {
		e.preventDefault();
		e.stopPropagation();
		regionUtils._mouseout(e);

		if (e.button == 0 && !e.ctrlKey) {
			regionUtils._needText = false;
			if (e.target != regionUtils._destelement && ((e.target.firstChild && e.target.firstChild.data) || e.target.id)) {
				var to = regionUtils._buildXPath(regionUtils._destelement, false).split("/");
				var from = regionUtils._buildXPath(e.target, false).split("/");
				var common = "";
				for (var i = 0; i < Math.min(to.length, from.length); i++) {
					common += "/" + to[i];
					if (to[i] != from[i]) break;
				}
				common = common.substr(1);
				if (e.target.id) {
					var xpath = "//*[@id=\"" + e.target.id + "\"]";
					xpath = 'id("' + e.target.id + '")';
				} else {
					var data = new String(e.target.firstChild.data);
					var func = "text()";
					if (data.replace(/[ \n\t\r]+/g, " ").replace(/^ /, "").replace(/ $/, "") != data) {
						data = data.replace(/[ \n\t\r]+/g, " ").replace(/^ /, "").replace(/ $/, "");
						func = "normalize-space(" + func + ")";
					}
					if (data.replace(/"/, "'") != data) {
						data = data.replace(/"/, "'");
						func = "translate(" + func + ",'\"',\"'\")";
					}

					var xpath = "//" + e.target.nodeName.toLowerCase() + '[' + func + '="' + data + '"]';
				}
				for (var j = i; j < from.length; j++)
					xpath += "/..";
				for (i = i; i < to.length; i++)
					xpath += "/" + to[i];
			} else {
				var xpath = regionUtils._buildXPath(regionUtils._destelement, true);
			}
		} else {
			var xpath = null;
		}
		regionUtils._callback(xpath);
		regionUtils.abortSelect();
		return false;
	},

	_buildXPath: function (t, allowId) {
		var path = "";
		if (allowId && t.id != "" && t.id.indexOf('sitedelta') == -1) return 'id("' + t.id + '")';
		while (t.nodeName != "HTML") {
			var c = t.parentNode.firstChild;
			var num = 1;
			while (c != t) {
				if (c.nodeName == t.nodeName)
					num++;
				c = c.nextSibling;
			}
			path = "/" + t.nodeName.toLowerCase() + "[" + num + "]" + path;
			t = t.parentNode;
			if (allowId && t.id != "" && t.id.indexOf('sitedelta') == -1) return 'id("' + t.id + '")' + path;
		}
		path = "/" + t.nodeName.toLowerCase() + path;
		return path;
	},

	_outlined: [],
	_needText: false,
	_destelement: null,
	_callback: null,
	_doc: null
};