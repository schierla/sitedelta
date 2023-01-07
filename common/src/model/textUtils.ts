import { Config } from "./config";

export function getText(doc: Document, config: Config): string | null {
	var regions = findElements(doc, config.includes);
	var excludes = findElements(doc, config.excludes);
	if(regions.length == 0) return null;
	var text = "";
	for (var i = 0; i < regions.length; i++) {
		text += _getTextForNode(regions[i], config, excludes);
	}
	return text;
}

export function clean(text: string, config: Config): string {
	if (config.ignoreCase)
		text = text.toLowerCase();
	if (config.ignoreNumbers)
		text = text.replace(/[0-9]+/g, "xxx");
	return text;
}

export function isEqual(oldContent: string, newContent: string, config: Config): boolean {
	var oldt = clean(oldContent, config), newt = clean(newContent, config);
	if(config.checkDeleted) {
		return oldt == newt;
	} else {
		for(var i=0, j=0; i<newt.length; i++, j++) {
			while(j<oldt.length && newt[i]!=oldt[j]) j++;
			if(j>=oldt.length) return false;
		}
		return true;
	}
}

export function findElements(doc: Document, xpaths: string[]): Element[] {
	var ret: Element[] = [];
	for (var i = 0; i < xpaths.length; i++) {
		var xpath = xpaths[i];
		if(xpath.startsWith("/") || xpath.startsWith("id(")) {
			let elements = doc.evaluate(xpath, doc, null, 0 /* XPathResult.ANY_TYPE */, null);
			for (var element = elements.iterateNext(); element != null; element = elements.iterateNext()) 
				ret.push(element as Element);
		} else {
			let elements = Array.from(doc.querySelectorAll(xpath));
			for(let element of elements) ret.push(element);
		}
	}
	return ret;
}

export function* walkTree(node: Node, config: Config, excludes: Node[]) {
	for(var cur = node.firstChild; cur; cur = cur.nextSibling) {
		if(excludes.indexOf(cur) !== -1) continue;
		if (cur.nodeName == 'SCRIPT' || cur.nodeName == 'STYLE') continue;
		if (cur.nodeType == 3) 
			yield cur;
		if (config.scanImages && cur.nodeName == 'IMG') {
			var src = (cur as HTMLElement).getAttribute("src");
			if(src && src.indexOf("chrome:") != 0) yield cur;
		}
		yield* walkTree(cur, config, excludes);
	}
}

function _getTextForNode(node: Node, config: Config, excludes: Node[]): string {
	var doc = node.ownerDocument, text = "", ret = "";
	if(!doc) return "";
	if(excludes.indexOf(node) !== -1) return ret;
	for(var cur of walkTree(node, config, excludes)) {
		if (cur.nodeType == 3 || (config.scanImages && cur.nodeName == 'IMG')) {
			if (cur.nodeName == 'IMG' && (cur as Element).hasAttribute("src")) 
				text = "[" + (cur as Element).getAttribute("src") + "]";
			else 
				text = (cur as CharacterData).data.replace(/\[/g, "[ ");
			text = text.replace(/\s+/g, ' ').replace(/^ +/, '').replace(/ +$/, '').replace(/[\u0000-\u001f]/g, "");
			if (text != "")
				ret += text + " ";
		}
	}
	return ret;
}