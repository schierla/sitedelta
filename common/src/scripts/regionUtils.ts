export function showOutline(doc: Document, xpaths: string | string[], color: string): void {
  if (_outlined.length > 0) removeOutline(doc);

  if(typeof xpaths === "string") xpaths = [xpaths];
  for(const xpath of xpaths) {
    if (xpath.startsWith("/") || xpath.startsWith("id(")) {
      let elements = doc.evaluate(xpath, doc, null, 0, null);
      for (
        var node = elements.iterateNext();
        node != null;
        node = elements.iterateNext()
      ) {
        _outlined.push({
          e: node as HTMLElement,
          o: (node as HTMLElement).style.outline,
        });
      }
    } else {
      let elements = Array.from(doc.querySelectorAll(xpath));
      for (let element of elements) {
        _outlined.push({
          e: element as HTMLElement,
          o: (element as HTMLElement).style.outline,
        });
      }
    }
    for (var i = 0; i < _outlined.length; i++) {
      _outlined[i].e.style.outline = color + " dotted 2px";
    }
  }
}

export function removeOutline(doc: Document): void {
  while (_outlined.length > 0) {
    var outlined = _outlined.shift();
    if (outlined) outlined.e.style.outline = outlined.o;
  }
}

export function selectRegion(doc: Document): Promise<string> {
  return new Promise((resolve) => {
    _doc = doc;
    _needText = false;
    _destelement = null;
    _resolve = (result: string) => resolve(result);
    doc.addEventListener("mouseover", _mouseover, true);
    doc.addEventListener("mousedown", _mousedown, true);
    doc.addEventListener("mouseup", _mouseup, true);
    doc.addEventListener("mouseout", _mouseout, true);
  });
}

export function selectRegionOverlay(
  overlay: HTMLElement,
  idoc: Document
): Promise<string> {
  return new Promise((resolve) => {
    _doc = idoc;
    _needText = false;
    _destelement = null;
    _resolve = (result: string) => resolve(result);
    _overlay = overlay;

    while (overlay.firstChild) overlay.removeChild(overlay.firstChild);
    var overlaycontent = document.createElement("div");
    overlaycontent.style.position = "absolute";
    overlaycontent.style.left = "0px";
    overlaycontent.style.top = "0px";
    overlaycontent.style.width = idoc.body.scrollWidth + "px";
    overlaycontent.style.height = idoc.body.scrollHeight + "px";
    overlay.appendChild(overlaycontent);

    overlay.style.display = "block";
    if (idoc.defaultView) {
      overlay.scrollTop = idoc.defaultView.scrollY;
      overlay.scrollLeft = idoc.defaultView.scrollX;
    }

    overlay.addEventListener("mousemove", _overlaymousemove);
    overlay.addEventListener("mousedown", _overlaymousedown);
    overlay.addEventListener("mouseup", _overlaymouseup);
    overlay.addEventListener("scroll", _overlayscroll);
    window.addEventListener("resize", _overlayresize);
  });
}

export function abortSelect(): void {
  if (_destelement !== null) _destelement.style.outline = "none";
  if (_doc === null) return;

  if (_overlay !== null) {
    _overlay.style.display = "none";

    _overlay.removeEventListener("mousemove", _overlaymousemove);
    _overlay.removeEventListener("mousedown", _overlaymousedown);
    _overlay.removeEventListener("mouseup", _overlaymouseup);
    _overlay.removeEventListener("scroll", _overlayscroll);
    window.removeEventListener("resize", _overlayresize);
    _overlay = null;
  } else {
    _doc.removeEventListener("mouseover", _mouseover, true);
    _doc.removeEventListener("mousedown", _mousedown, true);
    _doc.removeEventListener("mouseup", _mouseup, true);
    _doc.removeEventListener("mouseout", _mouseout, true);
  }

  _needText = false;
  _destelement = null;
  _resolve = null;
  _doc = null;
}

function _handleOver(target: HTMLElement) {
  _showOutline(target);
}

function _handleOut(target: HTMLElement) {
  _hideOutline(target);
}

function _handleDown(target: HTMLElement) {
  _needText = true;
  _destelement = target;
  target.style.outline = "green solid 2px;";
}

