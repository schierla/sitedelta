var sitedelta = {
  prefs: null,
  sitedeltaDir: function() { 
   file=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
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
    for(var i=this.value; i<result.includecount-1; i++) result.includes[i]=result.includes[i+1];
    result.includecount--;
   } else {
    for(var i=this.value; i<result.excludecount-1; i++) result.excludes[i]=result.excludes[i+1];
    result.excludecount--;
   }

   sitedelta.saveFile(fn+".dat", result);
  },
  saveFile: function(fn, data) {
   file = sitedelta.sitedeltaDir(); file.append(fn);
   var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
   var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
   foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); os.init(foStream,"UTF-8",4096,0x0000); 
   os.writeString("URL:"+data.url+"\n");
   for(var i=0;i<data.includecount; i++) os.writeString("XPATH:" + data.includes[i] + "\n");
   for(var i=0;i<data.excludecount; i++) os.writeString("EXCLUDE:" + data.excludes[i] + "\n");
   os.writeString("TITLE:" + data.title + "\n");
   os.writeString("DATE:" + data.date +"\n");
   os.writeString("\n");
   os.writeString(data.content);
   os.close(); foStream.close();
  },
  readFile: function(fn) {
   var includes={}; var includecount=0; var excludes={}; var excludecount=0; var url=fn; var title=""; var date=""; var last=" \n";
   file = sitedelta.sitedeltaDir(); file.append(fn);
   if(file.exists()) {
   var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream); 
   var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
   fstream.init(file, -1, 0, 0); 
   is.init(fstream,"UTF-8",1024,0xFFFD); 
   var str={}; lis = is.QueryInterface(Components.interfaces.nsIUnicharLineInputStream); var contentStarted=false; xpath="/html/body[1]";
   do {
    var more=lis.readLine(str);
    str2=str.value;
    if(!contentStarted && !str2.match(/^[a-zA-Z0-9]+:/)) contentStarted=true;
    if(contentStarted) {
     last+=str2;
    } else {
     if(str2.match(/^URL:/)) url=str2.replace(/^.*?:/,"");
     else if(str2.match(/^XPATH:/)) includes[includecount++]=str2.replace(/^.*?:/,"");
     else if(str2.match(/^EXCLUDE:/)) excludes[excludecount++]=str2.replace(/^.*?:/,"");
     else if(str2.match(/^TITLE:/)) title=str2.replace(/^.*?:/,"");
     else if(str2.match(/^DATE:/)) date=str2.replace(/^.*?:/,"");
    }
   } while(more);
   is.close(); fstream.close();
   }
   if(includecount==0) includes[includecount++]="/html/body[1]";
   var result=new Object();
   result.includes=includes; result.includecount=includecount;
   result.excludes=excludes; result.excludecount=excludecount;
   result.title=title; result.date=date; result.url=url; result.content=last;
   return result;
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
  },
  mouseover: function(e) {
   e.target.style.MozOutline="dotted red 2px";
   e.preventDefault();
   e.stopPropagation();
  },
  mouseout: function(e) {
   e.target.style.MozOutline="none";
   e.preventDefault();
   e.stopPropagation();
  },
  mouseclick: function(e) {
   var t=e.target;
   sitedelta.mouseout(e);
   e.preventDefault();
   e.stopPropagation();

   content.document.removeEventListener("mouseover", sitedelta.mouseover, true);
   content.document.removeEventListener("mousedown", sitedelta.preventevent, true);
   content.document.removeEventListener("mouseup", sitedelta.preventevent, true);
   content.document.removeEventListener("mouseout", sitedelta.mouseout, true);
   content.document.removeEventListener("click", sitedelta.mouseclick, true);

   if(e.button!=0) return;

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
   sitedelta.addXPathRegion(path);
  },
  preventevent: function(e) {
   e.preventDefault();
   e.stopPropagation();
  },
  selectRegion: function(e) {
   content.document.addEventListener("mouseover", sitedelta.mouseover, true);
   content.document.addEventListener("mousedown", sitedelta.preventevent, true);
   content.document.addEventListener("mouseup", sitedelta.preventevent, true);
   content.document.addEventListener("mouseout", sitedelta.mouseout, true);
   content.document.addEventListener("click", sitedelta.mouseclick, true);
   return false;
  },
  listRegions: function(menu) {
   url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   var cur=menu.firstChild;
   while(cur) {last=cur; cur=cur.nextSibling; if(last.regionEntry) menu.removeChild(last); }

   var includeSeparator=document.getElementById('sitedelta-scanregions');
   for(var i=0; i<result.includecount; i++) {
    var item = document.createElement("menuitem");
    item.setAttribute("label", result.includes[i]);
    item.value=i; item.regionEntry=1; item.addEventListener("mouseover", sitedelta.showOutline, false);
    item.addEventListener("mouseout", sitedelta.removeOutline, false);
    item.addEventListener("command", sitedelta.removeRegion, false);
    menu.insertBefore(item, includeSeparator);
   }

   var excludeSeparator=document.getElementById('sitedelta-ignoreregions');
   for(var i=0; i<result.excludecount; i++) {
    var item = document.createElement("menuitem");
    item.setAttribute("label", result.excludes[i]);
    item.value=i; item.regionEntry=2; item.addEventListener("mouseover", sitedelta.showOutline, false);
    item.addEventListener("mouseout", sitedelta.removeOutline, false);
    item.addEventListener("command", sitedelta.removeRegion, false);
    menu.insertBefore(item, excludeSeparator);
   }

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
    if(result.includecount==1 && result.includes[0]=="/html/body[1]") result.includecount--;
    result.includes[result.includecount++] = path;
   } else {
    result.excludes[result.excludecount++] = path;
   }
   sitedelta.saveFile(fn+".dat", result);
  },
  removeHighlight: function(e) {
   content.document.sitedeltaMatch=false;
   url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   
   var i=0; var c;
   while(c=content.document.getElementById("sitedelta-change"+(i++))) c.parentNode.replaceChild(c.firstChild, c);

   if(!sitedelta.prefs.getBoolPref("showRegions")) return;
   for(var i=0; i<result.includecount; i++) content.document.evaluate(result.includes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
   for(var i=0; i<result.excludecount; i++) content.document.evaluate(result.excludes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
  },
  showManager: function(e) {
   window.open("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "chrome,width=600,height=400,resizable=yes");
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
   url=content.window.location.href;
   fn=sitedelta._getFilename(url);

   var result=sitedelta.readFile(fn+".dat");
   sitedelta.last = result.content;

   sitedelta.changes=0; var text="";
   
   var showRegions=sitedelta.prefs.getBoolPref("showRegions");

   sitedelta.excludes={};
   for(var i=0;i<result.excludecount; i++) {
    sitedelta.excludes[i] = content.document.evaluate(result.excludes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
    if(showRegions) sitedelta.excludes[i].style.MozOutline="dotted "+sitedelta.prefs.getCharPref("excludeRegion")+" 2px;";
   }
   sitedelta.excludecount = result.excludecount;

   for(var i=0; i<result.includecount; i++) {
    xpath=result.includes[i];
    var startElement=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
    if(!startElement) {
     if(xpath!="/html/body[1]") xpath="/html/body[1]";
     startElement=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
    }
    if(!startElement) {alert("Content not found."); return; }

    if(showRegions) startElement.style.MozOutline="dotted "+sitedelta.prefs.getCharPref("includeRegion")+" 2px;";
    text+=sitedelta.walkTree(startElement, true);
   }
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
 
   for(var i=0;i<sitedelta.excludecount; i++) if(sitedelta.excludes[i]==node) return "";

   var cur=node.firstChild;
   while(cur) {
    if(cur.hasChildNodes() && cur.nodeName!='SCRIPT' && cur.nodeName!='NOSCRIPT' && cur.nodeName!='STYLE') {
     text=sitedelta.walkTree(cur, highlight);
     ret+=text;
    }
    if(cur.nodeType==3) {
     text=cur.data+" ";
     text=text.replace(/[ \t\n\r]+/g,' ');
     text=text.replace(/\</g,'< ');
     ret+=text;
      if(sitedelta.last.indexOf(text)==-1 && text!="" & text!=" ") {
       if(highlight) {
        hil=content.document.createElement("SPAN");
        hil.setAttribute("style","-moz-outline: dotted "+sitedelta.prefs.getCharPref("changeBorder")+" 1px; background: "+sitedelta.prefs.getCharPref("changeBackground")+"; color: #000;");
        hil.id="sitedelta-change" + (sitedelta.changes++);
        hil.appendChild(cur.cloneNode(true));
        cur.parentNode.replaceChild(hil,cur);
        cur=hil;
       } else {
        sitedelta.changes++;
       }
      }
     }
     cur=cur.nextSibling;
    }
    return ret;
   }
};
window.addEventListener("load", function(e) { sitedelta.onLoad(e); }, false);
