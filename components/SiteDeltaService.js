const CLASS_ID = Components.ID("{df5f1305-f0f5-415c-b71e-118e779e0590}");
const CLASS_NAME = "SiteDelta XPCOM Component";
const CONTRACT_ID = "@sitedelta.schierla.de/sitedelta;1";
const Cc=Components.classes; 
const Ci=Components.interfaces;
 
function SiteDelta() {
 this._load();
};
SiteDelta.prototype = {
 wrappedJSObject: this, _observerService: null, _iframe: null,
 _timer: null, _loadtimer: null,
 _prefs: null, _prefManager: null, _dir: null, _excludes: [],
 _pageNames: null, _pages: {}, _presetNames: null, _presets: {},
 scanImages: null, checkDeleted: null, _scanImages: null, _checkDeleted: null,
 showRegions: null, openChanged: null,
 moveBorder: null, moveBackground: null,
 addBorder: null, addBackground: null,
 removeBorder: null, removeBackground: null,
 excludeRegion: null, includeRegion: null,
 backupPages: null, scanOnLoad: null, siteSettings: null,
 enableWatch: false, watchPageDelay: null, watchScanDelay: null, watchPageTimeout: null,
 _watchPage: -1,
 
 RESULT_UNCHANGED: 0, RESULT_NEW: -1, RESULT_NOTFOUND: -2,
 RESULT_CHECKING: -3, RESULT_UNCHECKED: -4,
 
 addObserver: function(object) {
  this._observerService.addObserver(object,"sitedelta",false);	
 },
 removeObserver: function(object) {
  this._observerService.removeObserver(object,"sitedelta");	
 },
 
 observe: function(aSubject, aTopic, aData) {
  if (aTopic == "app-startup") {
  } else if(aTopic == "nsPref:changed") {
   this._loadPrefs();
  } else if(aTopic == "xpcom-shutdown") {
   this._unload();
  }
 },
   
 buildXPath: function(t) {
  var path="";
  while(t.nodeName!="HTML") {
   c=t.parentNode.firstChild;
   num=1;
   while(c!=t) {
    if(c.nodeName==t.nodeName) num++;
    c=c.nextSibling;
   }
   path="/" + t.nodeName.toLowerCase() + "["+num+"]"+path;   
   t=t.parentNode;
  }
  path="/"+t.nodeName.toLowerCase() + path;   
  return path;
 },
 // presets
 deletePreset: function(fn) {
  delete(this._presets[fn]);
  if(this._presetNames) this._presetNames.splice(this._presetNames.indexOf(fn),1);  
  var file=this._sitedeltaDir();
  file.append(fn); file.remove(false);
 },
 listPresets: function() {
  if(this._presetNames) return this._presetNames;
  var file = this._sitedeltaDir(); 
  var entries=file.directoryEntries;
  var presets=[];
  while(entries.hasMoreElements()) {
   var entry = entries.getNext(); entry.QueryInterface(Ci.nsIFile); 
   if(/\.sitedelta-preset$/.test(entry.leafName)) presets.push(entry.leafName);
  }
  this._presetNames=presets;
  return presets;
 },
 getPreset: function(fn) {
  if(this._presets[fn]) return this._presets[fn];
  this._presets[fn] = this._loadFile(fn);
  return this._presets[fn];
 },
 putPreset: function(p, fn) {
  delete(this._presets[fn]);
  this._saveFile(fn, p);	
 },
 newPreset: function(p) {
  var nr=0; 
  var names=this.listPresets();
  while(true) {
   if(names.indexOf(nr+".sitedelta-preset")==-1) break;
   nr++;
  }
  this._presetNames.push(nr+".sitedelta-preset");
  this.putPreset(p, nr+".sitedelta-preset");
  return nr+".sitedelta-preset";
 },
 isPresetPreferred: function(preset, url) {
  return new RegExp("^" + preset.url.replace(/([\{\\\^\$\.\|\?\*\+\(\)])/g,"\\$&").replace(/\\\*/g,".*").replace(/\\\?/g,".") + "$").test(url); 	
 },
 // pages
 deletePage: function(url) {
  url=url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
  delete(this._pages[url]);
  if(this._pageNames) this._pageNames.splice(this._pageNames.indexOf(url),1);  
  var file=this._sitedeltaDir();
  file.append(this._getFilename(url)+".dat"); if(file.exists()) file.remove(false);
  this._observerService.notifyObservers(null, "sitedelta", url);
 },
 listPages: function() {
  if(this._pageNames) return this._pageNames;
  this._pageNames=[];
  var file = this._sitedeltaDir(); 
  var entries=file.directoryEntries;
  while(entries.hasMoreElements()) {
   var entry = entries.getNext(); entry.QueryInterface(Ci.nsIFile); 
   if(/\.dat$/.test(entry.leafName)) {
   	var page=this._loadFile(entry.leafName); this._pageNames.push(page.url);
   }
  }
  return this._pageNames;
 }, 
 getPage: function(url) {
  url=url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
  if(this._pages[url]) return this._pages[url];
  this._pages[url]=this._loadFile(this._getFilename(url)+".dat"); 	
  
  if(this._pages[url].status==-1) {
   this._pages[url].url=url;
   var presets=this.listPresets();
   for(var i=0; i<presets.length; i++) {
    var preset=this.getPreset(presets[i]);
    if(this.isPresetPreferred(preset, url)) {
     this._pages[url].includes=preset.includes; this._pages[url].excludes=preset.excludes;
     break;
    }
   }
  }
  return this._pages[url];
 },
 putPage: function(page) {
  if(this._pages && this._pages[page.url]) delete(this._pages[page.url]);
  if(this._pageNames && this._pageNames.indexOf(page.url)==-1) this._pageNames.push(page.url);
  this._saveFile(this._getFilename(page.url)+".dat", page);	
  this._observerService.notifyObservers(null, "sitedelta", page.url);  
 },

 scanPage: function(doc) {
  var url=doc.URL, changes=this.RESULT_UNCHANGED;
  url=url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://");
  var result=this.getPage(doc.URL);
  var text="";
  this._excludes=[];
  for(var i=0;i<result.excludes.length; i++) {
   this._excludes.push(doc.evaluate(result.excludes[i], doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext());
  }
  var regions=[];
  for(var i=0; i<result.includes.length; i++) {
   var xpath=result.includes[i];
   var startElement=doc.evaluate(xpath,doc,null,Ci.nsIDOMXPathResult.ANY_TYPE,null).iterateNext();
   if(!startElement) return this.RESULT_NOTFOUND;
   regions.push(startElement);
  }
  var pos=0; 
  for(var i=0; i<regions.length; i++) {
   var r=this._walkTree(regions[i], false, null, pos);
   text+= r.text; changes+=r.changes; pos=r.pos;
  }
  this._pages[result.url].status=changes;
  this._observerService.notifyObservers(null, "sitedelta", result.url);
  return changes;
 },
 listBackups: function(url) {
  url=url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
  var fph=Cc["@mozilla.org/network/protocol;1?name=file"].createInstance(Ci.nsIFileProtocolHandler);
  var file=Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("Home", Ci.nsIFile);
  file.append("SiteDelta"); file.append(this._getFilename(url)); 
  if(!file.exists()) return [];
  var entries=file.directoryEntries;
  var backups=[];
  while(entries.hasMoreElements()) {
   var entry = entries.getNext(); entry.QueryInterface(Ci.nsIFile); 
   if(/\.htm$/.test(entry.leafName)) backups.push({name: entry.leafName.replace(/\.htm$/,""), url: fph.getURLSpecFromFile(entry)});
  }
  return backups;
 },
 backupPage: function(doc) {
  var url=doc.URL; var date=new Date();
  url=url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
  var file=Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("Home", Ci.nsIFile);
  file.append("SiteDelta"); if(!file.exists()) file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755); 
  file.append(this._getFilename(url)); if(!file.exists()) file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755); 
  date=date.getFullYear() + "-" + ("00"+date.getMonth()).substr(-2) + "-" + ("00"+date.getDate()).substr(-2) + " " + ("00"+date.getHours()).substr(-2) + "-" + ("00"+date.getMinutes()).substr(-2) + "-" + ("00"+date.getSeconds()).substr(-2);
  var dir=file.clone(); dir.append(date); dir.create(Ci.nsIFile.DIRECTORY_TYPE, 0755); 
  file.append(date+".htm");
  var wbp = Cc['@mozilla.org/embedding/browser/nsWebBrowserPersist;1'].createInstance(Ci.nsIWebBrowserPersist);
  wbp.saveDocument(doc, file, dir, null, null, null);
 },
 highlightPage: function(doc) {
  var url=doc.URL, changes=this.RESULT_UNCHANGED;
  url=url.replace(/http:\/\/[^\/]+@/i, "http://").replace(/https:\/\/[^\/]+@/i, "https://").replace(/#.*$/, "");
  var result=this.getPage(doc.URL);
  var text="";
  
  this._excludes=[];
  for(var i=0;i<result.excludes.length; i++) {
   this._excludes.push(doc.evaluate(result.excludes[i], doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext());
   if(this._excludes[i] && this.showRegions) this._excludes[i].style.MozOutline="dotted "+this.excludeRegion+" 2px;";
  }
  var regions=[];
  for(var i=0; i<result.includes.length; i++) {
   var xpath=result.includes[i];
   var startElement=doc.evaluate(xpath,doc,null,Ci.nsIDOMXPathResult.ANY_TYPE,null).iterateNext();
   if(!startElement) return this.RESULT_NOTFOUND;
   if(this.showRegions) startElement.style.MozOutline="dotted "+this.includeRegion+" 2px;";
   regions.push(startElement);
  }
  var pos=0;
  for(var i=0; i<regions.length; i++) {
   var r=this._walkTree(regions[i], false, null, pos);
   text+= r.text; pos=r.pos;
  }
  if(result.content.replace(/[ \t\n]+/,"")=="" && text.replace(/[ \t\n]+/,"")!="") {
   changes= this.RESULT_NEW;
   this._observerService.notifyObservers(null, "sitedelta", result.url);
  } else {
   var current=text; pos=0; 
   for(var i=0; i<regions.length; i++) {
    var r=this._walkTree(regions[i], true, current, pos);
    current=r.current; changes+=r.changes; pos=r.pos;
   }
  }
  result.url=url.replace(/#.*$/,''); result.title=doc.title.replace(/[\n\r]/g,' ');
  if(result.name=="") result.name=result.title;
  var date=new Date(); result.date=date.toLocaleString(); result.content = text;
  this.putPage(result); 
  var result=this.getPage(doc.URL); result.status=0;
  if(changes>0 && (result.backupPage==true || (result.backupPage==null && this.backupPages))) this.backupPage(doc);
  return changes;
 },
 
 resorePage: function(doc) {
  doc.sitedeltaMatch=false;
  var result=this.getPage(doc.URL); var i=0; var c;
  while((c=doc.getElementById("sitedelta-change"+(i++)))!=null) c.parentNode.replaceChild(c.firstChild, c);
  if(!this.showRegions) return;
  for(var i=0; i<result.includes.length; i++) doc.evaluate(result.includes[i], doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
  for(var i=0; i<result.excludes.length; i++) doc.evaluate(result.excludes[i], doc, null, Ci.nsIDOMXPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
 },
 getURL: function(result) {
  var url=result.url; if(result.user!="" || result.pass!="") url=url.replace(/^http:\/\//i, "http://"+result.user+":"+result.pass+"@").replace(/^https:\/\//i, "https://"+result.user+":"+result.pass+"@");
  return url; 
 },
//*********************************************************************************************************************************

 _loadPrefs: function() {
  this.openChanged=this._prefs.getBoolPref("openChanged");
  this.scanImages=this._prefs.getBoolPref("scanImages");
  this.checkDeleted=this._prefs.getBoolPref("checkDeleted");
  this.showRegions=this._prefs.getBoolPref("showRegions");
  this.moveBorder=this._prefs.getCharPref("moveBorder");
  this.moveBackground=this._prefs.getCharPref("moveBackground");
  this.addBorder=this._prefs.getCharPref("addBorder");
  this.addBackground=this._prefs.getCharPref("addBackground");
  this.removeBorder=this._prefs.getCharPref("removeBorder");
  this.removeBackground=this._prefs.getCharPref("removeBackground");
  this.includeRegion=this._prefs.getCharPref("includeRegion");
  this.excludeRegion=this._prefs.getCharPref("excludeRegion");
  this.backupPages=this._prefs.getBoolPref("backupPages");
  this.scanOnLoad=this._prefs.getBoolPref("scanOnLoad");
  this.watchPageDelay=this._prefs.getIntPref("watchPageDelay") * 1000 + 1;
  this.watchScanDelay=this._prefs.getIntPref("watchScanDelay") * 60000 + 1;
  this.watchPageTimeout=this._prefs.getIntPref("watchPageTimeout") * 1000 + 1;
  if(!this.enableWatch && this._prefs.getBoolPref("enableWatch")) this._timer.initWithCallback(this, this.watchScanDelay / 3, this._timer.TYPE_ONE_SHOT);
  this.enableWatch=this._prefs.getBoolPref("enableWatch");
  this.siteSettings=this._prefs.getBoolPref("siteSettings");
 },
 notify: function() {
  this._timer.cancel();
  if(!this.enableWatch) return;
  if(this._iframe!=null) this._watchEndCheck();
  else this._watchScanNext();
 },
 _load: function() {
  this._prefManager = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefBranch);
  this._prefs = Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService).getBranch("extensions.sitedelta@schierla.de.");
  this._prefs.QueryInterface(Ci.nsIPrefBranch2);
  this._prefs.addObserver("", this, false);
  this._timer = Cc["@mozilla.org/timer;1"].createInstance(Ci.nsITimer);
  this._loadPrefs();
  var file=Cc["@mozilla.org/file/directory_service;1"].getService(Ci.nsIProperties).get("ProfD", Ci.nsIFile);
  file.append("sitedelta");
  this._dir=file;
  if( !file.exists() || !file.isDirectory() ) {
   file.create(Ci.nsIFile.DIRECTORY_TYPE, 0755);
  }
  this.wrappedJSObject = this; 
  this._observerService =Cc["@mozilla.org/observer-service;1"].getService(Ci.nsIObserverService);
  this._observerService.addObserver(this, "xpcom-shutdown",false);
 },
 _unload: function() {
  this._prefs.removeObserver("", this);
  this._observerService.removeObserver(this, "xpcom-shutdown");
  if(this.enableWatch) {
   this._watchEndCheck();
   this._timer.cancel();
  }
 },
 
  // file manipulation
 _sitedeltaDir: function() { 
  return this._dir.clone();
 },
 _saveFile: function(fn, data) {
  var file = this._sitedeltaDir(); file.append(fn);
  var foStream = Cc["@mozilla.org/network/file-output-stream;1"].createInstance(Ci.nsIFileOutputStream);
  foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
  var document= Cc["@mozilla.org/xul/xul-document;1"].createInstance(Ci.nsIDOMDocument).implementation;
  var doc = document.createDocument("", "", null);
  var root=doc.createElement("sitedelta");
  var elem=doc.createElement("url");
  if(data.user!="") {var attr=doc.createAttribute("user"); attr.value=data.user; elem.attributes.setNamedItem(attr); }
  if(data.pass!="") {var attr=doc.createAttribute("pass"); attr.value=data.pass; elem.attributes.setNamedItem(attr); }
  elem.appendChild(doc.createTextNode(data.url)); root.appendChild(elem);
  if(data.name!="") {elem=doc.createElement("name"); elem.appendChild(doc.createTextNode(data.name)); root.appendChild(elem); }
  for(var i=0;i<data.includes.length; i++) {
   elem=doc.createElement("include"); elem.appendChild(doc.createTextNode(data.includes[i])); root.appendChild(elem);
  }
  for(var i=0;i<data.excludes.length; i++) {
   elem=doc.createElement("exclude"); elem.appendChild(doc.createTextNode(data.excludes[i])); root.appendChild(elem);
  }   
  elem=doc.createElement("title"); elem.appendChild(doc.createTextNode(data.title)); root.appendChild(elem);
  elem=doc.createElement("date"); elem.appendChild(doc.createTextNode(data.date)); root.appendChild(elem);
  
  elem=doc.createElement("settings");
  if(data.checkDeleted!=null) {var attr=doc.createAttribute("checkDeleted"); attr.value=data.checkDeleted?"true":"false"; elem.attributes.setNamedItem(attr); }
  if(data.scanImages!=null) {var attr=doc.createAttribute("scanImages"); attr.value=data.scanImages?"true":"false"; elem.attributes.setNamedItem(attr); }
  if(data.backupPage!=null) {var attr=doc.createAttribute("backupPage"); attr.value=data.backupPage?"true":"false"; elem.attributes.setNamedItem(attr); }
  if(data.enableWatch!=null) {var attr=doc.createAttribute("enableWatch"); attr.value=data.enableWatch?"true":"false"; elem.attributes.setNamedItem(attr); }
  if(elem.attributes.length>0) root.appendChild(elem);
    
  elem=doc.createElement("content"); elem.appendChild(doc.createTextNode(data.content)); root.appendChild(elem);
  doc.appendChild(root);
  var serializer=Cc["@mozilla.org/xmlextras/xmlserializer;1"].createInstance(Ci.nsIDOMSerializer);
  serializer.serializeToStream(doc, foStream, "UTF-8");
  foStream.close();
 },
 _getFilename: function(url) {
   var fn=new String(url); 
   fn=fn.replace(/^.*:\/\//, "");
   fn=fn.replace(/[^\/]*@/,"");
   fn=fn.replace(/#.*$/, "");
   fn=fn.replace(/\./g,'-');
   fn=fn.replace(/\%[0-9A-Fa-f]{2}/g, "_");
   fn=fn.replace(/[^a-zA-Z0-9\.]+/g, "_");
   fn=fn.replace(/_$/, "");
   fn=fn.replace(/^_/, "");
   if(fn=='') fn='_default_';
   return fn;
 },
 _loadFile: function(fn) {
  var includes=new Array(); var excludes=new Array(); var url=fn; var title=""; var date=""; var last=" \n"; var status=this.RESULT_NEW; var user=""; var pass="";
  var checkDeleted=null, scanImages=null, enableWatch=null, backupPage=null;
  var file = this._sitedeltaDir(); file.append(fn); var name="";
  if(file.exists()) {
   status=this.RESULT_UNCHECKED;
   var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream); 
   fstream.init(file, -1, 0, 0); 
   var bufferedstream = Cc["@mozilla.org/network/buffered-input-stream;1"].createInstance(Ci.nsIBufferedInputStream);
   bufferedstream.init(fstream,4096); fstream = bufferedstream;
   var parser = Cc["@mozilla.org/xmlextras/domparser;1"].createInstance(Ci.nsIDOMParser); var dom=false;
   dom = parser.parseFromStream(fstream, "UTF-8", -1, "text/xml")
   if(!dom || dom.firstChild.nodeName!="sitedelta") return this._readFileOld(fn);
   var elem=dom.firstChild.firstChild;
   while(elem) {
    if(elem.firstChild || elem.nodeName=="settings") {
     if(elem.nodeName=="url") {
      url=elem.firstChild.data;
      if(elem.hasAttribute("user")) user=elem.attributes.getNamedItem("user").firstChild.data;
      if(elem.hasAttribute("pass")) pass=elem.attributes.getNamedItem("pass").firstChild.data;
     }
     else if(elem.nodeName=="include") includes.push(elem.firstChild.data);
     else if(elem.nodeName=="exclude") excludes.push(elem.firstChild.data);
     else if(elem.nodeName=="title") title=elem.firstChild.data;
     else if(elem.nodeName=="date") date=elem.firstChild.data;
     else if(elem.nodeName=="name") name=elem.firstChild.data;
     else if(elem.nodeName=="content") for(var n=elem.firstChild; n; n=n.nextSibling) last+=n.data;
     else if(elem.nodeName=="settings") {
      if(elem.hasAttribute("checkDeleted")) checkDeleted=elem.attributes.getNamedItem("checkDeleted").firstChild.data=="true";
      if(elem.hasAttribute("scanImages")) scanImages=elem.attributes.getNamedItem("scanImages").firstChild.data=="true";
      if(elem.hasAttribute("backupPage")) backupPage=elem.attributes.getNamedItem("backupPage").firstChild.data=="true";
      if(elem.hasAttribute("enableWatch")) enableWatch=elem.attributes.getNamedItem("enableWatch").firstChild.data=="true";
     }
    }
    elem=elem.nextSibling;
   }
   fstream.close();
  }
  if(includes.length==0) includes.push("/html/body[1]");
  var result={}; result.includes=includes; result.name=name; result.excludes=excludes; result.title=title; result.date=date; 
  result.name=name; result.url=url; result.content=last; result.status=status; result.user=user; result.pass=pass;
  result.checkDeleted=checkDeleted; result.scanImages=scanImages; result.backupPage=backupPage; result.enableWatch=enableWatch;
  return result;
 }, 
 _readFileOld: function(fn) {
  var includes=new Array(); var excludes=new Array(); var url=fn; var title=""; var date=""; var last=" \n";
  var file = this._sitedeltaDir(); file.append(fn); var name="";
  if(file.exists()) {
  var fstream = Cc["@mozilla.org/network/file-input-stream;1"].createInstance(Ci.nsIFileInputStream); 
  var is = Cc["@mozilla.org/intl/converter-input-stream;1"].createInstance(Ci.nsIConverterInputStream);
  fstream.init(file, -1, 0, 0); 
  is.init(fstream,"UTF-8",1024,0xFFFD); 
  var str={}; var lis = is.QueryInterface(Ci.nsIUnicharLineInputStream); var contentStarted=false; var xpath="/html/body[1]";
  do {
   var more=lis.readLine(str);
   var str2=str.value;
   if(!contentStarted && !str2.match(/^[a-zA-Z0-9]+:/)) contentStarted=true;
   if(contentStarted) {
    last+=str2;
   } else {
    if(str2.match(/^URL:/)) url=str2.replace(/^.*?:/,"");
    else if(str2.match(/^XPATH:/)) includes.push(str2.replace(/^.*?:/,""));
    else if(str2.match(/^EXCLUDE:/)) excludes.push(str2.replace(/^.*?:/,""));
    else if(str2.match(/^TITLE:/)) title=str2.replace(/^.*?:/,"");
    else if(str2.match(/^NAME:/)) name=str2.replace(/^.*?:/,"");
    else if(str2.match(/^DATE:/)) date=str2.replace(/^.*?:/,"");
   }
  } while(more);
  is.close(); fstream.close();
  }
  if(name=="" && url!=fn) name=url.replace(/^https?:\/\//i,"");
  if(includes.length==0) includes.push("/html/body[1]");
  var result={};
  result.includes=includes; result.name=name; result.excludes=excludes; result.status=this.RESULT_UNCHECKED;
  result.title=title; result.date=date; result.url=url; result.content=last;
  return result;
 },

 acceptNode: function(cur) {
  for(var i=0;i<this._excludes.length; i++) if(this._excludes[i]==cur) return Ci.nsIDOMNodeFilter.FILTER_REJECT;
  if(cur.nodeName=='SCRIPT' || cur.nodeName=='NOSCRIPT' || cur.nodeName=='STYLE') return Ci.nsIDOMNodeFilter.FILTER_REJECT;
  if(cur.nodeType==3 || (this._scanImages && cur.nodeName=='IMG')) return Ci.nsIDOMNodeFilter.FILTER_ACCEPT;
  return Ci.nsIDOMNodeFilter.FILTER_SKIP;
 },
 
 _walkTree: function(node, highlight, current, pos) {
   var insertElement=false, ret="", changes=0, currentpos=0, text="";
   var doc=node.ownerDocument;
   var page=this.getPage(doc.URL); 
   if(page.checkDeleted!=null) this._checkDeleted=page.checkDeleted; else this._checkDeleted=this.checkDeleted;
   if(page.scanImages!=null) this._scanImages=page.scanImages; else this._scanImages=this.scanImages;
   var last=page.content; 
   if(current!=null) {currentpos=1; } else {current=""; currentpos=-1; }
   
   var domactions=[];
   var tw=doc.createTreeWalker(node, Ci.nsIDOMNodeFilter.SHOW_ALL, this, true);
   while(cur=tw.nextNode()) {
    if(cur.nodeType==3 || (this._scanImages && cur.nodeName=='IMG')) {
     if(cur.nodeName=='IMG') text="["+cur.getAttribute("src") + "] "; else text=cur.data.replace(/\[/,"[ ")+" ";
     text=text.replace(/[ \t\n\r]+/g,' ');
     text=text.replace(/^ +/,'');
     text=text.replace(/ +$/,' ');
     ret+=text; 
     if(text!="" && text!=" ") {
      if(!this._checkDeleted) {
       if(last.indexOf(text)==-1) domactions.push({action: "add", node: cur});
      } else {
       while(last.charAt(pos)==' ' || last.charAt(pos)=="\n" ||  last.charAt(pos)=="\t") pos++;
       if(last.indexOf(text)==-1) { 
        // new text
        domactions.push({action: "add", node: cur});  
        if(!insertElement) insertElement=cur;
       } else if(last.indexOf(text,pos)==pos) { 
        // text unchanged
        pos+=text.length;
        insertElement=false;
       } else if(last.indexOf(text,pos)>pos) { 
        var missingtext= last.substring(pos, last.indexOf(text,pos));
        if(currentpos > 0 && current.indexOf(missingtext,currentpos) > 0 && 
         !(last.indexOf(current.substr(currentpos, missingtext.length+1), pos) > pos)) {
         // moved upwards
         domactions.push({action: "move", node: cur}); 
         if(!insertElement) insertElement=cur;
        } else {
         // text removed
         domactions.push({action: "remove", node: (insertElement?insertElement:cur), data: missingtext}); 
         insertElement=false; pos+=missingtext.length+text.length;
        }
       } else if(last.indexOf(text)<pos) { 
        // new text is already known before
        if(currentpos>0 && current.indexOf(text)<currentpos) {
         // copied
         domactions.push({action: "add", node: cur}); 
        } else {
         // moved
         domactions.push({action: "move", node: cur}); 
        }
        insertElement=cur;     
       }
      }
     }
     if(currentpos>0) currentpos+=text.length;
    }
   }
   if(currentpos>0 && this._checkDeleted) {
    if(currentpos>current.length) {
     if(pos+1<last.length) {
      var missingtext=last.substring(pos,last.length-1);
      if(missingtext.replace(/[ \t\n]/g,"")!="") {
       cur=node.ownerDocument.createElement("SPAN"); node.appendChild(cur);
       domactions.push({action: "remove", node: cur, data: missingtext});
       pos=last.length+1;
      }
     }
    }
   }

   if(highlight) { 
    for(var i=0; i<domactions.length; i++) {
     if(domactions[i].action=="add") this._DOMAdded(domactions[i].node, highlight, i);
     if(domactions[i].action=="move") this._DOMMoved(domactions[i].node, highlight, i);
     if(domactions[i].action=="remove") this._DOMRemoved(domactions[i].node, domactions[i].data, highlight, i);
    }
   } 
   changes+=domactions.length;
   return {text: ret, changes: changes, current: (current?current.substr(currentpos):null), pos: pos};
  },
  _DOMMoved: function(cur, highlight, nr) {
   while(cur.newElement) cur=cur.newElement;
   var hil=cur.ownerDocument.createElement("SPAN");
   hil.setAttribute("style","-moz-outline: dotted "+this.moveBorder+" 1px; background: "+this.moveBackground+"; color: #000;");
   hil.id="sitedelta-change" + nr;
   hil.appendChild(cur.cloneNode(true));
   cur.parentNode.replaceChild(hil,cur);
   cur.newElement=hil;
  }, 
  _DOMAdded: function(cur, highlight, nr) {
   while(cur.newElement) cur=cur.newElement;
   var hil=cur.ownerDocument.createElement("SPAN");
   hil.setAttribute("style","-moz-outline: dotted "+this.addBorder+" 1px; background: "+this.addBackground+"; color: #000;");
   hil.id="sitedelta-change" + nr;
   hil.appendChild(cur.cloneNode(true));
   cur.parentNode.replaceChild(hil,cur);
   cur.newElement=hil;
  }, 
  _DOMRemoved: function(cur,text,highlight,nr) {
   while(cur.newElement) cur=cur.newElement;
   var doc=cur.ownerDocument;
   var hil=doc.createElement("SPAN");
   var del=doc.createElement("DEL");
   del.setAttribute("style","-moz-outline: dotted "+this.removeBorder+" 1px; background: "+this.removeBackground+"; color: #000;");
   del.id="sitedelta-change" + nr;
   while(text.indexOf("[")!=-1) {
    del.appendChild(doc.createTextNode(text.substring(0,text.indexOf("["))));
    text=text.substr(text.indexOf("[")+1);
   if(text.charAt(0)==" ") {
    del.appendChild(doc.createTextNode("["));
   } else {
    var img=doc.createElement("IMG"); img.setAttribute("src", text.substring(0, text.indexOf("]")));
    img.style.MozOpacity="0.3"; del.appendChild(img);     
    text=text.substr(text.indexOf("]")+1);
   }
  }
  del.appendChild(doc.createTextNode(text));
  hil.appendChild(del);
  hil.appendChild(cur.cloneNode(true));
  cur.parentNode.replaceChild(hil,cur);
  cur.newElement=hil;
 },
 
//************************ HIDDEN PAGE LOAD *********************
 _watchCheckPage: function(result) {
  if(this._iframe) this._watchEndCheck();
  this._timer.cancel();  
  var windowMediator = Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator);
  var window = windowMediator.getMostRecentWindow("navigator:browser");
  if (!window) return this._watchEndCheck();
  var document = window.document;
  var rootElement = document.documentElement;
  this._iframe = document.createElement('iframe');
  this._iframe._svc=this;
  this._iframe.setAttribute("collapsed", true);
  this._iframe.setAttribute("type", "content");
  rootElement.appendChild(this._iframe);
  var webNav = this._iframe.docShell.QueryInterface(Ci.nsIWebNavigation);
  webNav.stop(Ci.nsIWebNavigation.STOP_NETWORK);
  var ds=this._iframe.docShell; ds.allowAuth=false; ds.allowImages=false; ds.allowJavascript=false; ds.allowMetaRedirects=false; ds.allowPlugins=false; ds.allowSubframes=false;
  var parseHandler = {
   _self: this, 
   handleEvent: function(event) {
   	event.target.removeEventListener("DOMContentLoaded", this, false);
    try { this._self._watchPageLoaded(event) } finally { this._self = null }
   }};  
  this._iframe.addEventListener("DOMContentLoaded", parseHandler, true);
  result.status=this.RESULT_CHECKING;
  this._observerService.notifyObservers(null, "sitedelta", result.url);  
  this._iframe.setAttribute("src", this.getURL(result));
  this._timer.initWithCallback(this, this.watchPageTimeout, this._timer.TYPE_ONE_SHOT);
 },
 _watchPageLoaded: function() {
  this._timer.cancel();
  this.scanPage(this._iframe.contentDocument);
  this._watchEndCheck();
 },
 _watchEndCheck: function() {
  if(this._iframe) {
   var webNav = this._iframe.docShell.QueryInterface(Ci.nsIWebNavigation);
   webNav.stop(Ci.nsIWebNavigation.STOP_NETWORK);
   if(this._iframe.parentNode) this._iframe.parentNode.removeChild(this._iframe);
   this._iframe=null;
   var result=this.getPage(this._pageNames[this._watchPage]);
   if(result.status==this.RESULT_CHECKING) {
    result.status=this.RESULT_NOTFOUND; 
    this._observerService.notifyObservers(null, "sitedelta", result.url);  
   }
  }
  this._timer.initWithCallback(this, this.watchPageDelay, this._timer.TYPE_ONE_SHOT);
 },
 _watchScanNext: function() {
  this._watchPage++;
  if(this._pageNames==null) this.listPages();
  if(this._watchPage>=this._pageNames.length) {
   this._watchPage=-1;
   this._timer.initWithCallback(this, this.watchScanDelay, this._timer.TYPE_ONE_SHOT);
  } else {
   var page=this.getPage(this._pageNames[this._watchPage]);
   if((page.status==this.RESULT_UNCHANGED || page.status==this.RESULT_UNCHECKED) && page.enableWatch!=false)
    this._watchCheckPage(page);
   else 
    this._timer.initWithCallback(this, 10, this._timer.TYPE_ONE_SHOT);  
  }
 },
//***************************************************************
 QueryInterface: function(aIID) {
  if (!aIID.equals(Ci.nsISupports) && !aIID.equals(Ci.nsIObserver) && !aIID.equals(Ci.nsIDOMNodeFilter))
   throw Components.results.NS_ERROR_NO_INTERFACE;
  return this;
 },

};

var SiteDeltaFactory = {
  createInstance: function (aOuter, aIID) {
    if (aOuter != null)
      throw Components.results.NS_ERROR_NO_AGGREGATION;
    return (new SiteDelta()).QueryInterface(aIID);
  }
};

var SiteDeltaModule = {
 registerSelf: function(aCompMgr, aFileSpec, aLocation, aType) {
  aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
  aCompMgr.registerFactoryLocation(CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType);
 },

 unregisterSelf: function(aCompMgr, aLocation, aType) {
  aCompMgr = aCompMgr.QueryInterface(Ci.nsIComponentRegistrar);
  aCompMgr.unregisterFactoryLocation(CLASS_ID, aLocation);        
 },
 
 getClassObject: function(aCompMgr, aCID, aIID) {
  if (!aIID.equals(Ci.nsIFactory)) throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
  if (aCID.equals(CLASS_ID)) return SiteDeltaFactory;
  throw Components.results.NS_ERROR_NO_INTERFACE;
 },

 canUnload: function(aCompMgr) {
  return true; 
 }
};

function NSGetModule(aCompMgr, aFileSpec) { return SiteDeltaModule; }
