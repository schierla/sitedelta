var sitedelta = {
  onLoad: function() {
    // initialization code
    sitedelta.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    sitedelta.initialized = true;
    sitedelta.lastfn=""; sitedelta.changes=0; sitedelta.setPath="";
    sitedelta.strings = document.getElementById("sitedelta-strings");

    var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile)
    file.append("sitedelta");
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

   content.document.removeEventListener("mouseover", sitedelta.mouseover, true);
   content.document.removeEventListener("mousedown", sitedelta.preventevent, true);
   content.document.removeEventListener("mouseup", sitedelta.preventevent, true);
   content.document.removeEventListener("mouseout", sitedelta.mouseout, true);
   content.document.removeEventListener("click", sitedelta.mouseclick, true);

   sitedelta.setPath=path;
   sitedelta.highlightChanges(e);
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
  removeHighlight: function(e) {
   for(var i=0;i<sitedelta.changes;i++) {
    var c=content.document.getElementById("sitedelta-change"+i);
    if(c) c.parentNode.replaceChild(c.firstChild, c);
   }
   sitedelta.changes=0; sitedelta.lastURL="";
  },
  showManager: function(e) {
   window.open("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "chrome,width=600,height=400");
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
   if(e.button!=0) return;
   if(sitedelta.setPath=="" && content.document.sitedeltaMatch) {
    if(!content.document.getElementById("sitedelta-change"+content.document.sitedeltaMatch))
     content.document.sitedeltaMatch=0;
    content.window.location.hash="#sitedelta-change"+content.document.sitedeltaMatch;
    content.document.sitedeltaMatch++;
    return;
   }
   url=content.window.location.href;
   fn=sitedelta._getFilename(url);

   var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
   file.append("sitedelta"); file.append(fn+".dat");

   var xpath="/html/body[1]";
   sitedelta.last =" \n";
   if(file.exists()) {
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream); 
    var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
    fstream.init(file, -1, 0, 0); 
    is.init(fstream,"UTF-8",1024,0xFFFD); 
    var str={}; var contentStarted=false;
    lis = is.QueryInterface(Components.interfaces.nsIUnicharLineInputStream);
    do {     
     var more=lis.readLine(str);
     str2=str.value;
     if(!contentStarted && !str2.match(/^[a-zA-Z0-9]+:/)) contentStarted=true;
     if(contentStarted) {
      sitedelta.last+=str2;
     } else {
      if(str2.match(/^URL:/)) {
      } else if(str2.match(/^XPATH:/)) {
       xpath=str2.substring(6);
      } else if(str2.match(/^TITLE:/)) {      
      } else if(str2.match(/^DATE:/)) {
      }
     }
    } while(more);
    is.close(); fstream.close();
   }
   if(sitedelta.setPath) {xpath=sitedelta.setPath; sitedelta.setPath=""; }
   var startElement=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
   if(!startElement) {
    if(xpath!="/html/body[1]") xpath="/html/body[1]";
    startElement=content.document.evaluate(xpath).iterateNext();
   }
   if(!startElement) {alert("Content not found."); return; }

   sitedelta.changes=0;
   if(xpath!="/html/body[1]") startElement.style.MozOutline="dotted red 2px;";
   var text=sitedelta.walkTree(startElement);
   
   if(sitedelta.changes>0) {
    content.window.location.hash="#sitedelta-change0";
    content.document.sitedeltaMatch = 1; 
   }

   var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
   var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
   foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); os.init(foStream,"UTF-8",4096,0x0000); 
   os.writeString("URL:"+url.replace(/#.*$/,'')+"\n");
   os.writeString("XPATH:" + xpath + "\n");
   os.writeString("TITLE:" + content.document.title.replace(/[\n\r]/g,' ') + "\n");
   var date=new Date(); os.writeString("DATE:" + date.toLocaleString()+"\n");
   os.writeString("\n");
   os.writeString(text);
   os.close(); foStream.close();
  },
  walkTree: function(node) {
   var ret="";
   var cur=node.firstChild;
   while(cur) {
    if(cur.hasChildNodes() && cur.nodeName!='SCRIPT' && cur.nodeName!='NOSCRIPT' && cur.nodeName!='STYLE') {
     text=sitedelta.walkTree(cur);
     ret+=text;
    }
    if(cur.nodeType==3) {
     text=cur.data+" ";
     text=text.replace(/[ \t\n\r]+/g,' ');
     text=text.replace(/\</g,'< ');
     ret+=text;
      if(sitedelta.last.indexOf(text)==-1 && text!="" & text!=" ") {
       hil=content.document.createElement("SPAN");
       hil.setAttribute("style","border: dotted red 1px; background: #ff8; color: #000;");
       hil.id="sitedelta-change" + (sitedelta.changes++);
       hil.appendChild(cur.cloneNode(true));
       cur.parentNode.replaceChild(hil,cur);
       cur=hil;
      }
     }
     cur=cur.nextSibling;
    }
    return ret;
   }
};
window.addEventListener("load", function(e) { sitedelta.onLoad(e); }, false);
