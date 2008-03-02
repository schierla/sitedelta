var sitedeltaManager = {
onLoad: function() {
 var ds=document.getElementById("preview").docShell;
 ds.allowAuth=false; ds.allowImages=false; ds.allowJavascript=false; ds.allowMetaRedirects=false; ds.allowPlugins=false; ds.allowSubframes=false;
 sitedeltaManager.listPages();
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
getInfo: function(file, pages) {
 result=sitedelta.readFile(file);
 var item=pages.appendItem(result.url.replace(/^https?:\/\//i,""),file);
 item.setAttribute("class","listitem-iconic");
 item.setAttribute("crop","center");
},
showDetails: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 var xpath=""; var url=""; var title=""; var date=""; var last="";
 if(file) {
  var fn=file.value;
  result=sitedelta.readFile(fn);
  xpath=result.xpath; url=result.url; title=result.title; date=result.date; last=result.content;
 }
document.getElementById("title").value=title;
document.getElementById("url").value=url;
document.getElementById("date").value=date;
document.getElementById("content").value=last;
},
deletePage: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 if(!file) return;
 var fn=file.value;
 file = sitedelta.sitedeltaDir(); file.append(fn); file.remove(false);
 sitedeltaManager.listPages();
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
updateAll: function() {
 var list=document.getElementById("pages");
 for(var i=0; i<list.getRowCount(); i++) list.getItemAtIndex(i).setAttribute("status","");
 list.selectItem(list.getItemAtIndex(0));
 sitedeltaManager.updatePages();
},
updatePages: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 document.getElementById("pages").ensureElementIsVisible(file);
 sitedeltaManager.currentPage=file;
 if(!file) return;
 var fn=file.value;
 result=sitedelta.readFile(fn);
 document.getElementById("preview").addEventListener("load",sitedeltaManager.updatePage, true);
 document.getElementById("preview").addEventListener("error",sitedeltaManager.nextPage, true);
 document.getElementById("preview").setAttribute("src",result.url);
},
updatePage: function() {
 doc=document.getElementById("preview").contentDocument;
 sitedelta.last = result.content;
 sitedelta.changes=0; 
 sitedelta.excludes={};
 for(var i=0;i<result.excludecount; i++) {
  sitedelta.excludes[i] = doc.evaluate(result.excludes[i], doc, null, XPathResult.ANY_TYPE, null).iterateNext();
 }
 sitedelta.excludecount = result.excludecount;
 for(var i=0; i<result.includecount; i++) {
  xpath=result.includes[i];
  var startElement=doc.evaluate(xpath,doc,null,XPathResult.ANY_TYPE,null).iterateNext();
  if(!startElement) {
   if(xpath!="/html/body[1]") xpath="/html/body[1]";
   startElement=doc.evaluate(xpath,doc,null,XPathResult.ANY_TYPE,null).iterateNext();
  }
  if(!startElement) {sitedeltaManager.nextPage(); return; }
  sitedelta.walkTree(startElement, false);
 }
 if(sitedelta.changes>0) {
  sitedeltaManager.currentPage.setAttribute("status","changed");
 } else {
  sitedeltaManager.currentPage.setAttribute("status","unchanged");
 }
 sitedeltaManager.nextPage();
},
nextPage: function() {
 var list=document.getElementById("pages");
 var next=list.getNextItem(sitedeltaManager.currentPage, 1);
 list.selectItem(next);  if(next!=null) sitedeltaManager.updatePages();
}
}