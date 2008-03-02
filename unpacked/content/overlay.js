var sitedelta = {
  onLoad: function() {
    // initialization code
    this.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
    this.initialized = true;
    this.strings = document.getElementById("sitedelta-strings");

    var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile)
    file.append("sitedelta");
    if( !file.exists() || !file.isDirectory() ) {
      file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0664);
    }
  },
  onStatusBarButton: function(e) {
   var body=content.document.getElementsByTagName("body")[0];
   if(!body) {alert("Inhalt nicht gefunden. \nVielleicht sind Frames im Spiel - verwenden Sie dann bitte Aktueller Frame=>Nur diesen Frame anzeigen und versuchen Sie es erneut."); return; }
   var url=content.window.location.href; 
   url=url.replace(/^.*:\/\//, "");
   url=url.replace(/\./g,'-');
   url=url.replace(/\%[0-9A-Fa-f]{2}/g, "_");
   url=url.replace(/[^a-zA-Z0-9\.]/g, "_");
   url=url.replace(/_+/g,'_');
   url=url.replace(/_$/, "");
   url=url.replace(/^_/, "");
   if(url=='') url='_default_';

   var file = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties).get("ProfD", Components.interfaces.nsIFile);
   file.append("sitedelta"); file.append(url+".dat");

   last=" \n ";
   if(file.exists()) {
    var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream); var is = Components.classes["@mozilla.org/intl/converter-input-stream;1"].createInstance(Components.interfaces.nsIConverterInputStream);
    fstream.init(file, -1, 0, 0); is.init(fstream,"UTF-8",1024,0xFFFD); var str={}; var numChars = is.readString(4096,str); while (numChars > 0) {last += str.value; numChars = is.readString(4096,str); } is.close(); fstream.close();
   }

   var text=this.walkTree(body);

   var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
   var os = Components.classes["@mozilla.org/intl/converter-output-stream;1"].createInstance(Components.interfaces.nsIConverterOutputStream);
   foStream.init(file, 0x02 | 0x08 | 0x20, 0664, 0); os.init(foStream,"UTF-8",4096,0x0000); os.writeString(text); os.close(); foStream.close();
  },
  walkTree: function(node) {
   var ret="";
   var cur=node.firstChild;
   while(true) {
    if(cur.hasChildNodes() && cur.nodeName!='SCRIPT' && cur.nodeName!='NOSCRIPT' && cur.nodeName!='STYLE') {
     text=this.walkTree(cur);
     ret+=text;
    }
    if(cur.nodeType==3) {
     text=cur.data+" ";
     text=text.replace(/[ \t\n]+/g,' ');
     text=text.replace(/\</g,'< ');
     ret+=text;
      if(last.indexOf(text)==-1 && text!="") {
       hil=document.createElement("span");
       hil.style.display="inline";
       hil.style.border="dotted red 1px;";
       hil.style.background="#ff8";
       hil.appendChild(cur.cloneNode(true));
       cur.parentNode.replaceChild(hil,cur);
       cur=hil;
      }
     }
     cur=cur.nextSibling;
     if(cur==null) break;
    }
    return ret;
   }
};
window.addEventListener("load", function(e) { sitedelta.onLoad(e); }, false);
