var highlightUtils = {

	highlightNext: function (doc, nr) {
		if (!doc.getElementById("sitedelta-change" + nr))
			nr = 0;
		var elem = doc.getElementById("sitedelta-change" + nr);
		elem.scrollIntoView(true);
		window.scrollBy(0, elem.getBoundingClientRect().top - (window.innerHeight / 2));
		var elems = doc.getElementsByClassName("sitedelta-change" + nr);
		highlightUtils._fade(elems);
		nr++;
		return nr;
	},

	highlightChanges: function (doc, config, oldContent) {
		if (config.stripStyles) highlightUtils._stripStyles(doc);
		var current = textUtils.getText(doc, config);

		var excludes = textUtils._findElements(doc, config.excludes);
		var regions = textUtils._findElements(doc, config.includes);
		if (regions.length == 0) return -1;

		var oldt = highlightUtils._split(textUtils.clean(oldContent, config)),
			newt = highlightUtils._split(textUtils.clean(current, config)),
			old2 = highlightUtils._split(oldContent);
		var diff = {
			oldWords: oldt,
			newWords: newt,
			newToOld: [],
			oldToNew: []
		};
		highlightUtils._diff(diff);
		if (config.checkDeleted) highlightUtils._processDeleted(diff);
		if (config.showRegions) excludes.forEach(function (v, i, a) { v.style.outline = config.excludeRegion + " dotted 2px"; });
		if (config.showRegions) regions.forEach(function (v, i, a) { v.style.outline = config.includeRegion + " dotted 2px"; });


		var pos = 0, wpos = 0, npos = 0, opos = 0;
		var changes = 0;
		var ret = "";
		for (var i = 0; i < regions.length; i++) {

			var ot = "",
				nt = "",
				wc = 0;
			var doc = regions[i].ownerDocument;

			var domactions = [], last = "", action = "", text = "";
			var count = true;
			var tw = doc.createTreeWalker(regions[i], NodeFilter.SHOW_ALL, textUtils._filter(config, excludes), true), cur = null;
			while ((cur = tw.nextNode()) != null) {
				var drop = [];
				while (cur) {
					if (cur.nodeType == 3 || (config.scanImages && cur.nodeName == 'IMG')) {
						if (cur.nodeName == 'IMG' && cur.hasAttribute("src"))
							text = "[" + cur.getAttribute("src") + "] ";
						else text = cur.data.replace(/\[/, "[ ") + " ";
						text = text.replace(/\s+/g, ' ').replace(/^ +/, '').replace(/ +$/, ' ');
						if (text != "" && text != " ")
							ret += text;
						if (newt[npos] && ret.length >= newt[npos].length)
							break;
						drop.push(cur);
					}
					cur = tw.nextNode();
				}
				text = ret;
				ret = "";
				var words = highlightUtils._split(text),
					txt = "",
					replace = null,
					wpos = 0;
				wc += words.length;
				while (true) {
					if (config.checkDeleted) {
						if (npos == diff.newWords.length && opos == diff.oldWords.length)
							action = "";
						else if (opos == diff.oldWords.length)
							action = "I";
						else if (npos == diff.newWords.length)
							action = "D";
						else if (diff.newToOld[npos] == null)
							action = "I";
						else if (diff.oldToNew[opos] == null)
							action = "D";
						else if (diff.oldToNew[opos] == npos)
							action = "K";
						else if (diff.oldToNew[opos] - npos < 0)
							action = "I";
						else if (diff.newToOld[npos] - opos < 0)
							action = "D";
						else if (diff.oldToNew[opos] - npos <= diff.newToOld[npos] - opos)
							action = "I";
						else
							action = "D";
					} else {
						if (npos == diff.newWords.length)
							action = "";
						else if (diff.newToOld[npos] == null)
							action = "I";
						else
							action = "K";
					}

					if ((last != action && txt != "") ||
						((replace != null || last != "K") && wpos >= words.length && action != "D") ||
						((replace != null || last != "K") && wpos < words.length && npos < newt.length && textUtils.clean(words[wpos], config).length < newt[npos].length)) {
						if (replace == null)
							replace = doc.createElement("SITEDELTA_SPAN");
						if (last == "K") {
							replace.appendChild(highlightUtils._DOMChanged(doc, txt, (1 - changes), last, config));
							if (txt.match(/\[[^ ]+\] /))
								replace = null;
						} else if (last == "D" || last == "m") {
							if (txt.replace(/\s+/, "") != "") {
								replace.appendChild(highlightUtils._DOMChanged(doc, txt, (count ? (++changes - 1) : (1 - changes)), last, config));
							}
						} else if (last == "I" || last == "M") {
							replace.appendChild(highlightUtils._DOMChanged(doc, txt, (count ? (++changes - 1) : (1 - changes)), last, config));
						}
						if (last == "K") count = true; else count = false;
						txt = "";
					}
					if (wpos >= words.length && action != "D" && action != "m") break;
					if (wpos < words.length && (npos >= newt.length || textUtils.clean(words[wpos], config).length < newt[npos].length)) {
						ret = words[wpos];
						break;
					}
					last = action;
					if (action == "K") {
						txt += words[wpos++];
						pos++;
						opos++;
						npos++;
					} else if (action == "I" || action == "M") {
						txt += words[wpos++];
						pos++;
						npos++;
					} else if (action == "D" || action == "m") {
						txt += old2[opos++];
						pos++;
					}
				}
				if (replace != null && cur != null) {
					domactions.push({
						elem: cur,
						repl: replace,
						drop: drop
					});
				}
			}
			for (var ii = 0; ii < domactions.length; ii++) {
				for (var j = 0; j < domactions[ii].drop.length; j++)
					domactions[ii].drop[j].parentNode.removeChild(domactions[ii].drop[j]);
				domactions[ii].elem.parentNode.replaceChild(domactions[ii].repl, domactions[ii].elem);
			}
		}
		return changes;
	},

	_DOMChanged: function (doc, text, nr, type, config) {
		if (type == "D" || type == "m") {
			if (text == "") 
				return doc.createElement("SITEDELTA_SPAN");
			var del = doc.createElement("IMG");
			if (type == "D") {
				del.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAK3RFWHRDcmVhdGlvbiBUaW1lAE1vIDI4IE1haSAyMDA3IDE5OjI5OjA2ICswMTAwKyfyCQAAAAd0SU1FB9cFHBElAZPQyFYAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAAA2ElEQVR42pXRMQsBYRzH8edYDDKgSFlI2aTcYmPwBm6x3OIFyNswGW0Wg2QxyeAFoCQlKZTEoJTJYOL7uOfquhBXn7vu//zu+T/PPUL8ez2ESKKM2JeMBq/9ssQcG5hy0BUOoI7G6yNuA1WsYYWgq/sQY2Tt4gktTNFDWC2hhB3aiDhbFlQXuaQLrip4xwwGEvDJvObcGI8UmsigizjSwupww9YOe1HFGUfojonkWBR5VJzL2qOv9tKB590vtosGFjAxQsia5/PB6JhgjQOKv5y4XwaR+5Z7AvWEaQDm0aTzAAAAAElFTkSuQmCC");
			} else {
				del.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAK3RFWHRDcmVhdGlvbiBUaW1lAE1vIDI4IE1haSAyMDA3IDE5OjI5OjA2ICswMTAwKyfyCQAAAAd0SU1FB9cGAw4dMfo2nVUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAABMUlEQVR42pWRzStEURjGf/eO0BBNEk3ZkJqdna0sKCsLJfkoe1sbWfEXWJClyIaVUmKoWVlRKFbGxtYGJRkf43fvTAaNhff2nPPc93nOed9zDvw79ujigDGypP/0FAnYJhHRQPOl46u8USwywKb/xW8bNhEyb66WB2ZDyS1v9CmtaJtzg9SP6gn3DtVDNhjlPdTUY3LJeVxcUSCMWzhg0HxWdsczw1Y+i/aIxEnRrpAS/dRxrS2vtuv/vdhxYQM56ktnqETAId0uXo2rBmzxQYdzRrSpP4l8TWyNbqCZGY3z4tW6Q7Zw8qW1+r3QKcuUKuzbSsCa7Fyk5TccM8GCNX5FWB5HHC883JQVjuQtmotUiZpy9+vKyyTjNpLy6fi5qkTl0DkfrkCvmUcv9PSvR/8EAddN/cjvW0QAAAAASUVORK5CYII=");
			}
			del.setAttribute("border", "0");
			del.setAttribute("title", text);
			if (nr > -1) del.id = "sitedelta-change" + nr;
			del.className = "sitedelta-change" + Math.abs(nr);
			return del;
		} else if (type == "I" || type == "M") {
			var ins = doc.createElement("SITEDELTA_INS");
			if (type == "I")
				ins.setAttribute("style", "display: inline; outline: " + config.addBorder + " dotted 1px; background: " + config.addBackground + "; color: #000;");
			else
				ins.setAttribute("style", "display: inline; outline: " + config.moveBorder + " dotted 1px; background: " + config.moveBackground + "; color: #000;");

			if (nr > -1) ins.id = "sitedelta-change" + nr;
			ins.className = "sitedelta-change" + Math.abs(nr);

			while (text.indexOf("[") != - 1) {
				ins.appendChild(doc.createTextNode(text.substring(0, text.indexOf("["))));
				text = text.substr(text.indexOf("[") + 1);
				if (text.charAt(0) == " ") {
					ins.appendChild(doc.createTextNode("["));
				} else {
					var img = doc.createElement("IMG");
					img.setAttribute("src", text.substring(0, text.indexOf("]")));
					img.setAttribute("border", 0);
					ins.appendChild(img);
					text = text.substr(text.indexOf("]") + 1);
				}
			}
			if (text != "")
				ins.appendChild(doc.createTextNode(text));
			return ins;
		} else {
			var elem = doc.createElement("SITEDELTA_SPAN");
			elem.appendChild(document.createTextNode(text));
			return elem;
		}
	},

	_split: function (text) {
		var spaceRegex = /[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+| +|[^ \[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+|\[ |\[[^ ]+?\]/g;
		if (!text || text == "") return [];
		return text.match(spaceRegex);
	},

	_diff: function (text, newStart, newEnd, oldStart, oldEnd, recursionLevel) {
		// diff, based on http://doi.acm.org/10.1145/359460.359467
		// and http://en.wikipedia.org/wiki/User:Cacycle/diff.js
		var symbol = {
			newCtr: [],
			oldCtr: [],
			toNew: [],
			toOld: []
		};
		newStart = newStart || 0;
		newEnd = newEnd || text.newWords.length;
		oldStart = oldStart || 0;
		oldEnd = oldEnd || text.oldWords.length;
		recursionLevel = recursionLevel || 0;
		if (recursionLevel > 10) {
			return;
		}
		//
		for (var i = newStart; i < newEnd; i++) {
			var word = text.newWords[i];
			if (symbol[word] == null)
				symbol[word] = {
					newCtr: 0,
					oldCtr: 0,
					toNew: null,
					toOld: null
				};
			symbol[word].newCtr++;
			symbol[word].toNew = i;
			if (i < newEnd - 2) {
				var word = text.newWords[i] + text.newWords[i + 1] + text.newWords[i + 2];
				if (symbol[word] == null)
					symbol[word] = {
						newCtr: 0,
						oldCtr: 0,
						toNew: null,
						toOld: null
					};
				symbol[word].newCtr++;
				symbol[word].toNew = i;
			}
		}
		//
		for (var j = oldStart; j < oldEnd; j++) {
			var word = text.oldWords[j];
			if (symbol[word] == null)
				symbol[word] = {
					newCtr: 0,
					oldCtr: 0,
					toNew: null,
					toOld: null
				};
			symbol[word].oldCtr++;
			symbol[word].toOld = j;
			if (j < oldEnd - 2) {
				var word = text.oldWords[j] + text.oldWords[j + 1] + text.oldWords[j + 2];
				if (symbol[word] == null)
					symbol[word] = {
						newCtr: 0,
						oldCtr: 0,
						toNew: null,
						toOld: null
					};
				symbol[word].oldCtr++;
				symbol[word].toOld = j;
			}
		}
		//
		for (var s in symbol) {
			if (("newCtr" in symbol[s]) && (symbol[s].newCtr == 1) && (symbol[s].oldCtr == 1) && !/\s+/.test(text.newWords[symbol[s].toNew])) {
				text.newToOld[symbol[s].toNew] = symbol[s].toOld;
				text.oldToNew[symbol[s].toOld] = symbol[s].toNew;
			}
		}
		//
		if (text.newWords[newStart] == text.oldWords[oldStart]) {
			text.newToOld[newStart] = oldStart;
			text.oldToNew[oldStart] = newStart;
		}
		for (var i = newStart; i < newEnd - 1; i++) {
			if ((j = text.newToOld[i]) != null) {
				if ((text.newToOld[i + 1] == null) && (text.oldToNew[j + 1] == null)) {
					if (text.newWords[i + 1] == text.oldWords[j + 1]) {
						text.newToOld[i + 1] = j + 1;
						text.oldToNew[j + 1] = i + 1;
					}
				}
			}
		}
		//
		for (var i = newEnd - 1; i > newStart; i--) {
			if ((j = text.newToOld[i]) != null) {
				if ((text.newToOld[i - 1] == null) && (text.oldToNew[j - 1] == null)) {
					if (text.newWords[i - 1] == text.oldWords[j - 1]) {
						text.newToOld[i - 1] = j - 1;
						text.oldToNew[j - 1] = i - 1;
					}
				}
			}
		}
		//	
		i = newStart;
		j = oldStart;
		while (i < newEnd) {
			if (text.newToOld[i - 1] != null) {
				j = text.newToOld[i - 1] + 1;
			}
			if ((text.newToOld[i] == null) && (text.oldToNew[j] == null)) {
				var iStart = i;
				var iEnd = i;
				while ((text.newToOld[iEnd] == null) && (iEnd < newEnd)) {
					iEnd++;
				}
				var iLength = iEnd - iStart;
				var jStart = j;
				var jEnd = j;
				while ((text.oldToNew[jEnd] == null) && (jEnd < oldEnd)) {
					jEnd++;
				}
				var jLength = jEnd - jStart;
				if ((iLength > 0) && (jLength > 0)) {
					if ((iLength > 1) || (jLength > 1)) {
						if ((iStart != newStart) || (iEnd != newEnd) || (jStart != oldStart) || (jEnd != oldEnd)) {
							highlightUtils._diff(text, iStart, iEnd, jStart, jEnd, recursionLevel + 1);
						}
					}
				}
				i = iEnd;
			} else {
				i++;
			}
		}
		//
		i = newEnd - 1;
		j = oldEnd - 1;
		while (i >= newStart) {
			if (text.newToOld[i + 1] != null) {
				j = text.newToOld[i + 1] - 1;
			}
			if ((text.newToOld[i] == null) && (text.oldToNew[j] == null)) {
				var iStart = i;
				var iEnd = i;
				while ((text.newToOld[iStart] == null) && (iStart >= newStart)) {
					iStart--;
				}
				var iLength = iEnd - iStart;
				var jStart = j;
				var jEnd = j;
				while ((text.oldToNew[jStart] == null) && (jStart >= oldStart)) {
					jStart--;
				}
				var jLength = jEnd - jStart;
				if ((iLength > 0) && (jLength > 0)) {
					if ((iLength > 1) || (jLength > 1)) {
						if ((iStart != newStart) || (iEnd != newEnd) || (jStart != oldStart) || (jEnd != oldEnd)) {
							highlightUtils._diff(text, iStart, iEnd, jStart, jEnd, recursionLevel + 1);
						}
					}
				}
				i = iStart - 1;
			} else {
				i--;
			}
		}
		return;
	},

	_processDeleted: function (diff) {
		for (var opos = 0, npos = 0; opos <= diff.oldWords.length && npos <= diff.newWords.length;) {
			if (opos == diff.oldWords.length) {
				diff.newToOld[npos++] = null;
			} else if (npos == diff.newWords.length) {
				diff.oldToNew[opos++] = null;
			} else if (diff.newToOld[npos] == null) {
				npos++;
			} else if (diff.oldToNew[opos] == null) {
				opos++;
			} else if (diff.oldToNew[opos] == npos) {
				opos++; npos++;
			} else if (diff.oldToNew[opos] - npos < 0) {
				diff.oldToNew[opos++] = null;
			} else if (diff.newToOld[npos] - opos < 0) {
				diff.newToOld[npos++] = null;
			} else {
				for (var i = 1; opos + i < diff.oldWords.length && npos + i < diff.newWords.length; i++) {
					if (diff.oldToNew[opos + i] != diff.oldToNew[opos] + i) {
						for (var j = opos; j < opos + i; j++)
							diff.oldToNew[j] = null;
						opos = opos + i - 1;
						break;
					}
					if (diff.newToOld[npos + i] != diff.newToOld[npos] + i) {
						for (var j = npos; j < npos + i; j++)
							diff.newToOld[j] = null;
						npos = npos + i - 1;
						break;
					}
				}
			}
		}
	},

	_stripStyles: function (elem) {
		if (elem.nodeName.toLowerCase() == "style") {
			elem.parentNode.removeChild(elem);
		} else if (elem.nodeName.toLowerCase() == "link" && elem.getAttribute("rel").toLowerCase() == "stylesheet") {
			elem.parentNode.removeChild(elem);
		} else {
			if (elem instanceof HTMLElement) elem.removeAttribute("style");
			var child = elem.firstChild;
			while (child) {
				var next = child.nextSibling;
				highlightUtils._stripStyles(child);
				child = next;
			}
		}
	},

	_fade: function (elem) {
		for (var i = 0; i < elem.length; i++) {
			elem[i].style.transition = "box-shadow 0s ease 0s";
			elem[i].style.boxShadow = "0 0 25px 50px rgba(100,100,100,0.5)";
		}
		setTimeout(() => {
			for (var i = 0; i < elem.length; i++) {
				elem[i].style.transition = "-webkit-box-shadow 0.5s ease 0s";
				elem[i].style.WebkitBoxShadow = "0 0 0 0 rgba(200,200,200,0.5)";
			}
		}, 50);
	},

	_blink: function (elem) {
		if (highlightUtils._blinkId != null)
			clearTimeout(highlightUtils._blinkId);
		highlightUtils._blinkCount = 0;
		highlightUtils._blinkId = setInterval(function (elem) {
			for (var i = 0; i < elem.length; i++)
				elem[i].style.opacity = 1 - (highlightUtils._blinkCount % 2) / 2;
			highlightUtils._blinkCount++;
			if (highlightUtils._blinkCount == 11) {
				clearTimeout(highlightUtils._blinkId);
				highlightUtils._blinkId = null;
			}
		}, 250, elem);
	},
	_blinkId: null,
	_blinkCount: 0,
	_currentChange: null
};