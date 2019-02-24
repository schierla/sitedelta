var highlightUtils = {

	highlightNext: function (doc, nr) {
		if (!doc.getElementById("sitedelta-change" + nr))
			nr = 0;
		var elem = doc.getElementById("sitedelta-change" + nr);
		elem.scrollIntoView(true);
		doc.defaultView.scrollBy(0, elem.getBoundingClientRect().top - (doc.defaultView.innerHeight / 2));
		var elems = doc.getElementsByClassName("sitedelta-change" + nr);
		highlightUtils._fade(elems);
		nr++;
		return nr;
	},

	highlightChanges: function (doc, config, oldContent) {
		if (config.stripStyles) highlightUtils._stripStyles(doc);
		if (config.isolateRegions) highlightUtils._isolateRegions(doc, config);
		if (config.makeVisible) highlightUtils.makeVisible(doc, config);
		
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


		var wpos = 0, npos = 0, opos = 0;
		var changes = 0, assignNumber = true;
		for (var i = 0; i < regions.length; i++) {

			var doc = regions[i].ownerDocument;

			var domactions = [], last = "", action = "", text = "";
			var filter = textUtils._filter(config, excludes);
			var tw = doc.createTreeWalker(regions[i], NodeFilter.SHOW_ALL, filter, true);
			if (filter.acceptNode(regions[i]) == NodeFilter.FILTER_REJECT) continue;
			for (var cur = regions[i]; cur != null; cur = tw.nextNode()) {
				if (cur.nodeType == 3 || (config.scanImages && cur.nodeName == 'IMG')) {
					if (cur.nodeName == 'IMG' && cur.hasAttribute("src")) 
						text = "[" + cur.getAttribute("src") + "]";
					else 
						text = cur.data.replace(/\[/g, "[ ");
					text = text.replace(/\s+/g, ' ').replace(/^ +/, '').replace(/ +$/, '').replace(/[\u0000-\u001f]/g, "");
					if(text == "") continue;
					var words = highlightUtils._split(text + " "), wpos = 0;
					var lastelem = null, replace = [], replaceRequired = false;

					while (true) {
						if (config.checkDeleted) {
							if (npos == diff.newWords.length && opos == diff.oldWords.length)
								action = ""; // end of document
							else if (opos == diff.oldWords.length)
								action = "I"; // end of old text - everything remaining has been inserted
							else if (npos == diff.newWords.length)
								action = "D"; // end of new text - everything remaining has been removed
							else if (diff.newToOld[npos] == null)
								action = "I"; // not found in old text - this has been inserted
							else if (diff.oldToNew[opos] == null)
								action = "D"; // not found in new text - this has been deleted
							else if (diff.oldToNew[opos] == npos)
								action = "K"; // unchanged - this has been kept
							else if (diff.oldToNew[opos] - npos < 0)
								action = "I"; // old text here has already appeared previously - show as insertion
							else if (diff.newToOld[npos] - opos < 0)
								action = "D"; // new text here should have been earlier - show as deletion
							else if (diff.oldToNew[opos] - npos <= diff.newToOld[npos] - opos)
								action = "I"; // insertion is shorter than deletion - start with insertion
							else
								action = "D"; // otherwise start with deletion
						} else {
							if (npos == diff.newWords.length)
								action = ""; // end of new text - we are done
							else if (diff.newToOld[npos] == null)
								action = "I"; // not found in old text - this has been inserted
							else
								action = "K"; // unchanged - this has been kept
						}

						if (wpos >= words.length && action != "D") break;

						if(action == "K") {
							if(lastelem == null || last != "K") {
								lastelem = doc.createTextNode("");
								replace.push(lastelem);
							}
							if(words.length == 2 && wpos == 0)
								replace.push(cur.cloneNode(true)); 
							else 
								lastelem.data += words[wpos];
							assignNumber = true;
						} else if(action == "D") {
							if(lastelem == null || last != "D") {
								var nr = assignNumber ? changes++ : changes - 1;
								var lastelem = doc.createElement("IMG");
								if(assignNumber) lastelem.id = "sitedelta-change" + nr;
								lastelem.className = "sitedelta-change" + nr;
								lastelem.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAK3RFWHRDcmVhdGlvbiBUaW1lAE1vIDI4IE1haSAyMDA3IDE5OjI5OjA2ICswMTAwKyfyCQAAAAd0SU1FB9cFHBElAZPQyFYAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAAA2ElEQVR42pXRMQsBYRzH8edYDDKgSFlI2aTcYmPwBm6x3OIFyNswGW0Wg2QxyeAFoCQlKZTEoJTJYOL7uOfquhBXn7vu//zu+T/PPUL8ez2ESKKM2JeMBq/9ssQcG5hy0BUOoI7G6yNuA1WsYYWgq/sQY2Tt4gktTNFDWC2hhB3aiDhbFlQXuaQLrip4xwwGEvDJvObcGI8UmsigizjSwupww9YOe1HFGUfojonkWBR5VJzL2qOv9tKB590vtosGFjAxQsia5/PB6JhgjQOKv5y4XwaR+5Z7AvWEaQDm0aTzAAAAAElFTkSuQmCC");
								lastelem.setAttribute("border", "0");
								lastelem.setAttribute("title", "");
								replace.push(lastelem);
							}
							lastelem.setAttribute("title", lastelem.getAttribute("title") + old2[opos]);
							replaceRequired = true;
							assignNumber = false;
						} else if(action == "I") {
							if(lastelem == null || last != "I") {
								var nr = assignNumber ? changes++ : changes - 1;
								var lastelem = doc.createElement("SITEDELTA_INS");
								if(assignNumber) lastelem.id = "sitedelta-change" + nr;
								lastelem.className = "sitedelta-change" + nr;
								lastelem.style.display = "inline"; 
								lastelem.style.outline = config.addBorder + " dotted 1px";
								lastelem.style.background = config.addBackground; 
								lastelem.style.color = "#000";
								lastelem.appendChild(doc.createTextNode(""));
								replace.push(lastelem);
							}
							if(words.length == 2 && wpos == 0) 
								lastelem.appendChild(cur.cloneNode(true));
							else
								lastelem.firstChild.data += words[wpos];

							replaceRequired = true;
							assignNumber = false;
						} else if(action == "") {
							break;
						}

						if (action == "K") {
							wpos++;
							opos++;
							npos++;
						} else if (action == "I") {
							wpos++
							npos++;
						} else if (action == "D") {
							opos++
						}
						last = action;
						
					}
					if (replaceRequired) {
						domactions.push({
							elem: cur,
							repl: replace
						});
					}
				}
			}
			for (var j = 0; j < domactions.length; j++) {
				var elem = domactions[j].elem, repl = domactions[j].repl, parent = elem.parentNode;
				parent.replaceChild(repl[repl.length - 1], elem);
				for(var k = repl.length - 2; k >= 0; k--) {
					parent.insertBefore(repl[k], repl[k+1]);
				}
			}
		}
		return changes;
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
				diff.newToOld[npos++] = null; // end of old text - everything else has been inserted
			} else if (npos == diff.newWords.length) {
				diff.oldToNew[opos++] = null; // end of new text - everything else has been deleted
			} else if (diff.newToOld[npos] == null) {
				npos++; // not found in old text - this has been inserted
			} else if (diff.oldToNew[opos] == null) {
				opos++; // not found in new text - this has been deleted
			} else if (diff.oldToNew[opos] == npos) {
				opos++; npos++; // unchanged - this has been kept
			} else if (diff.oldToNew[opos] - npos < 0) {
				diff.oldToNew[opos++] = null; // old text has appeared in new one earlier - mark as insertion
			} else if (diff.newToOld[npos] - opos < 0) {
				diff.newToOld[npos++] = null; // new text has appeared in old one earlier - mark as deletion
			} else {
				// moved text - check length to find out whether to prefer deletion or insertion here
				for (var i = 1; opos + i < diff.oldWords.length && npos + i < diff.newWords.length; i++) {
					// check length of old text at current position
					if (diff.oldToNew[opos + i] != diff.oldToNew[opos] + i) {
						for (var j = opos; j < opos + i; j++)
							diff.oldToNew[j] = null;
						opos = opos + i - 1; // if shorter, mark as deletion
						break; 
					}
					// check length of new text at current position
					if (diff.newToOld[npos + i] != diff.newToOld[npos] + i) {
						for (var j = npos; j < npos + i; j++)
							diff.newToOld[j] = null;
						npos = npos + i - 1;
						break; // if shorter, mark as insertion
					}
				}
			}
		}
	},

	_isolateRegions: function(doc, config) {
		var excludes = textUtils._findElements(doc, config.excludes);
		var includes = textUtils._findElements(doc, config.includes);
		for(var i=0; i<excludes.length; i++) {
			excludes[i].style.display = "none";
		}
		var parents = [];
		for(var i=0; i<includes.length; i++) 
			for(var e = includes[i].parentNode; e != doc; e = e.parentNode) parents.push(e);
		
		if(includes.indexOf(doc.body) == -1) 
			highlightUtils._isolateRegionsRecursively(doc.body, includes, parents);
	}, 

	_isolateRegionsRecursively: function(elem, includes, parents) {
		for(var e = elem.firstChild; e != null; e = e.nextSibling) {
			if(includes.indexOf(e) != -1) continue; 
			else if(parents.indexOf(e) == -1 && e.style) e.style.display = "none";
			else if(e.firstChild) highlightUtils._isolateRegionsRecursively(e, includes, parents);
		}
	},


	makeVisible: function(doc, config) {
		var excludes = textUtils._findElements(doc, config.excludes);
		var regions = textUtils._findElements(doc, config.includes);
		for(var i=0; i<regions.length; i++) {
			highlightUtils._makeVisible(regions[i]);
		}
	},

	_makeVisible: function(elem) {
		highlightUtils._makeParentsVisible(elem);
		highlightUtils._makeChildrenVisible(elem);
	},

	_makeElementVisible: function(elem) {
		if(elem.offsetHeight === 0 && elem.textContent !== "") {
			if(elem.nodeName && (elem.nodeName.toLowerCase()=="script" || elem.nodeName.toLowerCase()=="style")) return;
			elem.style.display="block";
			elem.style.height="auto";
			elem.style.opacity="1";
		}
		if(elem.style) elem.style.opacity="1";
	},

	_makeParentsVisible: function(elem) {
		if(elem.parentNode != null) highlightUtils._makeParentsVisible(elem.parentNode);
		highlightUtils._makeElementVisible(elem);
	},

	_makeChildrenVisible: function(elem) {
		highlightUtils._makeElementVisible(elem);
		var child = elem.firstChild;
		while(child) {
			var next = child.nextSibling;
			highlightUtils._makeChildrenVisible(child);
			child = next;
		}
	},

	_stripStyles: function (elem) {
		if (elem.nodeName.toLowerCase() == "style") {
			elem.parentNode.removeChild(elem);
		} else if (elem.nodeName.toLowerCase() == "link" && elem.getAttribute("rel") && elem.getAttribute("rel").toLowerCase() == "stylesheet") {
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