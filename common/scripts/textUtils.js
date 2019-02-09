var textUtils = {

	getText: function (doc, config) {
		var regions = textUtils._findElements(doc, config.includes);
		var excludes = textUtils._findElements(doc, config.excludes);
		if(regions.length == 0) return null;
		var text = "";
		for (var i = 0; i < regions.length; i++) {
			text += textUtils._getTextForNode(regions[i], config, excludes);
		}
		return text;
	},

	clean: function (text, config) {
		if (config.ignoreCase)
			text = text.toLowerCase();
		if (config.ignoreNumbers)
			text = text.replace(/[0-9]+/g, "xxx");
		return text;
	},

	isEqual: function(oldContent, newContent, config) {
		var oldt = textUtils.clean(oldContent, config), newt = textUtils.clean(newContent, config);
		if(config.checkDeleted) {
			return oldt == newt;
		} else {
			for(var i=0, j=0; i<newt.length; i++, j++) {
				while(j<oldt.length && newt[i]!=oldt[j]) j++;
				if(j>=oldt.length) return false;
			}
			return true;
		}
	},

	_findElements: function (doc, xpaths) {
		var ret = [];
		for (var i = 0; i < xpaths.length; i++) {
			var xpath = xpaths[i];
			if(xpath.startsWith("/") || xpath.startsWith("id(")) {
				var elements = doc.evaluate(xpath, doc, null, XPathResult.ANY_TYPE, null);
				for (var element = elements.iterateNext(); element != null; element = elements.iterateNext()) ret.push(element);
			} else {
				var elements = doc.querySelectorAll(xpath);
				for(var j=0; j<elements.length; j++) ret.push(elements.item(j));
			}
		}
		return ret;
	},

	_filter: function (config, excludes) {
		return {
			acceptNode: function (cur) {
				for (var i = 0; i < excludes.length; i++)
					if (excludes[i] == cur)
						return NodeFilter.FILTER_REJECT;
				if (cur.nodeName == 'SCRIPT' || cur.nodeName == 'NOSCRIPT' || cur.nodeName == 'STYLE')
					return NodeFilter.FILTER_REJECT;
				if (cur.nodeType == 3 || (config.scanImages && cur.nodeName == 'IMG' && cur.hasAttribute("src") && cur.getAttribute("src").indexOf("chrome:") != 0))
					return NodeFilter.FILTER_ACCEPT;
				return NodeFilter.FILTER_SKIP;
			}
		};
	},

	_getTextForNode: function (node, config, excludes) {
		var doc = node.ownerDocument, cur = null, text = "", ret = "";
		var tw = doc.createTreeWalker(node, NodeFilter.SHOW_ALL, textUtils._filter(config, excludes), true);
		while ((cur = tw.nextNode()) !== null) {
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
}