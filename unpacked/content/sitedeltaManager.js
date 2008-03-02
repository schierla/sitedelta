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
 sitedeltaManager.previews[1].addEventListener("load",function() {sitedeltaManager.updatePage(1); }, true);
 sitedeltaManager.previews[2].addEventListener("load",function() {sitedeltaManager.updatePage(2); }, true);
 sitedeltaManager.previews[3].addEventListener("load",function() {sitedeltaManager.updatePage(3); }, true);
 sitedeltaManager.previews[4].addEventListener("load",function() {sitedeltaManager.updatePage(4); }, true);
 
 sitedeltaManager.listPages();
 if(window.arguments && window.arguments[0]=="check") sitedeltaManager.updateAll();
 
 sitedeltaService.addObserver(sitedeltaManager);
 document.getElementById("extra").setAttribute("collapsed", !sitedeltaService.siteSettings);
},
listPresets: function(menu) {
 sitedelta.menuPresets(menu, document.currentPage.url);
},
listPages: function() {
 var pages=sitedeltaService.listPages();
 var list=document.getElementById("pages");
 while(list.getRowCount()>0) list.removeItemAt(0);
 
 for(var j=0; j<pages.length; j++) {
  var result=sitedeltaService.getPage(pages[j]);
  var after=-1;
  for(var i=0; i<list.getRowCount(); i++) if(list.getItemAtIndex(i) && list.getItemAtIndex(i).label>result.name) {after=i; break; }
  var item=(after==-1?list.appendItem(result.name,pages[j]):list.insertItemAt(after,result.name,pages[j]));
  item.setAttribute("class","listitem-iconic");
  item.setAttribute("crop","center");
  sitedeltaManager.setItemStatus(item, result.status);
 }
},
saveName: function() {
 if(document.currentPage==null) return;
 document.currentPage.name=document.getElementById("name").value;
 document.currentPageChanged=true;
// var file=document.getElementById("pages").getSelectedItem(0);
// var result=sitedeltaService.getPage(file.value);
// result.name=document.getElementById("name").value;
// sitedeltaService.putPage(result);
// file.label=document.getElementById("name").value;
},
showDetails: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 var xpath="", url="", title="", date="", last="", name="", user="", pass="",
 checkImages=null, checkDeleted=null, enableWatch=null, enableBackup=null;
 if(document.currentPageChanged && document.currentPage!=null) sitedeltaService.putPage(document.currentPage);
 document.currentPage=null; document.currentPageChanged=false;
 var result=null;
 document.getElementById("right").setAttribute("collapsed", "true");
 if(file) {
  result=sitedeltaService.getPage(file.value);
  xpath=result.xpath; url=result.url; title=result.title; date=result.date; last=result.content;
  name=result.name; checkDeleted=result.checkDeleted; checkImages=result.scanImages; 
  enableWatch=result.enableWatch; enableBackup=result.backupPage;
  user=result.user; pass=result.pass;
  document.getElementById("right").setAttribute("collapsed", "false");
 }
 document.getElementById("title").value=title;
 document.getElementById("url").value=url;
 document.getElementById("url").setAttribute("href", url);
 document.getElementById("date").value=date;
 document.getElementById("content").value=last;
 document.getElementById("name").value=name;
 sitedeltaManager.setCheckbox(document.getElementById("checkimages"), checkImages);
 sitedeltaManager.setCheckbox(document.getElementById("checkdeleted"), checkDeleted);
 sitedeltaManager.setCheckbox(document.getElementById("enablewatch"), enableWatch);
 sitedeltaManager.setCheckbox(document.getElementById("enablebackup"), enableBackup);
 document.getElementById("user").value=user;
 document.getElementById("pass").value=pass;
 document.getElementById("login").checked=(user!=""||pass!="");
 document.currentPage=result; 
},
updateUserPass: function() {
 if(document.currentPage==null) return;
 document.currentPage.user=document.getElementById("user").value;
 document.currentPage.pass=document.getElementById("pass").value;
 document.currentPageChanged=true;
},
updateCheckboxes: function() {
 if(document.currentPage==null) return;
 if(sitedeltaManager.getItemStatus(document.getElementById("checkimages"))!=document.currentPage.scanImages) {document.currentPage.scanImages=sitedeltaManager.getItemStatus(document.getElementById("checkimages")); document.currentPageChanged=true; }
 if(sitedeltaManager.getItemStatus(document.getElementById("checkdeleted"))!=document.currentPage.checkDeleted) {document.currentPage.checkDeleted=sitedeltaManager.getItemStatus(document.getElementById("checkdeleted")); document.currentPageChanged=true; }
 if(sitedeltaManager.getItemStatus(document.getElementById("enablewatch"))!=document.currentPage.enableWatch) {document.currentPage.enableWatch=sitedeltaManager.getItemStatus(document.getElementById("enablewatch")); document.currentPageChanged=true; }
 if(sitedeltaManager.getItemStatus(document.getElementById("enablebackup"))!=document.currentPage.backupPage) {document.currentPage.backupPage=sitedeltaManager.getItemStatus(document.getElementById("enablebackup")); document.currentPageChanged=true; } 
},
deletePage: function() {
 document.currentPage=null;
 var file=document.getElementById("pages").getSelectedItem(0);
 if(!file) return;
 sitedeltaService.deletePage(file.value);
},
deleteAll: function() {
 document.currentPage=null;
 var files=document.getElementById("pages");
 while(files.getRowCount()>0) {
  var url=files.getItemAtIndex(0).value;
  sitedeltaService.deletePage(url);
 }
},
updateCurrent: function() {
 var list=document.getElementById("pages");
 sitedeltaManager.nextItem=list.getSelectedItem(0);
 sitedeltaManager.nextItem.setAttribute("status", "");
 for(sitedeltaManager.nr=0; sitedeltaManager.previews[sitedeltaManager.nr].status!=0; sitedeltaManager.nr++);
 sitedeltaManager.loadNextPage();
 sitedeltaManager.nextItem=null;
},
updateAll: function() {
 var list=document.getElementById("pages");
 if(list.getRowCount()==0) return;
 sitedeltaManager.nextItem=list.getItemAtIndex(0);
 sitedeltaManager.nr=0;
 setTimeout("sitedeltaManager.loadNextPage();",30);
 setTimeout("sitedeltaManager.loadNextPage();",600);
 setTimeout("sitedeltaManager.loadNextPage();",900);
},
loadNextPage: function() {
 var file=sitedeltaManager.nextItem;
 if(file==null) return;
 sitedeltaManager.nextItem=document.getElementById("pages").getNextItem(file, 1);

 var nr=0; 
 for(var i=0; i<4; i++) if(sitedeltaManager.previews[i].status==0) {nr=i; break; }
 file.setAttribute("status","loading");
 var fn=file.value;
 var result=sitedeltaService.getPage(fn);

 sitedeltaManager.previews[nr].file = file;
 sitedeltaManager.previews[nr].status = 1;
 sitedeltaManager.previews[nr].result = result;
 if(sitedeltaManager.previews[nr].contentWindow.location==result.url) {
  sitedeltaManager.previews[nr].webNavigation.reload(0);
 } else {
  sitedeltaManager.previews[nr].setAttribute("src", sitedeltaService.getURL(result));
 }
},
updatePage: function(nr) {
 sitedeltaManager.previews[nr].status=2;
 var iframe=sitedeltaManager.previews[nr];
 var doc=iframe.contentDocument; 
 var changes=sitedeltaService.scanPage(doc);
 if(changes>0 && sitedeltaService.openChanged) {
  var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
  var wnd = wm.getMostRecentWindow("navigator:browser"); 
  if(wnd) wnd.getBrowser().addTab(iframe.result.url); else window.open(iframe.result.url);  
 }
 iframe.status=0; setTimeout(sitedeltaManager.loadNextPage,100);
},
errorPage: function(nr) {
 sitedeltaManager.previews[nr].status=0; sitedeltaManager.loadNextPage();
},
showPresets: function() {
 window.openDialog("chrome://sitedelta/content/sitedeltaPreset.xul", "sitedelta-preset", "width=600,height=400,resizable=yes,centerscreen", "");
},
savePreset: function() {
 var file=document.getElementById("pages").getSelectedItem(0);
 if(!file) return;
 var result=sitedeltaService.getPage(file.value);
 var preset={}; preset.url=result.url; preset.name=result.name; preset.includes=result.includes; preset.excludes=result.excludes; preset.user=""; preset.pass="";
 preset.date=""; preset.title=""; preset.content="";
 fn=sitedeltaService.newPreset(preset);
 window.openDialog("chrome://sitedelta/content/sitedeltaPreset.xul", "sitedelta-preset", "width=600,height=400,resizable=yes,centerscreen", fn);
},
 observe: function(aSubject, aTopic, aData) {
  if (aTopic == "sitedelta") {
   var result=sitedeltaService.getPage(aData);
   if(result.status==-1) {
    if(document.currentPage && document.currentPage.url==result.url) {document.currentPage=null; document.getElementById("right").setAttribute("collapsed", "true"); }
    var pages=document.getElementById("pages");
    for(var i=0; i<pages.getRowCount(); i++) {
     if(pages.getItemAtIndex(i).value==result.url) 
      pages.removeItemAt(i);
    }
   } else {
    if(document.currentPage && result.url==document.currentPage.url) {document.currentPage=null; sitedeltaManager.showDetails(); }
    var pages=document.getElementById("pages");
    var after=-1; 
    for(var i=0; i<pages.getRowCount(); i++) {
     if(pages.getItemAtIndex(i).label>result.name && after==-1) {after=i; }
     if(pages.getItemAtIndex(i).value==result.url) {pages.getItemAtIndex(i).label=result.name; sitedeltaManager.setItemStatus(pages.getItemAtIndex(i), result.status); return; }
    }
    var item=(after==-1?pages.appendItem(result.name,result.url):pages.insertItemAt(after,result.name,result.url));
    item.setAttribute("class","listitem-iconic");
    item.setAttribute("crop","center");
    sitedeltaManager.setItemStatus(item, result.status);
   }
  }
 },
 setItemStatus: function(item,status) {
  var stat="changed";
  switch(status) {
   case sitedeltaService.RESULT_CHECKING: stat="loading"; break;
   case sitedeltaService.RESULT_UNCHECKED: stat=""; break;
   case sitedeltaService.RESULT_NEW: stat=""; break;
   case sitedeltaService.RESULT_NOTFOUND: stat="error"; break;
   case sitedeltaService.RESULT_UNCHANGED: stat="unchanged";
  }
  item.setAttribute("status", stat);
 },
 getItemStatus: function(item) {
  switch(item.selectedIndex) {
  	case 0: return null;
  	case 1: return true;
  	case 2: return false;
  }
 },
 setCheckbox: function(item, value) {
  if(value==null) item.selectedIndex=0;
  else if(value==false) item.selectedIndex=2;
  else if(value==true) item.selectedIndex=1;
 },
 save: function() {
  if(document.currentPageChanged && document.currentPage!=null) sitedeltaService.putPage(document.currentPage); 	
  document.currentPage=null; 
 },
 onUnLoad: function() {
  sitedeltaManager.save();
  sitedeltaService.removeObserver(sitedeltaManager);
 }
}

window.addEventListener("load", sitedeltaManager.onLoad, false);
window.addEventListener("unload", sitedeltaManager.onUnLoad, false);
