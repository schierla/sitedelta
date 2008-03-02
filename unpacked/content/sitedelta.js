var sitedelta = {
  prefs: null,
  sitedeltaDir: function() { 
   var file=Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
   file.append("sitedelta");
   return file; 
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
  listPresets: function(menu, url) {
   var presets=sitedelta.presetFiles();
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
  listRegions: function(menu, url) {
   var fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   var cur=menu.firstChild;
   while(cur) {last=cur; cur=cur.nextSibling; if(last.regionEntry) menu.removeChild(last); }

   var includeSeparator=document.getElementById('sitedelta-scanregions');
   for(var i=0; i<result.includes.length; i++) {
    var item = document.createElement("menuitem");
    item.setAttribute("label", result.includes[i]);
    item.value=i; item.regionEntry=1; item.addEventListener("mouseover", sitedeltaOverlay.showOutline, false);
    item.addEventListener("mouseout", sitedeltaOverlay.removeOutline, false);
    item.addEventListener("command", sitedeltaOverlay.removeRegion, false);
    menu.insertBefore(item, includeSeparator);
   }

   var excludeSeparator=document.getElementById('sitedelta-ignoreregions');
   for(var i=0; i<result.excludes.length; i++) {
    var item = document.createElement("menuitem");
    item.setAttribute("label", result.excludes[i]);
    item.value=i; item.regionEntry=2; item.addEventListener("mouseover", sitedeltaOverlay.showOutline, false);
    item.addEventListener("mouseout", sitedeltaOverlay.removeOutline, false);
    item.addEventListener("command", sitedeltaOverlay.removeRegion, false);
    menu.insertBefore(item, excludeSeparator);
   }

   var loadRegion=document.getElementById('sitedelta-load-preset');
   loadRegion.firstChild.url=url;
  },
  addXPathRegion: function(path) {
   url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   result.url=url.replace(/#.*$/,'');
   if(result.name=="") result.name=content.document.title.replace(/[\n\r]/g,' ');
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

   var noB=false;
   if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
   if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

   if(!sitedelta.prefs.getBoolPref("showRegions")) return;
   for(var i=0; i<result.includes.length; i++) content.document.evaluate(result.includes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
   for(var i=0; i<result.excludes.length; i++) content.document.evaluate(result.excludes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext().style.MozOutline="";
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
  walkTree: function(node, highlight) {
   var ret="";
   for(var i=0;i<sitedelta.excludes.length; i++) if(sitedelta.excludes[i]==node) return "";
   var scanImages=sitedelta.prefs.getBoolPref("scanImages");
   var checkDeleted=sitedelta.prefs.getBoolPref("checkDeleted");

   var cur=node.firstChild;
   while(cur) {
    var text="";
    if(cur.hasChildNodes() && cur.nodeName!='SCRIPT' && cur.nodeName!='NOSCRIPT' && cur.nodeName!='STYLE') {
     text=sitedelta.walkTree(cur, highlight);
     ret+=text;
    }
    var next=cur.nextSibling;
    if(cur.nodeType==3 || (scanImages && cur.nodeName=='IMG')) {
     if(cur.nodeName=='IMG') text="["+cur.getAttribute("src") + "] "; else text=cur.data.replace(/\[/,"[ ")+" ";
     text=text.replace(/[ \t\n\r]+/g,' ');
     text=text.replace(/^ +/,'');
     text=text.replace(/ +$/,' ');
     ret+=text; 
     if(text!="" && text!=" ") {
      if(!checkDeleted) {
       if(sitedelta.last.indexOf(text)==-1) cur=sitedelta.DOMAdded(cur, highlight);
      } else {
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
      }
     } else {
      sitedelta.pos+=text.length;
     }
     if(sitedelta.currentpos>0) { sitedelta.currentpos+=text.length; }
    }
    cur=next;
   }
   if(sitedelta.currentpos>0 && checkDeleted) {
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
    while(text.indexOf("[")!=-1) {
     del.appendChild(content.document.createTextNode(text.substring(0,text.indexOf("["))));
     text=text.substr(text.indexOf("[")+1);
     if(text.charAt(0)==" ") {
      del.appendChild(content.document.createTextNode("["));
     } else {
      var img=content.document.createElement("IMG"); img.setAttribute("src", text.substring(0, text.indexOf("]")));
      img.style.MozOpacity="0.3"; del.appendChild(img);     
      text=text.substr(text.indexOf("]")+1);
     }
    }
    del.appendChild(content.document.createTextNode(text));
    hil.appendChild(del);
    hil.appendChild(cur.cloneNode(true));
    cur.parentNode.replaceChild(hil,cur);
    return hil;
   } 
   return cur;
  }
};
window.addEventListener("load", sitedelta.onLoad, false);
