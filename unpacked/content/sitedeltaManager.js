var sitedeltaManager = {
onLoad: function() {
 sitedeltaManager.previews={};
 sitedeltaManager.nr=0;
 for(var i=0;i<=4;i++) {
  sitedeltaManager.previews[i] = document.getElementById("preview"+i);
  sitedeltaManager.previews[i].status=0;
  var ds=sitedeltaManager.previews[i].docShell;
  ds.allowAuth=false; ds.allowImages=false; ds.allowJavascript=false; ds.allowMetaRedirects=false; ds.allowPlugins=false; ds.allowSubframes=false;
 }

 sitedeltaManager.previews[0].addEventListener("load",function() {sitedeltaManager.updatePage(0); }, true);
 sitedeltaManager.previews[0].addEventListener("error",function() {sitedeltaManager.errorPage(0); }, true);
 sitedeltaManager.previews[1].addEventListener("load",function() {sitedeltaManager.updatePage(1); }, true);
 sitedeltaManager.previews[1].addEventListener("error",function() {sitedeltaManager.errorPage(1); }, true);
 sitedeltaManager.previews[2].addEventListener("load",function() {sitedeltaManager.updatePage(2); }, true);
 sitedeltaManager.previews[2].addEventListener("error",function() {sitedeltaManager.errorPage(2); }, true);
 sitedeltaManager.previews[3].addEventListener("load",function() {sitedeltaManager.updatePage(3); }, true);
 sitedeltaManager.previews[3].addEventListener("error",function() {sitedeltaManager.errorPage(3); }, true);
 sitedeltaManager.previews[4].addEventListener("load",function() {sitedeltaManager.updatePage(4); }, true);
 sitedeltaManager.previews[4].addEventListener("error",function() {sitedeltaManager.errorPage(4); }, true);

 sitedeltaManager.listPages();
 if(window.arguments[0]=="check") sitedeltaManager.updateAll();
},
listPresets: function(menu) {
 sitedelta.listPresets(menu, menu.url);
},
listPages: function() {
 var file = sitedelta.sitedeltaDir(); 
 var entries=file.directoryEntries;
 var list=document.getElementById("pages");
 while(list.getRowCount()>0) list.removeItemAt(0);
 while(entries.hasMoreElements()) {
  var entry = entries.getNext(); entry.QueryInterface(Components.interfaces.nsIFile); sitedeltaManager.getInfo(entry.leafName, list);
 }
},
saveName: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 var result=sitedelta.readFile(file.value);
 result.name=document.getElementById("name").value;
 sitedelta.saveFile(file.value,result);
 file.label=document.getElementById("name").value;
},
getInfo: function(file, pages) {
 if(!/\.dat$/.test(file)) return;
 var result=sitedelta.readFile(file);
 if(result) {
  var after=-1;
  for(var i=0; i<pages.getRowCount(); i++) if(pages.getItemAtIndex(i) && pages.getItemAtIndex(i).label>result.name) {after=i; break; }
  var item=(after==-1?pages.appendItem(result.name,file):pages.insertItemAt(after,result.name,file));
  item.setAttribute("class","listitem-iconic");
  item.setAttribute("crop","center");
 }
},
showDetails: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 var xpath=""; var url=""; var title=""; var date=""; var last=""; var name="";
 if(file) {
  var fn=file.value;
  var result=sitedelta.readFile(fn);
  xpath=result.xpath; url=result.url; title=result.title; date=result.date; last=result.content;
  name=result.name;
 }
