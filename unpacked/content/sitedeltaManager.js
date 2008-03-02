var sitedeltaManager = {
strings: null,
onLoad: function() {
 sitedeltaManager.strings = document.getElementById("sitedelta-strings");
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
 
 var list=document.getElementById("sitedeltaPages");
 list.database.AddDataSource(sitedeltaService.RDF);
 list.builder.rebuild(); 
 for(var item=list.firstChild; item!=null; item=item.nextSibling) if(window.arguments && window.arguments[0]==item.id) list.selectItem(item); 

 if(window.arguments && window.arguments[0]=="check") sitedeltaManager.updateAll();
 document.getElementById("extra").setAttribute("collapsed", !sitedeltaService.siteSettings);
},
listPresets: function(menu) {
 sitedelta.menuPresets(menu, document.currentPage.url);
},
saveName: function() {
 if(document.currentPage==null) return;
 document.currentPage.name=document.getElementById("name").value;
 document.currentPageChanged=true;
},
showDetails: function() {
 var file=document.getElementById("sitedeltaPages").getSelectedItem(0);
 var xpath="", url="", title="", date="", last="", name="", user="", pass="",
 checkImages=null, checkDeleted=null, watchDelay=0, enableBackup=null, ignoreCase=null, ignoreNumbers=null;
 if(document.currentPageChanged && document.currentPage!=null) sitedeltaService.putPage(document.currentPage);
 document.currentPage=null; document.currentPageChanged=false;
 var result=null;
 document.getElementById("right").setAttribute("collapsed", "true");
 if(file) {
  result=sitedeltaService.getPage(file.id);
  xpath=result.xpath; url=result.url; title=result.title; date=result.date; last=result.content;
  name=result.name; checkDeleted=result.checkDeleted; checkImages=result.scanImages; 
  watchDelay=result.watchDelay; enableBackup=result.backupPage; ignoreNumbers=result.ignoreNumbers;
  ignoreCase=result.ignoreCase;
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
 var ew=document.getElementById("enablewatch"), wd=document.getElementById("watchdelay");
 if(watchDelay==0) {ew.selectedIndex=0; wd.disabled= true; wd.value=""; }
 else if(watchDelay==-1) {ew.selectedIndex=2; wd.disabled= true; wd.value=""; }
 else {ew.selectedIndex=1; wd.disabled= false; wd.value=watchDelay; }
 sitedeltaManager.setCheckbox(document.getElementById("enablebackup"), enableBackup);
 sitedeltaManager.setCheckbox(document.getElementById("ignorenumbers"), ignoreNumbers);
 sitedeltaManager.setCheckbox(document.getElementById("ignorecase"), ignoreCase);

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
 document.currentPageChanged=true; 
 if(sitedeltaManager.getItemStatus(document.getElementById("checkimages"))!=document.currentPage.scanImages) {document.currentPage.scanImages=sitedeltaManager.getItemStatus(document.getElementById("checkimages")); }
 if(sitedeltaManager.getItemStatus(document.getElementById("checkdeleted"))!=document.currentPage.checkDeleted) {document.currentPage.checkDeleted=sitedeltaManager.getItemStatus(document.getElementById("checkdeleted")); }
 if(sitedeltaManager.getItemStatus(document.getElementById("enablewatch"))==true) {
  if(document.getElementById("watchdelay").value=="") {document.getElementById("watchdelay").disabled=false; document.getElementById("watchdelay").value= Math.floor(sitedeltaService.watchScanDelay/60000); document.getElementById("watchdelay").focus();} 
  document.currentPage.watchDelay = document.getElementById("watchdelay").value;
 } else {
  document.getElementById("watchdelay").disabled=true; document.getElementById("watchdelay").value=""; document.currentPage.watchDelay=document.getElementById("enablewatch").selectedIndex==0?0:-1;
 }
 if(sitedeltaManager.getItemStatus(document.getElementById("enablebackup"))!=document.currentPage.backupPage) {document.currentPage.backupPage=sitedeltaManager.getItemStatus(document.getElementById("enablebackup")); } 
 if(sitedeltaManager.getItemStatus(document.getElementById("ignorecase"))!=document.currentPage.ignoreCase) {document.currentPage.ignoreCase=sitedeltaManager.getItemStatus(document.getElementById("ignorecase")); } 
 if(sitedeltaManager.getItemStatus(document.getElementById("ignorenumbers"))!=document.currentPage.ignoreNumbers) {document.currentPage.ignoreNumbers=sitedeltaManager.getItemStatus(document.getElementById("ignorenumbers")); } 
},
deletePage: function() {
 document.currentPage=null;
 var file=document.getElementById("sitedeltaPages").getSelectedItem(0);
 if(!file) return;
 sitedeltaService.deletePage(file.id);
},
deleteAll: function() {
 var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"].getService(Components.interfaces.nsIPromptService);
 if(!prompts.confirm(this, "SiteDelta", sitedeltaManager.strings.getString("confirmDeleteAll"))) return;	
 document.curentPage=null;
 var files=document.getElementById("sitedeltaPages");
 while(files.getRowCount()>0) {
  var url=files.getItemAtIndex(0).id;
  sitedeltaService.deletePage(url);
 }
},
updateCurrent: function() {
 var list=document.getElementById("sitedeltaPages");
 sitedeltaManager.nextItem=list.getSelectedItem(0);
 for(sitedeltaManager.nr=0; sitedeltaManager.previews[sitedeltaManager.nr].status!=0; sitedeltaManager.nr++);
 sitedeltaManager.loadNextPage();
 sitedeltaManager.nextItem=null;
},
updateAll: function() {
 var list=document.getElementById("sitedeltaPages");
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
 sitedeltaManager.nextItem=document.getElementById("sitedeltaPages").getNextItem(file, 1);

 var nr=0; 
 for(var i=0; i<4; i++) if(sitedeltaManager.previews[i].status==0) {nr=i; break; }
 var fn=file.id;
 var result=sitedeltaService.getPage(fn);

 sitedeltaManager.previews[nr].file = file;
 sitedeltaManager.previews[nr].status = 1;
 sitedeltaManager.previews[nr].result = result;
 result.status=-3;
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
 sitedelta.showPresets("");
},
savePreset: function() {
 var file=document.getElementById("sitedeltaPages").getSelectedItem(0);
 if(!file) return;
 var result=sitedeltaService.getPage(file.id);
 var preset={}; preset.url=result.url; preset.name=result.name; preset.includes=result.includes; preset.excludes=result.excludes; preset.user=""; preset.pass="";
 preset.ignoreCase=result.ignoreCase; preset.ignoreNumbers=result.ignoreNumbers; preset.checkDeleted=result.checkDeleted; preset.scanImages=result.scanImages;
 preset.date=""; preset.title=""; preset.content="";
 fn=sitedeltaService.newPreset(preset);
 sitedelta.showPresets(fn);
},
 getItemStatus: function(item) {
  switch(item.selectedIndex) {
  	case 0: return null;
  	case 1: return true;
  	case 2: return false;
  }
  return null;
 },
 setCheckbox: function(item, value) {
  if(value==null) item.selectedIndex=0;
  else if(value==false) item.selectedIndex=2;
  else if(value==true) item.selectedIndex=1;
 },
 save: function() {
  if(document.currentPageChanged && document.currentPage!=null) sitedeltaService.putPage(document.currentPage); 	
  document.currentPage=null; 
 }
}

window.addEventListener("load", sitedeltaManager.onLoad, false);
