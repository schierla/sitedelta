var sitedelta = {
  prefs: null,
  sitedeltaDir: function() { 
   var file=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
   file.append("sitedelta");
   return file; 
  },
  showOutline: function() {
   var xpath=this.label;
   if(sitedelta.outlinedElement) removeOutline();
   var element=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
   if(!element) return;
   sitedelta.outlinedElement=element; sitedelta.outlinedElementStyle=element.style.MozOutline;
   element.style.MozOutline= (this.regionEntry==1?"dotted "+sitedelta.prefs.getCharPref("includeRegion")+" 2px;":"dotted "+sitedelta.prefs.getCharPref("excludeRegion")+" 2px;");
  },
  removeOutline: function() {
   if(sitedelta.outlinedElement) sitedelta.outlinedElement.style.MozOutline = sitedelta.outlinedElementStyle;
   sitedelta.outlinedElement=false;
  },
  removeRegion: function() {
   url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   result.url=url.replace(/#.*$/,'');
   if(this.regionEntry==1) {
    for(var i=this.value; i<result.includes.length-1; i++) result.includes[i]=result.includes[i+1];
    result.includes.pop();
   } else {
    for(var i=this.value; i<result.excludes.length-1; i++) result.excludes[i]=result.excludes[i+1];
    result.excludes.pop();
   }

   sitedelta.saveFile(fn+".dat", result);
  },
  saveFile: function(fn, data) {
   var file = sitedelta.sitedeltaDir(); file.append(fn);
   var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
   foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0);
   var doc = document.implementation.createDocument("", "", null);
   var root=doc.createElement("sitedelta");
   var elem=doc.createElement("url"); elem.appendChild(doc.createTextNode(data.url)); root.appendChild(elem);
   if(data.name!="") {elem=doc.createElement("name"); elem.appendChild(doc.createTextNode(data.name)); root.appendChild(elem); }
   for(var i=0;i<data.includes.length; i++) {
    elem=doc.createElement("include"); elem.appendChild(doc.createTextNode(data.includes[i])); root.appendChild(elem);
   }
   for(var i=0;i<data.excludes.length; i++) {
    elem=doc.createElement("exclude"); elem.appendChild(doc.createTextNode(data.excludes[i])); root.appendChild(elem);
   }   
   elem=doc.createElement("title"); elem.appendChild(doc.createTextNode(data.title)); root.appendChild(elem);
   elem=doc.createElement("date"); elem.appendChild(doc.createTextNode(data.date)); root.appendChild(elem);
   elem=doc.createElement("content"); elem.appendChild(doc.createTextNode(data.content)); root.appendChild(elem);
   doc.appendChild(root);
   var serializer = new XMLSerializer();
   serializer.serializeToStream(doc, foStream, "UTF-8");
   foStream.close();
  },
  saveFileOld: function(fn, data) {
   var file = sitedelta.sitedeltaDir(); file.append(fn);
   var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
   var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
   foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); os.init(foStream,"UTF-8",4096,0x0000); 
   os.writeString("URL:"+data.url+"\n");
   os.writeString("NAME:"+data.name+"\n");
   for(var i=0;i<data.includes.length; i++) os.writeString("XPATH:" + data.includes[i] + "\n");
   for(var i=0;i<data.excludes.length; i++) os.writeString("EXCLUDE:" + data.excludes[i] + "\n");
   os.writeString("TITLE:" + data.title + "\n");
   os.writeString("DATE:" + data.date +"\n");
   os.writeString("\n");
   os.writeString(data.content);
   os.close(); foStream.close();
  },
  readFile: function(fn) {
   var includes=new Array(); var excludes=new Array(); var url=fn; var title=""; var date=""; var last=" \n";
   var file = sitedelta.sitedeltaDir(); file.append(fn); var name="";
   if(file.exists()) {
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream); 
    fstream.init(file, -1, 0, 0); 
    var bufferedstream = Components.classes["@mozilla.org/network/buffered-input-stream;1"].createInstance(Components.interfaces.nsIBufferedInputStream);
    bufferedstream.init(fstream,4096); fstream = bufferedstream;

    var parser = new DOMParser(); var dom=false;
    dom = parser.parseFromStream(fstream, "UTF-8", -1, "text/xml")
    if(!dom || dom.firstChild.nodeName!="sitedelta") return sitedelta.readFileOld(fn);
    var elem=dom.firstChild.firstChild;
    while(elem) {
     if(elem.firstChild) {
      if(elem.nodeName=="url") url=elem.firstChild.data;
      else if(elem.nodeName=="include") includes.push(elem.firstChild.data);
      else if(elem.nodeName=="exclude") excludes.push(elem.firstChild.data);
      else if(elem.nodeName=="title") title=elem.firstChild.data;
      else if(elem.nodeName=="date") date=elem.firstChild.data;
      else if(elem.nodeName=="name") name=elem.firstChild.data;
      else if(elem.nodeName=="content") for(var n=elem.firstChild; n; n=n.nextSibling) last+=n.data;
     }
     elem=elem.nextSibling;
    }
    fstream.close();
   } else if(!/\.sitedelta-preset$/.test(fn)) {
    var presets=sitedelta.presetFiles();
    url=content.window.location.href;
    for(var i=0; i<presets.length; i++) {
     var preset=sitedelta.readFile(presets[i]);
     if(new RegExp("^" + preset.url.replace(/([\{\\\^\$\.\|\?\*\+\(\)])/g,"\\$&").replace(/\\\*/g,".*").replace(/\\\?/g,".") + "$").test(url)) {
      includes=preset.includes; excludes=preset.excludes;
      break;
     }
    }
   }
   if(name=="" && url!=fn) name=url.replace(/^https?:\/\//i,"");
   if(includes.length==0) includes.push("/html/body[1]");
   var result=new Object();
   result.includes=includes; result.name=name; result.excludes=excludes; 
   result.title=title; result.date=date; result.url=url; result.content= last;
   return result;
  }, 
  readFileOld: function(fn) {
   var includes=new Array(); var excludes=new Array(); var url=fn; var title=""; var date=""; var last=" \n";
   var file = sitedelta.sitedeltaDir(); file.append(fn); var name="";
   if(file.exists()) {
   var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream); 
   var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
   fstream.init(file, -1, 0, 0); 
   is.init(fstream,"UTF-8",1024,0xFFFD); 
   var str={}; var lis = is.QueryInterface(Components.interfaces.nsIUnicharLineInputStream); var contentStarted=false; var xpath="/html/body[1]";
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
   var result=new Object();
   result.includes=includes; result.name=name; result.excludes=excludes;
   result.title=title; result.date=date; result.url=url; result.content=last;
   return result;
  }, 
  presetFiles: function() {
   var file = sitedelta.sitedeltaDir(); 
   var entries=file.directoryEntries;
   var presets=new Array(); var i=0;
   while(entries.hasMoreElements()) {
    var entry = entries.getNext(); entry.QueryInterface(Components.interfaces.nsIFile); 
    if(/\.sitedelta-preset$/.test(entry.leafName)) presets[i++]=entry.leafName;
   }
   return presets;
  }, 
  newPreset: function(preset) {
   var nr=0; 
   while(true) {
    var file=sitedelta.sitedeltaDir(); 
    file.append(nr+".sitedelta-preset"); 
    if(file.exists()) nr++; else break; 
   }
   sitedelta.saveFile(nr+".sitedelta-preset", preset);
   return nr+".sitedelta-preset";
  },
  onLoad: function() {
    // initialization code
    sitedelta.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    sitedelta.prefs = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.sitedelta@schierla.de.");
    sitedelta.prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
    sitedelta.initialized = true;
    sitedelta.changes=0; 
    sitedelta.strings = document.getElementById("sitedelta-strings");

    var file = sitedelta.sitedeltaDir();
    if( !file.exists() || !file.isDirectory() ) {
      file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
    }
    gBrowser.addEventListener("load", sitedelta.pageLoad, true);
    var panel=gBrowser.mPanelContainer; panel.addEventListener("select", sitedelta.pageLoad, false);
  },
  pageLoad: function() {
   setTimeout(sitedelta.pageSelected, 100);
  },
  pageSelected: function() {
   var url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var icon=document.getElementById("sitedelta-status");
   if(file.exists()) icon.setAttribute("src", "chrome://sitedelta/skin/sitedelta-known.gif"); else icon.setAttribute("src", "chrome://sitedelta/skin/sitedelta.gif");
  },
  mouseover: function(e) {
   if(sitedelta.needText && !e.target.firstChild.data && (!e.target.id || e.target.id.substr(0,16)=="sitedelta-change")) return;
   e.target.style.MozOutline="dotted red 2px";
   e.preventDefault();
   e.stopPropagation();
  },
  mouseout: function(e) {
   if(e.target!=sitedelta.destelement) e.target.style.MozOutline="none";
   e.preventDefault();
   e.stopPropagation();
  },
  mousedown: function(e) {
   sitedelta.needText=true;
   sitedelta.destelement=e.target;
   e.target.style.MozOutline="solid green 2px;";
   e.preventDefault();
   e.stopPropagation();
  },
  mouseup: function(e) {
   sitedelta.mouseout(e);
   e.preventDefault();
   e.stopPropagation();
   
   sitedelta.destelement.style.MozOutline="none";

   content.document.removeEventListener("mouseover", sitedelta.mouseover, true);
   content.document.removeEventListener("mousedown", sitedelta.mousedown, true);
   content.document.removeEventListener("mouseup", sitedelta.mouseup, true);
   content.document.removeEventListener("mouseout", sitedelta.mouseout, true);
   content.document.removeEventListener("click", sitedelta.mouseclick, true);

   if(e.button!=0) return;

   sitedelta.needText=false;

   if(e.target!=sitedelta.destelement && (e.target.firstChild.data || e.target.id)) {

    var to=sitedelta.buildPath(sitedelta.destelement).split("/");
    var from=sitedelta.buildPath(e.target).split("/");
    var common="";
    for(var i=0; i<Math.min(to.length,from.length); i++) {common+="/"+to[i]; if(to[i]!=from[i]) break; }  
    common=common.substr(1);   

    if(e.target.id) {
     var xpath="//*[@id=\""+ e.target.id +"\"]";    
    } else {
     var data=new String(e.target.firstChild.data); var func="text()";
     if(data.replace(/[ \n\t\r]+/g," ").replace(/^ /,"").replace(/ $/,"") != data) {
      data=data.replace(/[ \n\t\r]+/g," ").replace(/^ /,"").replace(/ $/,""); func="normalize-space("+func+")";
     }
     if(data.replace(/"/,"'")!=data) {
      data=data.replace(/"/,"'"); func="translate("+func+",'\"',\"'\")";
     }
      
     var xpath="//"+e.target.nodeName+'['+func+'="' + data +'"]';
    }

    for(var j=i+1; j<from.length; j++) xpath+="/..";
    if(i<from.length) {
     var dest=content.document.evaluate(common, content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
     var e=content.document.evaluate(xpath, content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
     var j=1; var f=null;
     if(e!=dest) for(var j=1; j>0; j++) {
      var e=content.document.evaluate(xpath+"/following-sibling::"+dest.nodeName+"[position()="+j+"]", content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
      if(e==dest) {xpath+="/following-sibling::"+dest.nodeName+"[position()="+j+"]"; break; }
      var f=content.document.evaluate(xpath+"/preceding-sibling::"+dest.nodeName+"[position()="+j+"]", content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
      if(f==dest) {xpath+="/preceding-sibling::"+dest.nodeName+"[position()="+j+"]"; break; }
      if(!e && !f) {break;}
     }
    } else {
     i--; 
    }
    for(i=i+1; i<to.length; i++) xpath+="/"+to[i];
    sitedelta.addXPathRegion(xpath);
   } else {
    sitedelta.addXPathRegion(sitedelta.buildPath(sitedelta.destelement));
   }
  },
  buildPath: function(t) {
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
  preventevent: function(e) {
   e.preventDefault();
   e.stopPropagation();
  },
  selectRegion: function(e) {
   sitedelta.needText=false; sitedelta.destelement=null;
   content.document.addEventListener("mouseover", sitedelta.mouseover, true);
   content.document.addEventListener("mousedown", sitedelta.mousedown, true);
   content.document.addEventListener("mouseup", sitedelta.mouseup, true);
   content.document.addEventListener("mouseout", sitedelta.mouseout, true);
   content.document.addEventListener("click", sitedelta.preventevent, true);
   return false;
  },
  listPresets: function(menu) {
   var presets=sitedelta.presetFiles(); var url=menu.url; 
   var cur=menu.firstChild; while(cur) {last=cur; cur=cur.nextSibling; if(last.presetEntry) menu.removeChild(last); }
   for(var i=0; i<presets.length; i++) {
    var preset=sitedelta.readFile(presets[i]);
    var item=document.createElement("menuitem");
    item.setAttribute("label", preset.name);
    if(new RegExp("^" + preset.url.replace(/([\{\\\^\$\.\|\?\*\+\(\)])/g,"\\$&").replace(/\\\*/g,".*").replace(/\\\?/g,".") + "$").test(url)) 
     item.setAttribute("default", true);
    item.presetEntry=1; 
    item.value=presets[i]; item.addEventListener("command", sitedelta.loadPreset, false);
    menu.appendChild(item);
   }
  },
  loadPreset: function(e) {
   var url=this.parentNode.url; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   result.url=url.replace(/#.*$/,'');
   var preset=sitedelta.readFile(this.value);
   result.includes=preset.includes; result.excludes=preset.excludes;
   sitedelta.saveFile(fn+".dat", result);
  },
  listRegions: function(menu) {
   var url=content.window.location.href; var fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   var cur=menu.firstChild;
   while(cur) {last=cur; cur=cur.nextSibling; if(last.regionEntry) menu.removeChild(last); }

   var includeSeparator=document.getElementById('sitedelta-scanregions');
   for(var i=0; i<result.includes.length; i++) {
    var item = document.createElement("menuitem");
    item.setAttribute("label", result.includes[i]);
    item.value=i; item.regionEntry=1; item.addEventListener("mouseover", sitedelta.showOutline, false);
    item.addEventListener("mouseout", sitedelta.removeOutline, false);
    item.addEventListener("command", sitedelta.removeRegion, false);
    menu.insertBefore(item, includeSeparator);
   }

   var excludeSeparator=document.getElementById('sitedelta-ignoreregions');
   for(var i=0; i<result.excludes.length; i++) {
    var item = document.createElement("menuitem");
    item.setAttribute("label", result.excludes[i]);
    item.value=i; item.regionEntry=2; item.addEventListener("mouseover", sitedelta.showOutline, false);
    item.addEventListener("mouseout", sitedelta.removeOutline, false);
    item.addEventListener("command", sitedelta.removeRegion, false);
    menu.insertBefore(item, excludeSeparator);
   }

   var loadRegion=document.getElementById('sitedelta-load-preset');
   loadRegion.firstChild.url=url;
  },
  includeRegion: function(e) {
   sitedelta.regionAction=1; 
   sitedelta.selectRegion();
  },
  excludeRegion: function(e) {
   sitedelta.regionAction=2;
   sitedelta.selectRegion();
  },
  addXPathRegion: function(path) {
   url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   result.url=url.replace(/#.*$/,'');
   if(sitedelta.regionAction==1) {
    if(result.includes.length==1 && result.includes[0]=="/html/body[1]") result.includes.pop();
    result.includes.push(path);
   } else {
    result.excludes.push(path);
   }
   sitedelta.saveFile(fn+".dat", result);
  },
  removeHighlight: function(e) {
   content.document.sitedeltaMatch=false;
   url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   
   var i=0; var c;
   while((c=content.document.getElementById("sitedelta-change"+(i++)))!=null) c.parentNode.replaceChild(c.firstChild, c);

   if(!sitedelta.prefs.getBoolPref("showRegions")) return;
   for(var i=0; i<result.includes.length; i++) content.document.evaluate(result.includes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
   for(var i=0; i<result.excludes.length; i++) content.document.evaluate(result.excludes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
  },
  showManager: function(e) {
   window.openDialog("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "width=600,height=400,resizable=yes,centerscreen", "");
  },
  showManagerAndCheck: function(e) {
   window.openDialog("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "width=600,height=400,resizable=yes,centerscreen", "check");
  },
  _getFilename: function(url) {
   var fn=url; 
   fn=fn.replace(/^.*:\/\//, "");
   fn=fn.replace(/#.*$/, "");
   fn=fn.replace(/\./g,'-');
   fn=fn.replace(/\%[0-9A-Fa-f]{2}/g, "_");
   fn=fn.replace(/[^a-zA-Z0-9\.]+/g, "_");
   fn=fn.replace(/_$/, "");
   fn=fn.replace(/^_/, "");
   if(fn=='') fn='_default_';
   return fn;
  },
  highlightChanges: function(e) {
   if(e.button && e.button!=0) return;
   if(content.document.sitedeltaMatch) {
    if(!content.document.getElementById("sitedelta-change"+content.document.sitedeltaMatch))
     content.document.sitedeltaMatch=0;
    content.window.location.hash="#sitedelta-change"+content.document.sitedeltaMatch;
    content.document.sitedeltaMatch++;
    return;
   }
   var url=content.window.location.href;
   var fn=sitedelta._getFilename(url);

   var result=sitedelta.readFile(fn+".dat");
   sitedelta.last = result.content;

   var text="";
   
   var showRegions=sitedelta.prefs.getBoolPref("showRegions");

   sitedelta.excludes=new Array();
   for(var i=0;i<result.excludes.length; i++) {
    sitedelta.excludes.push(content.document.evaluate(result.excludes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext());
    if(sitedelta.excludes[i] && showRegions) sitedelta.excludes[i].style.MozOutline="dotted "+sitedelta.prefs.getCharPref("excludeRegion")+" 2px;";
   }
   var regions=new Array();
   for(var i=0; i<result.includes.length; i++) {
    var xpath=result.includes[i];
    var startElement=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
    if(!startElement) {
     if(xpath!="/html/body[1]") xpath="/html/body[1]";
     startElement=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
    }
    if(!startElement) {alert("Content not found."); return; }

    if(showRegions) startElement.style.MozOutline="dotted "+sitedelta.prefs.getCharPref("includeRegion")+" 2px;";
    regions.push(startElement);
   }
   sitedelta.changes=0; sitedelta.pos=0; sitedelta.currentpos=-1; 
   for(var i=0; i<regions.length; i++) 
    text+=sitedelta.walkTree(regions[i], false);
   sitedelta.current = text; sitedelta.changes=0; sitedelta.pos=0; 
   sitedelta.currentpos=1; sitedelta.insertElement=false;
   for(var i=0; i<regions.length; i++) 
    sitedelta.walkTree(regions[i], true);
   
   if(sitedelta.changes>0) {
    content.window.location.hash="#sitedelta-change0";
    content.document.sitedeltaMatch = 1; 
   }
   
   result.url=url.replace(/#.*$/,''); result.title=content.document.title.replace(/[\n\r]/g,' ');
   var date=new Date(); result.date=date.toLocaleString(); result.content = text;
   sitedelta.saveFile(fn+".dat", result);
  },
  walkTree: function(node, highlight) {
   var ret="";
   for(var i=0;i<sitedelta.excludes.length; i++) if(sitedelta.excludes[i]==node) return "";

   var cur=node.firstChild;
   while(cur) {
    var text="";
    if(cur.hasChildNodes() && cur.nodeName!='SCRIPT' && cur.nodeName!='NOSCRIPT' && cur.nodeName!='STYLE') {
     text=sitedelta.walkTree(cur, highlight);
     ret+=text;
    }
    var next=cur.nextSibling;
    if(cur.nodeType==3 || cur.nodeName=='IMG') {
     if(cur.nodeName=='IMG') text="["+cur.getAttribute("src") + "] "; else text=cur.data+" ";
     text=text.replace(/[ \t\n\r]+/g,' ');
     text=text.replace(/\</g,'< ');
     text=text.replace(/^ +/,'');
     text=text.replace(/ +$/,' ');
     ret+=text; 
     if(text!="" && text!=" ") {
      while(sitedelta.last.charAt(sitedelta.pos)==' ' || sitedelta.last.charAt(sitedelta.pos)=="\n") sitedelta.pos++;
      if(sitedelta.last.indexOf(text)==-1) { 
       // new text
       cur=sitedelta.DOMAdded(cur, highlight);
       if(!sitedelta.insertElement) sitedelta.insertElement=cur;
      } else if(sitedelta.last.indexOf(text,sitedelta.pos)==sitedelta.pos) { 
       // text unchanged
       sitedelta.pos+=text.length;
       sitedelta.insertElement=false;
      } else if(sitedelta.last.indexOf(text,sitedelta.pos)>sitedelta.pos) { 
       var missingtext= sitedelta.last.substring(sitedelta.pos, sitedelta.last.indexOf(text,sitedelta.pos));
       if(sitedelta.currentpos > 0 && 
          sitedelta.current.indexOf(missingtext,sitedelta.currentpos) > 0 && 
          !(sitedelta.last.indexOf(sitedelta.current.substr(sitedelta.currentpos, missingtext.length+1), sitedelta.pos) > sitedelta.pos)) {
        // moved upwards
        cur=sitedelta.DOMMoved(cur, highlight);
        if(!sitedelta.insertElement) sitedelta.insertElement=cur;
       } else {
        // text removed
        if(missingtext.replace(/[ \t\n]/g,"")!="") {
         sitedelta.DOMRemoved((sitedelta.insertElement?sitedelta.insertElement:cur), missingtext, highlight);
         sitedelta.pos+=missingtext.length+text.length; sitedelta.insertElement=false;
        }
       }
      } else if(sitedelta.last.indexOf(text)<sitedelta.pos) { 
       // new text is already known before
       if(sitedelta.currentpos>0 && sitedelta.current.indexOf(text)<sitedelta.currentpos) {
        // copied
        cur=sitedelta.DOMAdded(cur, highlight); 
       } else {
        // moved
        cur=sitedelta.DOMMoved(cur, highlight);
       }
       sitedelta.insertElement=cur;     
      }
     } else {
      sitedelta.pos+=text.length;
     }
     if(sitedelta.currentpos>0) { sitedelta.currentpos+=text.length; }
    }
    cur=next;
   }
   if(sitedelta.currentpos>0) {
    if(sitedelta.currentpos>sitedelta.current.length) {
     if(sitedelta.pos+1<sitedelta.last.length) {
      var missingtext=sitedelta.last.substring(sitedelta.pos,sitedelta.last.length-1);
      if(missingtext.replace(/[ \t\n]/g,"")!="") {
       cur=content.document.createElement("SPAN"); node.appendChild(cur);
       sitedelta.DOMRemoved(cur, missingtext, highlight);
       sitedelta.pos=sitedelta.last.length+1;
      }
     }
    }
   }
   return ret;
  },
  DOMMoved: function(cur, highlight) {
   sitedelta.changes++;
   if(highlight) {
    var hil=content.document.createElement("SPAN");
    hil.setAttribute("style","-moz-outline: dotted "+sitedelta.prefs.getCharPref("moveBorder")+" 1px; background: "+sitedelta.prefs.getCharPref("moveBackground")+"; color: #000;");
    hil.id="sitedelta-change" + (sitedelta.changes-1);
    hil.appendChild(cur.cloneNode(true));
    cur.parentNode.replaceChild(hil,cur);
    return hil;
   }
   return cur;
  }, 
  DOMAdded: function(cur, highlight) {
   sitedelta.changes++;
   if(highlight) {
    var hil=content.document.createElement("SPAN");
    hil.setAttribute("style","-moz-outline: dotted "+sitedelta.prefs.getCharPref("addBorder")+" 1px; background: "+sitedelta.prefs.getCharPref("addBackground")+"; color: #000;");
    hil.id="sitedelta-change" + (sitedelta.changes-1);
    hil.appendChild(cur.cloneNode(true));
    cur.parentNode.replaceChild(hil,cur);
    return hil;
   }
   return cur;
  }, 
  DOMRemoved: function(cur,text,highlight) {
   sitedelta.changes++;
   if(highlight) {
    var hil=content.document.createElement("SPAN");
    var del=content.document.createElement("DEL");
    del.setAttribute("style","-moz-outline: dotted "+sitedelta.prefs.getCharPref("removeBorder")+" 1px; background: "+sitedelta.prefs.getCharPref("removeBackground")+"; color: #000;");
    del.id="sitedelta-change" + (sitedelta.changes-1);
    del.appendChild(content.document.createTextNode(text));
    hil.appendChild(del);
    hil.appendChild(cur.cloneNode(true));
    cur.parentNode.replaceChild(hil,cur);
    return hil;
   } 
   return cur;
  }
};
window.addEventListener("load", function(e) { sitedelta.onLoad(e); }, false);
