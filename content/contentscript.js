if(!("highlightChanges" in window)) {
	window.highlighted = false;
}

var STATE = {
	LOADED: 1, 
	HIGHLIGHTED: 2,
	SELECTREGION: 3
};

function messageHandler(request, sender, sendResponse) {
	if(request.command == "getStatus") {
		if(window.highlighted) 
			sendResponse({state: STATE.HIGHLIGHTED, changes: window.numChanges, current: window.currentChange});
		else if(regions.callback != null)
			sendResponse({state: STATE.SELECTREGION});
		else 
			sendResponse({state: STATE.LOADED});
	} else if(request.command == "getContent") {
		if(!window.highlighted) {
			window.content = getText(request.config);
		}
		sendResponse(window.content);
    } else if(request.command == "highlightChanges") {
		if(window.highlighted) {
			if(window.numChanges > 0) nextChange();
			sendResponse({state: STATE.HIGHLIGHTED, changes: window.numChanges, current: window.currentChange});
		} else {	
			var changes = highlightChanges(request.config, request.content);
			window.highlighted = true;
			window.numChanges = changes;
			window.currentChange = 0;
			if(window.numChanges > 0) nextChange();
			sendResponse({state: STATE.HIGHLIGHTED, changes: window.numChanges, current: window.currentChange});
		}
	} else if(request.command == "selectRegion") {
		selectRegion(function(xpath) {
			sendResponse(xpath);
		});
		return true;
	} else if(request.command == "showOutline") {
		regions.showOutline(request.xpath, request.color);
	} else if(request.command == "removeOutline") {
		regions.removeOutline();
	}
}

chrome.runtime.onMessage.addListener(messageHandler);

function nextChange() {
	if(!document.getElementById("sitedelta-change"+window.currentChange))
		window.currentChange=0;
	var elem = document.getElementById("sitedelta-change"+window.currentChange);
	elem.scrollIntoView(true);
	window.scrollBy(0, elem.getBoundingClientRect().top - (window.innerHeight/2));
	var elems = document.getElementsByClassName("sitedelta-change" + window.currentChange);
	for(var i=0; i<elems.length; i++) {
		var elem = elems[i];
		setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 0.5), 10);
		setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 1), 200);
		setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 0.5), 400);
		setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 1), 600);
	}
	window.currentChange++;	 
}