document.getElementById("title").value=title;
document.getElementById("url").value=url;
document.getElementById("date").value=date;
document.getElementById("content").value=last;
document.getElementById("name").value=name;
document.getElementById("regions").firstChild.url=url;
document.getElementById("name").disabled=false;
document.getElementById("regions").disabled=false;
},
deletePage: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 if(!file) return;
 var fn=file.value;
 file = sitedelta.sitedeltaDir(); file.append(fn); file.remove(false);
 var list=document.getElementById("pages");
 list.removeItemAt(list.selectedIndex);
},
deleteAll: function() {
 var files=document.getElementById("pages");
 while(files.getRowCount()>0) {
 var fn=files.getItemAtIndex(0).value;
 var file = sitedelta.sitedeltaDir(); file.append(fn); file.remove(false);
 files.removeItemAt(0);
 }
 sitedeltaManager.listPages();
},
updateCurrent: function() {
 var list=document.getElementById("pages");
 sitedeltaManager.nextItem=list.getSelectedItem(0);
 sitedeltaManager.nextItem.setAttribute("status", "");
 for(sitedeltaManager.nr=0; sitedeltaManager.previews[sitedeltaManager.nr].status!=0; sitedeltaManager.nr++);
 sitedeltaManager.loadNextPage(sitedeltaManager.nr);
 sitedeltaManager.nextItem=null;
},
updateAll: function() {
 var list=document.getElementById("pages");
 for(var i=0; i<list.getRowCount(); i++) list.getItemAtIndex(i).setAttribute("status","");
 sitedeltaManager.nextItem=list.getItemAtIndex(0);
 sitedeltaManager.nr=0;
 setTimeout("sitedeltaManager.loadNextPage(0);",30);
 setTimeout("sitedeltaManager.loadNextPage(1);",600);
 setTimeout("sitedeltaManager.loadNextPage(2);",900);
},
loadNextPage: function(nr) {
 var file=sitedeltaManager.nextItem;
 if(file==null) return;
 sitedeltaManager.nextItem=document.getElementById("pages").getNextItem(file, 1);

 file.setAttribute("status","loading");
 var fn=file.value;
 var result=sitedelta.readFile(fn);

 sitedeltaManager.previews[nr].file = file;
 sitedeltaManager.previews[nr].status = 0;
 sitedeltaManager.previews[nr].result = result;
 if(sitedeltaManager.previews[nr].contentWindow.location==result.url) {
  sitedeltaManager.previews[nr].webNavigation.reload(0);
 } else {
  sitedeltaManager.previews[nr].setAttribute("src", result.url);
 }
},
syncCheck: function() {
 sitedeltaManager.repeat=true;
 if(sitedeltaManager.synchronized) {return; }
 sitedeltaManager.synchronized=true;
 sitedeltaManager.repeat=false;
 for(var dummy=0; dummy<=4; dummy++) {
  sitedeltaManager.nr = (sitedeltaManager.nr+1) % 4;
  var nr=sitedeltaManager.nr;
  if(sitedeltaManager.previews[nr].status==1) {
   sitedeltaManager.repeat=true;
   var iframe=sitedeltaManager.previews[nr];
   iframe.status=2;
   var doc=iframe.contentDocument; 
   var result=iframe.result;
   sitedelta.last = result.content; sitedelta.changes=0; sitedelta.pos=0; sitedelta.currentpos=-1;
   sitedelta.excludes=new Array();
   for(var i=0;i<result.excludes.length; i++) {
    sitedelta.excludes.push(doc.evaluate(result.excludes[i], doc, null, XPathResult.ANY_TYPE, null).iterateNext());
   }
   for(var i=0; i<result.includes.length; i++) {
    xpath=result.includes[i];
    var startElement=doc.evaluate(xpath,doc,null,XPathResult.ANY_TYPE,null).iterateNext();
    if(!startElement) {
     if(xpath!="/html/body[1]") xpath="/html/body[1]";
     startElement=doc.evaluate(xpath,doc,null,XPathResult.ANY_TYPE,null).iterateNext();
    }
    if(!startElement) {iframe.file.setAttribute("status","error"); break;}
    sitedelta.walkTree(startElement, false);
   }
   if(sitedelta.changes>0) {
    iframe.file.setAttribute("status","changed");
    if(sitedelta.prefs.getBoolPref("openChanged")) {
     var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
     var wnd = wm.getMostRecentWindow("navigator:browser"); 
     if(wnd) wnd.getBrowser().addTab(iframe.result.url); else window.open(iframe.result.url);
    }
   } else {
    iframe.file.setAttribute("status","unchanged");
   }
   iframe.status=0; setTimeout("sitedeltaManager.loadNextPage("+nr+");",100);
   break;
  }
 }
 sitedeltaManager.synchronized=false;
 if(sitedeltaManager.repeat) setTimeout("sitedeltaManager.syncCheck", 100);
},
updatePage: function(nr) {
 sitedeltaManager.previews[nr].file.setAttribute("status","checking");
 sitedeltaManager.previews[nr].status=1;
 sitedeltaManager.syncCheck();
},
errorPage: function(nr) {
 sitedeltaManager.previews[nr].file.setAttribute("status","error");
 sitedeltaManager.previews[nr].status=0; sitedetlaManager.loadNextPage(nr);
},
showPresets: function() {
 window.openDialog("chrome://sitedelta/content/sitedeltaPreset.xul", "sitedelta-preset", "width=600,height=400,resizable=yes,centerscreen", "");
},
savePreset: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 if(!file) return;
 var fn=file.value;
 var result=sitedelta.readFile(fn);
 var preset={}; preset.url=result.url; preset.name=result.name; preset.includes=result.includes; preset.excludes=result.excludes;
 fn=sitedelta.newPreset(preset);
 window.openDialog("chrome://sitedelta/content/sitedeltaPreset.xul", "sitedelta-preset", "width=600,height=400,resizable=yes,centerscreen", fn);
}
}