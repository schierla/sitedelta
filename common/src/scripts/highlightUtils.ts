import { Config } from "./config";
import * as textUtils from "./textUtils";

type Diff = { oldWords: string[], newWords: string[], newToOld: (number|null)[], oldToNew: (number|null)[]} ;

export function highlightNext(doc: Document, nr: number): number {
	var elem = doc.getElementById("sitedelta-change" + nr);
	if (!elem) {
		nr = 0;
		elem = doc.getElementById("sitedelta-change" + nr);
	}
	if(!elem) return 0;
	elem.scrollIntoView(true);	
	if(doc.defaultView) 
		doc.defaultView.scrollBy(0, elem.getBoundingClientRect().top - (doc.defaultView.innerHeight / 2));
	var elems = doc.getElementsByClassName("sitedelta-change" + nr);
	for(var i=0; i<elems.length; i++) 
		_fade(elems[i] as HTMLElement);
	nr++;
	return nr;
}

export function highlightChanges(doc: Document, config: Config, oldContent: string): number {
	if (config.stripStyles) stripStyles(doc);
	if (config.isolateRegions) isolateRegions(doc, config);
	if (config.makeVisible) makeVisible(doc, config);
	
	var current = textUtils.getText(doc, config);
	if(current == null) return -1;

	var excludes = textUtils.findElements(doc, config.excludes);
	var regions = textUtils.findElements(doc, config.includes);
	if (regions.length == 0) return -1;

	var oldt = split(textUtils.clean(oldContent, config)),
		newt = split(textUtils.clean(current, config)),
		old2 = split(oldContent);
	var diff = {
		oldWords: oldt,
		newWords: newt,
		newToOld: [],
		oldToNew: []
	};
	_diff(diff);
	if (config.checkDeleted) {
			_processDeleted(diff);
	}
	if (config.showRegions) {
		for(var exclude of excludes) (exclude as HTMLElement).style.outline = config.excludeRegion + " dotted 2px";
		for(var include of regions) (include as HTMLElement).style.outline = config.includeRegion + " dotted 2px";
	}

	var wpos = 0, npos = 0, opos = 0;
	var changes = 0, assignNumber = true;
	for (var i = 0; i < regions.length; i++) {

		var doc = regions[i].ownerDocument;

		var domactions: {elem: Node, repl: Node[]}[] = [];
		var last = "", action = "", text = "";
		if(excludes.indexOf(regions[i]) !== -1) continue;
		for (var cur of textUtils.walkTree(regions[i], config, excludes)) {
			if (cur.nodeType == 3 || (config.scanImages && cur.nodeName == 'IMG')) {
				if (cur.nodeName == 'IMG' && (cur as Element).hasAttribute("src")) 
					text = "[" + (cur as Element).getAttribute("src") + "]";
				else 
					text = (cur as CharacterData).data.replace(/\[/g, "[ ");
				text = text.replace(/\s+/g, ' ').replace(/^ +/, '').replace(/ +$/, '').replace(/[\u0000-\u001f]/g, "");
				if(text == "") continue;
				var words = split(text + " "), wpos = 0;
				var lastk: Text | null = null, lastd: HTMLElement | null = null, lasti: HTMLElement | null = null;
				var replace: Node[] = [], replaceRequired = false;

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
						if(lastk == null || last != "K") {
							lastk = doc.createTextNode("");
							replace.push(lastk);
						}
						if(words.length == 2 && wpos == 0)
							replace.push(cur.cloneNode(true)); 
						else 
							lastk.data += words[wpos];
						assignNumber = true;
					} else if(action == "D") {
						if(lastd == null || last != "D") {
							var nr = assignNumber ? changes++ : changes - 1;
							lastd = doc.createElement("IMG");
							if(assignNumber) lastd.id = "sitedelta-change" + nr;
							lastd.className = "sitedelta-change" + nr;
							lastd.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAK3RFWHRDcmVhdGlvbiBUaW1lAE1vIDI4IE1haSAyMDA3IDE5OjI5OjA2ICswMTAwKyfyCQAAAAd0SU1FB9cFHBElAZPQyFYAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAAA2ElEQVR42pXRMQsBYRzH8edYDDKgSFlI2aTcYmPwBm6x3OIFyNswGW0Wg2QxyeAFoCQlKZTEoJTJYOL7uOfquhBXn7vu//zu+T/PPUL8ez2ESKKM2JeMBq/9ssQcG5hy0BUOoI7G6yNuA1WsYYWgq/sQY2Tt4gktTNFDWC2hhB3aiDhbFlQXuaQLrip4xwwGEvDJvObcGI8UmsigizjSwupww9YOe1HFGUfojonkWBR5VJzL2qOv9tKB590vtosGFjAxQsia5/PB6JhgjQOKv5y4XwaR+5Z7AvWEaQDm0aTzAAAAAElFTkSuQmCC");
							lastd.setAttribute("border", "0");
							lastd.setAttribute("title", "");
							replace.push(lastd);
						}
						lastd.setAttribute("title", lastd.getAttribute("title") + old2[opos]);
						replaceRequired = true;
						assignNumber = false;
					} else if(action == "I") {
						if(lasti == null || last != "I") {
							var nr = assignNumber ? changes++ : changes - 1;
							lasti = doc.createElement("SITEDELTA_INS");
							if(assignNumber) lasti.id = "sitedelta-change" + nr;
							lasti.className = "sitedelta-change" + nr;
							lasti.style.display = "inline"; 
							lasti.style.outline = config.addBorder + " dotted 1px";
							lasti.style.background = config.addBackground; 
							lasti.style.color = "#000";
							lasti.appendChild(doc.createTextNode(""));
							replace.push(lasti);
						}
						if(words.length == 2 && wpos == 0) 
							lasti.appendChild(cur.cloneNode(true));
						else
							(lasti.firstChild as Text).data += words[wpos];

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
			if(!parent) continue;
			parent.replaceChild(repl[repl.length - 1], elem);
			for(var k = repl.length - 2; k >= 0; k--) {
				parent.insertBefore(repl[k], repl[k+1]);
			}
		}
	}
	return changes;
}

export function split(text: string): string[] {
	var spaceRegex = /[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+| +|[^ \[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+|\[ |\[[^ ]+?\]/g;
	if (!text || text == "") return [];
	return text.match(spaceRegex) || [];
}

function _diff(text: Diff, newStart?: number, newEnd?: number, oldStart?: number, oldEnd?: number, recursionLevel?: number): void {
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
		var nto = text.newToOld[i];
		if (nto != null) {
			if ((text.newToOld[i + 1] == null) && (text.oldToNew[nto + 1] == null)) {
				if (text.newWords[i + 1] == text.oldWords[nto + 1]) {
					text.newToOld[i + 1] = nto + 1;
					text.oldToNew[nto + 1] = i + 1;
				}
			}
		}
	}
	//
	for (var i = newEnd - 1; i > newStart; i--) {
		var nto = text.newToOld[i];
		if (nto != null) {
			if ((text.newToOld[i - 1] == null) && (text.oldToNew[nto - 1] == null)) {
				if (text.newWords[i - 1] == text.oldWords[nto - 1]) {
					text.newToOld[i - 1] = nto - 1;
					text.oldToNew[nto - 1] = i - 1;
				}
			}
		}
	}
	//	
	i = newStart;
	j = oldStart;
	while (i < newEnd) {
		var nto = text.newToOld[i - 1];
		if (nto != null) {
			j = nto + 1;
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
						_diff(text, iStart, iEnd, jStart, jEnd, recursionLevel + 1);
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
		var nto = text.newToOld[i + 1];
		if (nto != null) {
			j = nto - 1;
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
						_diff(text, iStart, iEnd, jStart, jEnd, recursionLevel + 1);
					}
				}
			}
			i = iStart - 1;
		} else {
			i--;
		}
	}
	return;
}

function _processDeleted(diff: Diff): void {
	for (var opos = 0, npos = 0; opos <= diff.oldWords.length && npos <= diff.newWords.length;) {
		var otn = diff.oldToNew[opos], nto = diff.newToOld[npos];
		if (opos == diff.oldWords.length) {
			diff.newToOld[npos++] = null; // end of old text - everything else has been inserted
		} else if (npos == diff.newWords.length) {
			diff.oldToNew[opos++] = null; // end of new text - everything else has been deleted
		} else if (nto == null) {
			npos++; // not found in old text - this has been inserted
		} else if (otn == null) {
			opos++; // not found in new text - this has been deleted
		} else if (otn == npos) {
			opos++; npos++; // unchanged - this has been kept
		} else if (otn - npos < 0) {
			diff.oldToNew[opos++] = null; // old text has appeared in new one earlier - mark as insertion
		} else if (nto - opos < 0) {
			diff.newToOld[npos++] = null; // new text has appeared in old one earlier - mark as deletion
		} else {
			// moved text - check length to find out whether to prefer deletion or insertion here
			for (var i = 1; opos + i < diff.oldWords.length && npos + i < diff.newWords.length; i++) {
				// check length of old text at current position
				if (diff.oldToNew[opos + i] != otn + i) {
					for (var j = opos; j < opos + i; j++)
						diff.oldToNew[j] = null;
					opos = opos + i - 1; // if shorter, mark as deletion
					break; 
				}
				// check length of new text at current position
				if (diff.newToOld[npos + i] != nto + i) {
					for (var j = npos; j < npos + i; j++)
						diff.newToOld[j] = null;
					npos = npos + i - 1;
					break; // if shorter, mark as insertion
				}
			}
		}
	}
}

export function isolateRegions(doc: Document, config: Config): void {
	var excludes = textUtils.findElements(doc, config.excludes);
	var includes = textUtils.findElements(doc, config.includes);
	for(var exclude of excludes) 
		(exclude as HTMLElement).style.display = "none";
	
	var parents: Node[] = [];
	for(var include of includes) 
		for(var e = include.parentNode; e && e != doc; e = e.parentNode) 
			parents.push(e);
	
	if(includes.indexOf(doc.body) == -1) 
		_isolateRegionsRecursively(doc.body, includes, parents);
}

function _isolateRegionsRecursively(elem: Node, includes: Node[], parents: Node[]): void {
	for(var e: Node | null = elem.firstChild; e != null; e = e.nextSibling) {
		if(includes.indexOf(e) != -1) 
			continue; 
		else if(parents.indexOf(e) == -1 && "style" in (e as HTMLElement)) 
			(e as HTMLElement).style.display = "none";
		else if(e.firstChild) 
			_isolateRegionsRecursively(e, includes, parents);
	}
}


export function makeVisible(doc: Document, config: Config): void {
	var excludes = textUtils.findElements(doc, config.excludes);
	var regions = textUtils.findElements(doc, config.includes);
	for(var i=0; i<regions.length; i++) {
		_makeVisible(regions[i]);
	}
}

function _makeVisible(elem: Node): void {
	_makeParentsVisible(elem);
	_makeChildrenVisible(elem);
}

function _makeElementVisible(elem: Node): void {
	var e = elem as HTMLElement;
	if(e.offsetHeight === 0 && elem.textContent !== "") {
		if(e.nodeName && (e.nodeName.toLowerCase()=="script" || e.nodeName.toLowerCase()=="style")) return;
		e.style.display="block";
		e.style.height="auto";
		e.style.opacity="1";
	}
	if(e.style) e.style.opacity="1";
}

function _makeParentsVisible(elem: Node): void {
	if(elem.parentNode != null) 
		_makeParentsVisible(elem.parentNode);
	_makeElementVisible(elem);
}

function _makeChildrenVisible(elem: Node): void {
	_makeElementVisible(elem);
	var child = elem.firstChild;
	while(child) {
		var next = child.nextSibling;
		_makeChildrenVisible(child);
		child = next;
	}
}

export function stripStyles(elem: Node): void {
	if (elem.parentNode && elem.nodeName.toLowerCase() == "style") {
		elem.parentNode.removeChild(elem);
	} else if (elem.parentNode && elem.nodeName.toLowerCase() == "link") {
		var rel = (elem as Element).getAttribute("rel");
		if(rel && rel.toLowerCase() == "stylesheet") elem.parentNode.removeChild(elem);
	} else {
		if("removeAttribute" in elem) 
			(elem as Element).removeAttribute("style");
		var child = elem.firstChild;
		while (child) {
			var next = child.nextSibling;
			stripStyles(child);
			child = next;
		}
	}
}

function _fade(elem: HTMLElement): void {
	elem.style.transition = "box-shadow 0s ease 0s";
	elem.style.boxShadow = "0 0 25px 50px rgba(100,100,100,0.5)";
	setTimeout(() => {
		elem.style.transition = "box-shadow 0.5s ease 0s";
		elem.style.boxShadow = "0 0 0 0 rgba(200,200,200,0.5)";
	}, 50);
}

var _currentChange: number | null;