var regions = {
	mouseover: function(e) {
		if(regions.needText && !e.target.firstChild.data && 
				(!e.target.id || e.target.id.substr(0,16)=="sitedelta-change")) 
			return;
		e.target.style.outline="red dotted 2px";
		e.preventDefault();
		e.stopPropagation();
	},
	mouseout: function(e) {
		if(e.target && e.target != regions.destelement) 
			e.target.style.outline="none";
		e.preventDefault();
		e.stopPropagation();
	},
	mousedown: function(e) {
		regions.needText = true;
		regions.destelement = e.target;
		e.target.style.outline = "green solid 2px;";
		e.preventDefault();
		e.stopPropagation();
	},
	mouseup: function(e) {
		e.preventDefault();
		e.stopPropagation();
		regions.mouseout(e);
		if(regions.destelement != null)
			regions.destelement.style.outline="none";

		document.removeEventListener("mouseover", regions.mouseover, true);
		document.removeEventListener("mousedown", regions.mousedown, true);
		document.removeEventListener("mouseup",   regions.mouseup,   true);
		document.removeEventListener("mouseout",  regions.mouseout,  true);

		if(e.button == 0 && !e.ctrlKey) {
			regions.needText = false;
			if (e.target != regions.destelement && (e.target.firstChild.data || e.target.id)) {
				var to = regions.buildXPath(regions.destelement, false).split("/");
				var from = regions.buildXPath(e.target, false).split("/");
				var common = "";
				for(var i = 0; i < Math.min(to.length, from.length); i++) {
					common+="/"+to[i]; 
					if (to[i] != from[i]) break; 
				}  
				common = common.substr(1);   
				if(e.target.id) {
					var xpath="//*[@id=\""+ e.target.id +"\"]";
					xpath = 'id("' + e.target.id + '")';
				} else {
					var data = new String(e.target.firstChild.data); 
					var func = "text()";
					if (data.replace(/[ \n\t\r]+/g," ").replace(/^ /,"").replace(/ $/,"") != data) {
						data = data.replace(/[ \n\t\r]+/g," ").replace(/^ /,"").replace(/ $/,""); 
						func="normalize-space("+func+")";
					}
					if (data.replace(/"/,"'") != data) {
						data = data.replace(/"/,"'"); 
						func = "translate(" + func + ",'\"',\"'\")";
					}
						
					var xpath = "//" + e.target.nodeName.toLowerCase() + '[' + func + '="' + data +'"]';
				}
				for(var j = i; j < from.length; j++) 
					xpath += "/..";
				for(i = i; i < to.length; i++) 
					xpath += "/" + to[i];
			} else {
				var xpath = regions.buildXPath(regions.destelement, true);
			}
		} else {
			var xpath = null;
		}
		regions.needText = false;
		regions.destelement = null;
		regions.callback(xpath);
		regions.callback = null;
	},
	buildXPath: function(t, allowId) {
        var path = "";
        if(allowId && t.id != "" && t.id.indexOf('sitedelta')==-1) return 'id("' + t.id + '")';
        while (t.nodeName != "HTML") {
            c = t.parentNode.firstChild;
            num = 1;
            while (c != t) {
                if (c.nodeName == t.nodeName)
                    num ++ ;
                c = c.nextSibling;
            }
            path = "/" + t.nodeName.toLowerCase() + "[" + num + "]" + path;
            t = t.parentNode;
            if(allowId && t.id != "" && t.id.indexOf('sitedelta')==-1) return 'id("' + t.id + '")' + path;
        }
        path = "/" + t.nodeName.toLowerCase() + path;
        return path;
    },
	showOutline: function(xpath, color) {
		if(regions.outlinedElement) 
			regions.removeOutline();
		var element = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null).iterateNext();
		if (!element) 
			return;
		regions.outlinedElement = element; 
		regions.outlinedElementStyle = element.style.outline;
		element.style.outline = color + " dotted 2px";
	},
	removeOutline: function() {
		if(regions.outlinedElement) 
			regions.outlinedElement.style.outline = regions.outlinedElementStyle;
		regions.outlinedElement = null;
	},
	outlinedElement: null,
	needText: false,
	destelement: null,
	callback: null
};

function selectRegion(callback) {
	regions.needText = false; 
	regions.destelement = null; 
	regions.callback = callback;
	document.addEventListener("mouseover", regions.mouseover, true);
	document.addEventListener("mousedown", regions.mousedown, true);
	document.addEventListener("mouseup",   regions.mouseup,   true);
	document.addEventListener("mouseout",  regions.mouseout,  true);
}


function highlightChanges(config, oldContent) {
	var doc = document;
	var text = "";
	config.excludeElements = [];
	for (var i = 0; i < config.excludes.length; i ++ ) {
		var elements = doc.evaluate(config.excludes[i], doc, null, XPathResult.ANY_TYPE, null);
		for(var element = elements.iterateNext(); element!=null; element = elements.iterateNext()) {
			config.excludeElements.push(element);
		}
	}
	if (config.showRegions)
		for(var i=0; i<config.excludeElements.length; i++)
			config.excludeElements[i].style.outline = config.excludeRegion + " dotted 2px";
	
	var regions = [];
	for (var i = 0; i < config.includes.length; i ++ ) {
		var elements = doc.evaluate(config.includes[i], doc, null, XPathResult.ANY_TYPE, null);
		for(var element = elements.iterateNext(); element!=null; element = elements.iterateNext()) {
			regions.push(element);
		}
	}
	if(regions.length == 0) {
		return -1;
	}
	for (var i = 0; i < regions.length; i ++ ) {
		if (config.showRegions)
			regions[i].style.outline = config.includeRegion + " dotted 2px";        	
		text += _getTextForNode(regions[i], config)
	}
	var current = text;
	var oldt = _split(_clean(oldContent, config)),
		newt = _split(_clean(text, config)),
		old2 = _split(oldContent);
	var diff = {
		oldWords: oldt,
		newWords: newt,
		newToOld: [],
		oldToNew: []
		};
	_diff(diff);
	if(config.checkDeleted) {    
		for(var opos=0, npos=0; opos<=oldt.length && npos<=newt.length; ) {
			if(opos == diff.oldWords.length) 
				diff.newToOld[npos++]=null;
			else if(npos == diff.newWords.length)
				diff.oldToNew[opos++]=null;
			else if (diff.newToOld[npos] == null)
				npos++;
			else if (diff.oldToNew[opos] == null)
				opos++;
			else if (diff.oldToNew[opos] == npos) {
				opos++; npos++; 
			} else if (diff.oldToNew[opos] - npos < 0) 
				diff.oldToNew[opos++]=null;
			else if (diff.newToOld[npos] - opos < 0) 
				diff.newToOld[npos++]=null;
			else {
				for(var i = 1; opos + i < oldt.length && npos + i < newt.length; i++) {
					if(diff.oldToNew[opos + i] != diff.oldToNew[opos] + i) {
						for(var j = opos; j < opos+i; j++) 
							diff.oldToNew[j] = null;
						opos = opos + i - 1;
						break;
					} 
					if(diff.newToOld[npos + i] != diff.newToOld[npos] + i) {
						for(var j = npos; j < npos+i; j++) 
							diff.newToOld[j] = null;
						npos = npos + i - 1;
						break;
					}
				}
			}
		}
	}
	var pos = 0,
	wpos = 0,
	npos = 0,
	opos = 0;
	changes = 0;
	var ret = "";
	for (var i = 0; i < regions.length; i ++ ) {
		
		var ot = "",
		nt = "",
		wc = 0;
		var doc = regions[i].ownerDocument;

		var domactions = [],
		last = "",
		action = "";
		var count = true;
		var tw = doc.createTreeWalker(regions[i], NodeFilter.SHOW_ALL, _filter(config), true), cur=null;
		while (cur = tw.nextNode()) {
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
			var words = _split(text),
			txt = "",
			replace = null,
			wpos = 0;
			wc += words.length;
			while (true) {
				if(config.checkDeleted) {
					if (npos == diff.newWords.length && opos == diff.oldWords.length)
						action = "";
					else if(opos == diff.oldWords.length)
						action = "I";
					else if(npos == diff.newWords.length)
						action = "D";
					else if (diff.newToOld[npos] == null)
						action = "I";
					else if (diff.oldToNew[opos] == null)
						action = "D";
					else if (diff.oldToNew[opos] == npos)
						action = "K";
					else if (diff.oldToNew[opos] - npos < 0) 
						action="I";
					else if (diff.newToOld[npos] - opos < 0)
						action="D";
					else if (diff.oldToNew[opos] - npos <= diff.newToOld[npos] - opos) 
						action = "I";
					else 
						action = "D";
				} else {
					if(npos==diff.newWords.length) action="";
					else if(diff.newToOld[npos]==null) action="I";
					else action="K";
				}
				
				if ((last != action && txt != "") || 
						((replace != null || last != "K") && wpos >= words.length && action != "D") || 
						((replace != null || last != "K") && wpos < words.length && npos < newt.length && _clean(words[wpos], config).length < newt[npos].length)) {
					if (replace == null)
						replace = doc.createElement("SITEDELTA_SPAN");
					if (last == "K") {
						replace.appendChild(_DOMChanged(doc, txt, (1-changes), last, config));
						if (txt.match(/\[[^ ]+\] /))
							replace = null;
					} else if (last == "D" || last=="m") {
						if (txt.replace(/\s+/, "") != "") {
							replace.appendChild(_DOMChanged(doc, txt, (count ? (++changes-1): (1-changes)), last, config));
						}
					} else if (last == "I" || last == "M") {
						replace.appendChild(_DOMChanged(doc, txt, (count ? (++changes-1): (1-changes)), last, config));
					}
					if (last == "K")
						count = true;
					else count = false;
					txt = "";
				}
				if (wpos >= words.length && action != "D" && action != "m")
					break;
				if (wpos < words.length && (npos >= newt.length || _clean(words[wpos], config).length < newt[npos].length)) {
					ret = words[wpos];
					break;
				}
				last = action;
				if (action == "K") {
					txt += words[wpos ++ ];
					pos ++ ;
					opos ++ ;
					npos ++ ;
				} else if (action == "I" || action == "M") {
					txt += words[wpos ++ ];
					pos ++ ;
					npos ++ ;
				} else if (action == "D" || action == "m") {
					txt += old2[opos ++ ];
					pos ++ ;
				}
			}
			if (replace != null && cur != null) {
				domactions.push( {
					elem: cur,
					repl: replace,
					drop: drop
				});
			}
		}
		for (var ii = 0; ii < domactions.length; ii ++ ) {
			for (var j = 0; j < domactions[ii].drop.length; j ++ )
				domactions[ii].drop[j].parentNode.removeChild(domactions[ii].drop[j]);
			domactions[ii].elem.parentNode.replaceChild(domactions[ii].repl, domactions[ii].elem);
		}
	}
	return changes;
}


function getText(config) {
    var doc = document;

    config.excludeElements = [];
    for (var i = 0; i < config.excludes.length; i ++ ) {
        var elements = doc.evaluate(config.excludes[i], doc, null, XPathResult.ANY_TYPE, null);
        for(var element = elements.iterateNext(); element!=null; element = elements.iterateNext()) {
            config.excludeElements.push(element);
        }
    }
    var regions = [];
    for (var i = 0; i < config.includes.length; i ++ ) {
        var elements = doc.evaluate(config.includes[i], doc, null, XPathResult.ANY_TYPE, null);
        for(var element = elements.iterateNext(); element!=null; element = elements.iterateNext()) {
            regions.push(element); 
        } 
    }
    var pos = 0,
    text = "";
    for (var i = 0; i < regions.length; i ++ ) {
        text += _getTextForNode(regions[i], config);
    }
    return text;
}

function _DOMChanged(doc, text, nr, type, config) {
	var del = doc.createElement("SITEDELTA_SPAN"),
	ret = del;
	if (type == "D" || type=="m") {
		ret = doc.createElement("SITEDELTA_SPAN");
		if (text == "")
			return ret;
		del = doc.createElement("SITEDELTA_DEL");
		var img = doc.createElement("IMG");
		if(type=="D") {
			del.setAttribute("style", "border: dotted " + config.removeBorder + " 1px; background: " + config.removeBackground + "; color: #000; display: none; position: absolute; z-index: 2147483647; width: auto; left: 0px; top: 0px; padding: 2px; -moz-border-radius: 5px; ");
			img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAK3RFWHRDcmVhdGlvbiBUaW1lAE1vIDI4IE1haSAyMDA3IDE5OjI5OjA2ICswMTAwKyfyCQAAAAd0SU1FB9cFHBElAZPQyFYAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAAA2ElEQVR42pXRMQsBYRzH8edYDDKgSFlI2aTcYmPwBm6x3OIFyNswGW0Wg2QxyeAFoCQlKZTEoJTJYOL7uOfquhBXn7vu//zu+T/PPUL8ez2ESKKM2JeMBq/9ssQcG5hy0BUOoI7G6yNuA1WsYYWgq/sQY2Tt4gktTNFDWC2hhB3aiDhbFlQXuaQLrip4xwwGEvDJvObcGI8UmsigizjSwupww9YOe1HFGUfojonkWBR5VJzL2qOv9tKB590vtosGFjAxQsia5/PB6JhgjQOKv5y4XwaR+5Z7AvWEaQDm0aTzAAAAAElFTkSuQmCC");
		} else {
			del.setAttribute("style", "border: dotted " + config.moveBorder + " 1px; background: " + config.moveBackground + "; color: #000; display: none; position: absolute; z-index: 2147483647; width: auto; left: 0px; top: 0px; padding: 2px; -moz-border-radius: 5px; ");
			img.setAttribute("src", "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAMCAYAAABWdVznAAAAK3RFWHRDcmVhdGlvbiBUaW1lAE1vIDI4IE1haSAyMDA3IDE5OjI5OjA2ICswMTAwKyfyCQAAAAd0SU1FB9cGAw4dMfo2nVUAAAAJcEhZcwAACxIAAAsSAdLdfvwAAAAEZ0FNQQAAsY8L/GEFAAABMUlEQVR42pWRzStEURjGf/eO0BBNEk3ZkJqdna0sKCsLJfkoe1sbWfEXWJClyIaVUmKoWVlRKFbGxtYGJRkf43fvTAaNhff2nPPc93nOed9zDvw79ujigDGypP/0FAnYJhHRQPOl46u8USwywKb/xW8bNhEyb66WB2ZDyS1v9CmtaJtzg9SP6gn3DtVDNhjlPdTUY3LJeVxcUSCMWzhg0HxWdsczw1Y+i/aIxEnRrpAS/dRxrS2vtuv/vdhxYQM56ktnqETAId0uXo2rBmzxQYdzRrSpP4l8TWyNbqCZGY3z4tW6Q7Zw8qW1+r3QKcuUKuzbSsCa7Fyk5TccM8GCNX5FWB5HHC883JQVjuQtmotUiZpy9+vKyyTjNpLy6fi5qkTl0DkfrkCvmUcv9PSvR/8EAddN/cjvW0QAAAAASUVORK5CYII=");            	
		}
		img.setAttribute("border", "0");
		ret.appendChild(img);
		img.addEventListener("mouseover", function(del) {return function(event) {
			del.style.display = 'block';
			del.style.maxWidth = this.ownerDocument.width / 3;
		}}(del), false);
		img.addEventListener("mousemove", function(del) {return function(event) {
			del.style.left = (event.pageX <= this.ownerDocument.width / 2 ? event.pageX + 4: Math.max(10, event.pageX - 4 - del.clientWidth)) + "px";
			del.style.top = (event.pageY - del.clientHeight > 0 ? (event.pageY - del.clientHeight): event.pageY + 10) + "px";
		}}(del), false);
		img.addEventListener("mouseout", function(del) {return function(event) {
			del.style.display = 'none';
		}}(del), false);
		doc.body.appendChild(del);
		if (nr > -1) img.id = "sitedelta-change" + nr; 
		img.className="sitedelta-change" + Math.abs(nr);
		del.className="sitedelta-change" + Math.abs(nr);

	} else if (type == "I" || type=="M") {
		del = doc.createElement("SITEDELTA_INS");
		ret = del;
		if(type=="I")
			del.setAttribute("style", "display: inline; outline: " + config.addBorder + " dotted 1px; background: " + config.addBackground + "; color: #000;");
		else
			del.setAttribute("style", "display: inline; outline: " + config.moveBorder + " dotted 1px; background: " + config.moveBackground + "; color: #000;");
		
		if (nr > -1) del.id = "sitedelta-change" + nr; 
		del.className="sitedelta-change" + Math.abs(nr);

	}
	
	while (text.indexOf("[") !=- 1) {
		del.appendChild(doc.createTextNode(text.substring(0, text.indexOf("["))));
		text = text.substr(text.indexOf("[") + 1);
		if (text.charAt(0) == " ") {
			del.appendChild(doc.createTextNode("["));
		} else {
			var img = doc.createElement("IMG");
			img.setAttribute("src", text.substring(0, text.indexOf("]")));
			img.setAttribute("border",0);
			del.appendChild(img);
			text = text.substr(text.indexOf("]") + 1);
		}
	}
	if (text != "")
		del.appendChild(doc.createTextNode(text));
	return ret;
}

function _filter(config) {
	return {
		acceptNode: function(cur) {
			for (var i = 0; i < config.excludeElements.length; i ++ )
				if (config.excludeElements[i] == cur)
					return NodeFilter.FILTER_REJECT;
			if (cur.nodeName == 'SCRIPT' || cur.nodeName == 'NOSCRIPT' || cur.nodeName == 'STYLE')
				return NodeFilter.FILTER_REJECT;
			if (cur.nodeType == 3 || (config.scanImages && cur.nodeName == 'IMG' && cur.hasAttribute("src") && cur.getAttribute("src").indexOf("chrome:") != 0))
				return NodeFilter.FILTER_ACCEPT;
			return NodeFilter.FILTER_SKIP;
		}
	};	
}

function _getTextForNode(node, config) {
    var doc = node.ownerDocument, cur=null, text="", ret = "";
    var tw = doc.createTreeWalker(node, NodeFilter.SHOW_ALL, _filter(config), true);
    while (cur = tw.nextNode()) {
        if (cur.nodeType == 3 || (config.scanImages && cur.nodeName == 'IMG')) {
            if (cur.nodeName == 'IMG' && cur.hasAttribute("src"))
                text = "[" + cur.getAttribute("src") + "] ";
            else text = cur.data.replace(/\[/, "[ ") + " ";
            text = text.replace(/\s+/g, ' ');
            text = text.replace(/^ +/, '');
            text = text.replace(/ +$/, ' ');
            text = text.replace(/[\u0000-\u001f]/g, "");
            if (text != " ")
                ret += text;
        }
    }
    return ret;
}

var _spaceRegex = /[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+| +|[^ \[\u0030-\u0039\u0041-\u005a\u0061-\u007a\u00aa\u00b5\u00ba\u00c0-\u00d6\u00d8-\u00f6\u00f8-\uffff]+|\[ |\[[^ ]+?\]/g;

function _split(text) {
	if(!text || text=="") return [];
	return text.match(_spaceRegex);
}

function _clean(text, config) {
	if (config.ignoreCase)
		text = text.toLowerCase();
	if (config.ignoreNumbers)
		text = text.replace(/[0-9]+/g, "xxx");
	return text;
}

// diff, based on http://doi.acm.org/10.1145/359460.359467
// and http://en.wikipedia.org/wiki/User:Cacycle/diff.js
function _diff(text, newStart, newEnd, oldStart, oldEnd, recursionLevel) {
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
	for (var i = newStart; i < newEnd; i ++ ) {
		var word = text.newWords[i];
		if (symbol[word] == null)
			symbol[word] = {
			newCtr: 0,
			oldCtr: 0,
			toNew: null,
			toOld: null
		};
		symbol[word].newCtr ++ ;
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
			symbol[word].newCtr ++ ;
			symbol[word].toNew = i;
		}
	}
	//
	for (var j = oldStart; j < oldEnd; j ++ ) {
		var word = text.oldWords[j];
		if (symbol[word] == null)
			symbol[word] = {
			newCtr: 0,
			oldCtr: 0,
			toNew: null,
			toOld: null
		};
		symbol[word].oldCtr ++ ;
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
			symbol[word].oldCtr ++ ;
			symbol[word].toOld = j;
		}
	}
	//
	for (var i in symbol) {
		if ((symbol[i].newCtr == 1) && (symbol[i].oldCtr == 1) && !/\s+/.test(text.newWords[symbol[i].toNew])) {
			text.newToOld[symbol[i].toNew] = symbol[i].toOld;
			text.oldToNew[symbol[i].toOld] = symbol[i].toNew;
		}
	}
	//
	if (text.newWords[newStart] == text.oldWords[oldStart]) {
		text.newToOld[newStart] = oldStart;
		text.oldToNew[oldStart] = newStart;
	}
	for (var i = newStart; i < newEnd - 1; i ++ ) {
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
	for (var i = newEnd - 1; i > newStart; i -- ) {
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
				iEnd ++ ;
			}
			var iLength = iEnd - iStart;
			var jStart = j;
			var jEnd = j;
			while ((text.oldToNew[jEnd] == null) && (jEnd < oldEnd)) {
				jEnd ++ ;
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
			i ++ ;
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
				iStart -- ;
			}
			var iLength = iEnd - iStart;
			var jStart = j;
			var jEnd = j;
			while ((text.oldToNew[jStart] == null) && (jStart >= oldStart)) {
				jStart -- ;
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
			i -- ;
		}
	}
	return;
}