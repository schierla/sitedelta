
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

	selectRegionOverlay: function(overlay, idoc, callback) {
		regionUtils._doc = idoc;
		regionUtils._needText = false;
		regionUtils._destelement = null;
		regionUtils._callback = callback;
		regionUtils._overlay = overlay;

		while(overlay.firstChild) overlay.removeChild(overlay.firstChild);
		var overlaycontent = document.createElement("div");
		overlaycontent.style.position="absolute"; 
		overlaycontent.style.left = "0px"; 
		overlaycontent.style.top="0px";
		overlaycontent.style.width = idoc.body.scrollWidth + "px";
		overlaycontent.style.height = idoc.body.scrollHeight + "px";
		overlay.appendChild(overlaycontent);

		overlay.style.display = 'block';
		overlay.scrollTop = idoc.defaultView.scrollY; 
		overlay.scrollLeft = idoc.defaultView.scrollX;

		overlay.addEventListener("mousemove", regionUtils._overlaymousemove);
		overlay.addEventListener("mousedown", regionUtils._overlaymousedown);
		overlay.addEventListener("mouseup", regionUtils._overlaymouseup);
		overlay.addEventListener("scroll", regionUtils._overlayscroll);
		window.addEventListener("resize", regionUtils._overlayresize);
	},

	abortSelect: function () {
		if (regionUtils._destelement !== null)
			regionUtils._destelement.style.outline = "none";
		if (regionUtils._doc === null) return;

		if(regionUtils._overlay !== null) {
			overlay.style.display = 'none';

			regionUtils._overlay.removeEventListener("mousemove", regionUtils._overlaymousemove);
			regionUtils._overlay.removeEventListener("mousedown", regionUtils._overlaymousedown);
			regionUtils._overlay.removeEventListener("mouseup", regionUtils._overlaymouseup);
			regionUtils._overlay.removeEventListener("scroll", regionUtils._overlayscroll);
			window.removeEventListener("resize", regionUtils._overlayresize);
			regionUtils._overlay = null;
		} else {
			regionUtils._doc.removeEventListener("mouseover", regionUtils._mouseover, true);
			regionUtils._doc.removeEventListener("mousedown", regionUtils._mousedown, true);
			regionUtils._doc.removeEventListener("mouseup", regionUtils._mouseup, true);
			regionUtils._doc.removeEventListener("mouseout", regionUtils._mouseout, true);
		}

		regionUtils._needText = false;
		regionUtils._destelement = null;
		regionUtils._callback = null;
		regionUtils._doc = null;
	},

	_mouseover: function (e) {
		if(e.target.nodeName == 'IMG') e.target = e.target.parentNode;
		if (regionUtils.needText && !e.target.firstChild.data &&
			(!e.target.id || e.target.id.substr(0, 16) == "sitedelta-change"))
			return;
		e.target.style.outline = "red dotted 2px";
		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	_mouseout: function (e) {
		if(e.target.nodeName == 'IMG') e.target = e.target.parentNode;
		if (e.target && e.target != regionUtils._destelement)
			e.target.style.outline = "none";
		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	_mousedown: function (e) {
		if(e.target.nodeName == 'IMG') e.target = e.target.parentNode;
		regionUtils._needText = true;
		regionUtils._destelement = e.target;
		e.target.style.outline = "green solid 2px;";
		e.preventDefault();
		e.stopPropagation();
		return false;
	},

	_mouseup: function (e) {
		if(e.target.nodeName == 'IMG') e.target = e.target.parentNode;		
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

	_overlaymousemove: function(e) {
		var elem = regionUtils._doc.elementFromPoint(e.clientX - regionUtils._overlay.offsetLeft, e.clientY - regionUtils._overlay.offsetTop);
		if(elem == regionUtils._doc.firstChild) elem = null;
		if(regionUtils._overlayelem !== null && regionUtils._overlayelem != elem) {
			regionUtils._mouseout({target: regionUtils._overlayelem, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation()});
			regionUtils._overlayelem = null;
		}
		if(regionUtils._overlayelem != elem) {
			regionUtils._overlayelem = elem;
			regionUtils._mouseover({target: regionUtils._overlayelem, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation()});
		}
	},

	_overlaymousedown: function(e) {
		if(regionUtils._overlayelem !== null) {
			regionUtils._mousedown({target: regionUtils._overlayelem, button: e.button, ctrlKey: e.ctrlKey, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation()});
		}
	}, 
	
	_overlaymouseup: function(e) {
		if(regionUtils._overlayelem !== null) {
			regionUtils._mouseup({target: regionUtils._overlayelem, button: e.button, ctrlKey: e.ctrlKey, preventDefault: () => e.preventDefault(), stopPropagation: () => e.stopPropagation()});
		}
	},

	_overlayscroll: function(e) {
		regionUtils._doc.defaultView.scrollTo(regionUtils._overlay.scrollLeft, regionUtils._overlay.scrollTop);
	},

	_overlayresize: function(e) {
		regionUtils._overlay.firstChild.style.width = regionUtils._doc.body.scrollWidth + "px";
		regionUtils._overlay.firstChild.style.height = regionUtils._doc.body.scrollHeight + "px";
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
	_doc: null, 
	_overlay: null,
	_overlayelem: null
};