function _handleUp(target: HTMLElement) {
  var xpath: string | null = null;
  _needText = false;
  if (
    target != _destelement &&
    ((target.firstChild && "data" in (target.firstChild as CharacterData)) ||
      target.id)
  ) {
    var to = _buildXPath(_destelement as HTMLElement, false).split("/");
    var from = _buildXPath(target, false).split("/");
    var common = "";
    for (var i = 0; i < Math.min(to.length, from.length); i++) {
      common += "/" + to[i];
      if (to[i] != from[i]) break;
    }
    common = common.substr(1);
    if (target.id) {
      xpath = '//*[@id="' + target.id + '"]';
      xpath = 'id("' + target.id + '")';
    } else {
      var data = new String((target.firstChild as CharacterData).data);
      var func = "text()";
      if (
        data
          .replace(/[ \n\t\r]+/g, " ")
          .replace(/^ /, "")
          .replace(/ $/, "") != data
      ) {
        data = data
          .replace(/[ \n\t\r]+/g, " ")
          .replace(/^ /, "")
          .replace(/ $/, "");
        func = "normalize-space(" + func + ")";
      }
      if (data.replace(/"/, "'") != data) {
        data = data.replace(/"/, "'");
        func = "translate(" + func + ",'\"',\"'\")";
      }

      xpath =
        "//" + target.nodeName.toLowerCase() + "[" + func + '="' + data + '"]';
    }
    for (var j = i; j < from.length; j++) xpath += "/..";
    for (i = i; i < to.length; i++) xpath += "/" + to[i];
  } else {
    xpath = _buildXPath(_destelement as HTMLElement, true);
  }
  if (_resolve) _resolve(xpath);
  abortSelect();
}

function _mouseover(e: MouseEvent): boolean {
  _handleOver(e.target as HTMLElement);
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function _mouseout(e: MouseEvent): boolean {
  _handleOut(e.target as HTMLElement);
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function _showOutline(target: Element): void {
  if (
    _needText &&
    (!target.firstChild || !("data" in target.firstChild)) &&
    (!target.id || target.id.substr(0, 16) == "sitedelta-change")
  )
    return;
  (target as HTMLElement).style.outline = "red dotted 2px";
}

function _hideOutline(target: Element): void {
  if (target && target != _destelement)
    (target as HTMLElement).style.outline = "none";
}

function _mousedown(e: MouseEvent): boolean {
  _handleDown(e.target as HTMLElement);
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function _mouseup(e: MouseEvent): boolean {
  _handleOut(e.target as HTMLElement);
  if (e.button == 0 && !e.ctrlKey) _handleUp(e.target as HTMLElement);
  e.preventDefault();
  e.stopPropagation();
  return false;
}

function _overlaymousemove(e: MouseEvent): void {
  if (!_doc || !_overlay) return;
  var elem: Element | null = _doc.elementFromPoint(
    e.clientX -
      _overlay.offsetLeft -
      (_overlay.offsetParent as HTMLElement)?.offsetLeft || 0,
    e.clientY -
      _overlay.offsetTop -
      (_overlay.offsetParent as HTMLElement)?.offsetTop || 0
  );
  if (elem) {
    if (elem == _doc.firstChild) elem = null;
    if (_overlayelem !== null && _overlayelem != elem) {
      _handleOut(_overlayelem);
      _overlayelem = null;
    }
    if (_overlayelem != elem) {
      _overlayelem = elem as HTMLElement;
      if (_overlayelem) _handleOver(_overlayelem);
    }
  }
}

function _overlaymousedown(e: MouseEvent): void {
  if (_overlayelem !== null) _handleDown(_overlayelem);
}

function _overlaymouseup(e: MouseEvent): void {
  if (_overlayelem !== null) _handleUp(_overlayelem);
}

function _overlayscroll(e: Event): void {
  if (!_doc || !_doc.defaultView || !_overlay) return;
  _doc.defaultView.scrollTo(_overlay.scrollLeft, _overlay.scrollTop);
}

function _overlayresize(e: Event): void {
  if (!_doc || !_overlay) return;
  var child = _overlay.firstChild as HTMLElement;
  child.style.width = _doc.body.scrollWidth + "px";
  child.style.height = _doc.body.scrollHeight + "px";
}

function _buildXPath(t: HTMLElement, allowId: boolean): string {
  var path = "";
  if (allowId && t.id != "" && t.id.indexOf("sitedelta") == -1)
    return 'id("' + t.id + '")';
  while (t.nodeName != "HTML" && t.parentNode) {
    var c = t.parentNode.firstChild;
    var num = 1;
    while (c && c != t) {
      if (c.nodeName == t.nodeName) num++;
      c = c.nextSibling;
    }
    path = "/" + t.nodeName.toLowerCase() + "[" + num + "]" + path;
    t = t.parentNode as HTMLElement;
    if (allowId && t.id != "" && t.id.indexOf("sitedelta") == -1)
      return 'id("' + t.id + '")' + path;
  }
  path = "/" + t.nodeName.toLowerCase() + path;
  return path;
}

var _outlined: { e: HTMLElement; o: string }[] = [];
var _needText: boolean = false;
var _destelement: HTMLElement | null = null;
var _resolve: ((region: string | null) => any) | null = null;
var _doc: Document | null = null;
var _overlay: HTMLElement | null = null;
var _overlayelem: HTMLElement | null = null;
