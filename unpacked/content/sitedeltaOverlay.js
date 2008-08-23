var sitedeltaOverlay= {
 strings: null,
 onPageLoad: function(evt) {
  var doc=evt.originalTarget;
  if(doc.nodeName == "#document") {
   if(doc.sitedeltaMatch) return;  	
   var result=sitedeltaService.getPage(doc.URL); 
   if(result.status!=sitedeltaService.RESULT_NEW) sitedeltaService.scanPage(doc);
  }
 },
 onLocationChange: function(awp, ar, al) {
  setTimeout(sitedeltaOverlay.pageChanged, 100);
 },
 onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
  return 0;
 },
 onStateChange: function(ap, ar, af, as){return 0; },
 onStatusChange: function() {return 0;},
 onSecurityChange: function() {return 0;},
 onLinkIconAvailable: function() {return 0;},
 
 showOutline: function() {
  var xpath=this.label;
  if(sitedeltaOverlay.outlinedElement) sitedeltaOverlay.removeOutline();
  var element=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
  if(!element) return;
  sitedeltaOverlay.outlinedElement=element; sitedeltaOverlay.outlinedElementStyle=element.style.outline;
  element.style.outline= (this.regionEntry==1?sitedeltaService.includeRegion+" dotted 2px":sitedeltaService.excludeRegion+" dotted 2px");
 },
 removeOutline: function() {
  if(sitedeltaOverlay.outlinedElement) sitedeltaOverlay.outlinedElement.style.outline = sitedeltaOverlay.outlinedElementStyle;
  sitedeltaOverlay.outlinedElement=false;
 },
 removeIncludeRegion: function() {
  sitedelta.removeRegion(this.value, true);
 },
 removeExcludeRegion: function() {
  sitedelta.removeRegion(this.value, false);
 },
 onLoad: function() {
  sitedeltaOverlay.strings = document.getElementById("sitedelta-strings");
  gBrowser.addProgressListener(sitedeltaOverlay, Components.interfaces.nsIWebProgress.NOTIFY_LOCATION); // Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT 
  document.getElementById("appcontent").addEventListener("load", sitedeltaOverlay.onPageLoad, true);
  sitedeltaService.addObserver(sitedeltaOverlay);
  var list=document.getElementById("sitedelta-watch-popup");
  list.database.AddDataSource(sitedeltaService.RDF);
  list.builder.rebuild(); 
  sitedeltaOverlay.observe("","sitedelta","");
 },
 observe: function(aSubject, aTopic, aData) {
  if (aTopic == "sitedelta") {
   var watches=document.getElementById("sitedelta-watch-popup").firstChild;
   var found=false;
   while((watches=watches.nextSibling)!=null) if(watches.id!="") found=true;
   document.getElementById("sitedelta-watch").setAttribute("hidden", (found?"false":"true"));
   sitedeltaOverlay.pageChanged();
  }
 },
 openPage: function(pg) {
  gBrowser.selectedTab = gBrowser.addTab(pg.id);
 }, 
 openWatch: function(pg) {
  gBrowser.selectedTab = gBrowser.addTab(pg.id);
 },
 openAllWatches: function() {
  var menu=document.getElementById("sitedelta-watch-popup");
  var cur=menu.firstChild; while(cur) {if(cur.id!="") gBrowser.selectedTab=gBrowser.addTab(cur.id); cur=cur.nextSibling; }
 }, 
 openBackup: function() {
  gBrowser.selectedTab=gBrowser.addTab(this.value);
 },
 createBackup: function() {
  sitedeltaService.backupPage(content.document);
 },
 onUnLoad: function() {
  gBrowser.removeProgressListener(sitedeltaOverlay);
  document.getElementById("appcontent").removeEventListener("load", sitedeltaOverlay.onPageLoad, true);  
  window.removeEventListener("load", sitedeltaOverlay.onLoad, false);
  sitedeltaService.removeObserver(sitedeltaOverlay);
 },
 pageChanged: function() {
  var url=content.window.location.href; 
  var noB=false;
  if(!content.document.sitedeltaSeen && /\.sitedelta-preset$/.test(url)) {
   content.document.sitedeltaSeen=true;
   if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
   if(noB && !content.document.sitedeltaMatch && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("presetFoundMessage"), "sitedelta-install", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH, [{ label: sitedeltaOverlay.strings.getString("presetFoundInstall"), accessKey: "i", popup: null, callback: sitedeltaOverlay.install }]);
  }
  var page=sitedeltaService.getPage(url);
  var icon=document.getElementById("sitedelta-status");
  if(page.status==-1)
   icon.setAttribute("src", "chrome://sitedelta/skin/sitedelta.gif");
  else if(page.status>0) 
   icon.setAttribute("src", "chrome://sitedelta/skin/sitedelta-changed.gif");
  else 
   icon.setAttribute("src", "chrome://sitedelta/skin/sitedelta-known.gif");
 },
 install: function() {
  var url=content.window.location.href; 
  var req = new XMLHttpRequest();
  req.open('GET', url, false); 
  req.send(null);
  if(req.status != 200 && req.status!=0) return;
  var parser = new DOMParser(); var dom=false; dom = parser.parseFromString(req.responseText, "text/xml");
  if(!dom || dom.firstChild.nodeName!="sitedelta") return;
  var preset={}; preset.includes=new Array(); preset.excludes=new Array();
  preset.checkDeleted=null; preset.scanImages=null; preset.ignoreCase=null; preset.ignoreNumbers=null;
  var elem=dom.firstChild.firstChild; while(elem) {
   if(elem.firstChild) {
    if(elem.nodeName=="url") preset.url=elem.firstChild.data;
    else if(elem.nodeName=="include") preset.includes.push(elem.firstChild.data);
    else if(elem.nodeName=="exclude") preset.excludes.push(elem.firstChild.data);
    else if(elem.nodeName=="name") preset.name=elem.firstChild.data;
    else if(elem.nodeName=="settings") {
     if(elem.hasAttribute("checkDeleted")) preset.checkDeleted=elem.attributes.getNamedItem("checkDeleted").firstChild.data=="true";
     if(elem.hasAttribute("scanImages")) preset.scanImages=elem.attributes.getNamedItem("scanImages").firstChild.data=="true";
     if(elem.hasAttribute("ignoreCase")) preset.ignoreCase=elem.attributes.getNamedItem("ignoreCase").firstChild.data=="true";
     if(elem.hasAttribute("ignoreNumbers")) preset.ignoreNumbers=elem.attributes.getNamedItem("ignoreNumbers").firstChild.data=="true";
    }    
   }
   elem=elem.nextSibling;
  }
  var noB=gBrowser.getNotificationBox();
  if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("presetFoundDone").replace(/%s/,preset.url), "sitedelta-install", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH);
  var fn=sitedeltaService.newPreset(preset);
  sitedelta.showPresets(fn);
 },
 mouseover: function(e) {
  if(sitedeltaOverlay.needText && !e.target.firstChild.data && (!e.target.id || e.target.id.substr(0,16)=="sitedelta-change")) return;
  e.target.style.outline="red dotted 2px";
  e.preventDefault();
  e.stopPropagation();
 },
 mouseout: function(e) {
  if(e.target!=sitedeltaOverlay.destelement) e.target.style.outline="none";
  e.preventDefault();
  e.stopPropagation();
 },
 mousedown: function(e) {
  sitedeltaOverlay.needText=true;
  sitedeltaOverlay.destelement=e.target;
  e.target.style.outline="green solid 2px;";
  e.preventDefault();
  e.stopPropagation();
 },
 mouseup: function(e) {
  sitedeltaOverlay.mouseout(e);
  e.preventDefault();
  e.stopPropagation();
  sitedeltaOverlay.destelement.style.outline="none";

  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));
  
  if(e.button!=0) {
   content.document.removeEventListener("mouseover", sitedeltaOverlay.mouseover, true);
   content.document.removeEventListener("mousedown", sitedeltaOverlay.mousedown, true);
   content.document.removeEventListener("mouseup", sitedeltaOverlay.mouseup, true);
   content.document.removeEventListener("mouseout", sitedeltaOverlay.mouseout, true);
   content.document.removeEventListener("click", sitedeltaOverlay.mouseclick, true);
   return;
  }
  if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("regionAdded"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});

  sitedeltaOverlay.needText=false;
  if(e.target!=sitedeltaOverlay.destelement && (e.target.firstChild.data || e.target.id)) {
   var to=sitedeltaService.buildXPath(sitedeltaOverlay.destelement).split("/");
   var from=sitedeltaService.buildXPath(e.target).split("/");
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
   for(var j=i; j<from.length; j++) xpath+="/..";
   for(i=i; i<to.length; i++) xpath+="/"+to[i];
   sitedelta.addRegion(xpath, sitedelta.regionAction==1);
  } else {
   sitedelta.addRegion(sitedeltaService.buildXPath(sitedeltaOverlay.destelement), sitedelta.regionAction==1);
  }
  
  sitedeltaOverlay.needText=false; sitedeltaOverlay.destelement=null;
 },
 selectRegion: function(e) {
  sitedeltaOverlay.needText=false; sitedeltaOverlay.destelement=null;
  content.document.addEventListener("mouseover", sitedeltaOverlay.mouseover, true);
  content.document.addEventListener("mousedown", sitedeltaOverlay.mousedown, true);
  content.document.addEventListener("mouseup", sitedeltaOverlay.mouseup, true);
  content.document.addEventListener("mouseout", sitedeltaOverlay.mouseout, true);
  content.document.addEventListener("click", sitedelta.preventevent, true);
  return false;
 },
 includeRegion: function(e) {
  sitedelta.regionAction=1; 
  sitedeltaOverlay.selectRegion();
  
  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));
  if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("includeRegionMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
 },
 excludeRegion: function(e) {
  sitedelta.regionAction=2;
  sitedeltaOverlay.selectRegion();
  
  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));
  if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("excludeRegionMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
 },
 showProperties: function(e) {
  var result=sitedeltaService.getPage(content.document.URL);
  return sitedelta.showProperties(result.url)
 },
 checkBg: function() {
  sitedeltaService.notify();
 },
 changePassword: function(e) {
  sitedelta.changePassword(content.window.location.href);
 },
 removeHighlight: function(e) {
  sitedeltaService.restorePage(content.document);
 },
 listRegions: function(menu) {
  sitedelta.menuRegions(menu, content.window.location.href);
 },
 listPresets: function(menu) {
  var url=content.document.URL;
  if(content.document.sitedeltaOriginalURL) url=content.document.sitedeltaOriginalURL;
  sitedelta.menuPresets(menu, url);
 },
 listBackups: function(menu) {
  sitedelta.menuBackups(menu, content.window.location.href); 	
 },
 highlightChanges: function(e) {
  if(e.button && e.button!=0) return;
  if(e.ctrlKey) {
   var result=sitedeltaService.getPage(content.document.URL);
   if(result.status==sitedeltaService.RESULT_NEW) toggleSidebar('viewSitedeltaSidebar'); else sitedeltaOverlay.showProperties(e);
   return;
  }
  if(content.document.sitedeltaMatch) {
   if(!content.document.getElementById("sitedelta-change"+content.document.sitedeltaMatch))
    content.document.sitedeltaMatch=0;
   content.window.location.hash="#sitedelta-change"+content.document.sitedeltaMatch;
   content.document.sitedeltaMatch++;
   return;
  }
  var url=content.window.location.href;
  if(url=="about:blank") {sitedeltaOverlay.showProperties(); return; }

  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

  var changes=sitedeltaService.highlightPage(content.document);   
  if(changes==sitedeltaService.RESULT_ERROR) {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("noContentMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH, {});
  } else if(changes==sitedeltaService.RESULT_NEW) {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("firstScanMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {}); 
  } else if(changes==sitedeltaService.RESULT_UNCHANGED) {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("noChangesMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
  } else {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("changesFoundMessage").replace("%d",changes), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
   content.window.location.hash="#sitedelta-change0";
   content.document.sitedeltaMatch = 1; 
  }
 }
}

window.addEventListener("load", sitedeltaOverlay.onLoad, false);
window.addEventListener("unload", sitedeltaOverlay.onUnLoad, false);
