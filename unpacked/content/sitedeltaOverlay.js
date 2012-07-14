// "use strict";
var sitedeltaOverlay= {
 strings: null,
 onPageLoad: function(evt) {
  setTimeout(function(evt) {return function() {sitedeltaOverlay.onPageLoadDelay(evt);}}(evt), 50);
 },
 onPageLoadDelay: function(evt) {
  var doc=evt.originalTarget;
  if(doc.nodeName == "#document") {
   if(doc.sitedeltaMatch) return; 
   var result=sitedeltaService.getPage(doc.URL); 
   if(result.status!=sitedeltaService.RESULT_NEW) {
	if(sitedeltaService.scanOnLoad) sitedeltaService.scanPage(doc);
	if(sitedeltaService.highlightOnLoad) {
     doc.sitedeltaMatch = -2; sitedeltaOverlay.pageChanged();
    }
   }
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
  var addonBar = document.getElementById("addon-bar");
  if (addonBar) {
   if (!document.getElementById("sitedeltaButton")) {
    var addonBarCloseButton = document.getElementById("addonbar-closebutton")
	if (!document.getElementById("sitedeltaPages")) {
     addonBar.insertItem("sitedeltaPages", addonBarCloseButton.nextSibling);
    }
    addonBar.insertItem("sitedeltaButton", addonBarCloseButton.nextSibling);
    addonBar.collapsed = false;
   }
  }
  document.getElementById("appcontent").addEventListener("load", sitedeltaOverlay.onPageLoad, true);
  sitedeltaService.addObserver(sitedeltaOverlay);
  var list=document.getElementById("sitedelta-watch-popup");
  if(list && list.database) { list.database.AddDataSource(sitedeltaService.RDF); list.builder.rebuild(); }
  list=document.getElementById("sitedelta-pages-popup");
  if(list && list.database) { list.database.AddDataSource(sitedeltaService.RDF); list.builder.rebuild(); }
  sitedeltaOverlay.observe("","sitedelta","");
 },
 observe: function(aSubject, aTopic, aData) {
  if (aTopic == "sitedelta") {
   sitedeltaOverlay.pageChanged();
  }
 },
 openPage: function(pg) {
  gBrowser.selectedTab = gBrowser.addTab(pg.id);
 }, 
 openCurrent: function(pg) {
  gBrowser.selectedTab = gBrowser.addTab(pg.id);
 },
 updateCurrent: function(pg) {
  sitedeltaService.updatePage(pg.id);
 },
 markSeen: function(pg) {
  sitedeltaService.markSeen(pg.id);
 },
 deleteCurrent: function(pg) {
  sitedeltaService.deletePage(pg.id); 
 },
 configureCurrent: function(pg) {
  var result=sitedeltaService.getPage(pg.id);
  return sitedelta.showProperties(result.url);
 },
 updateAll: function() {
  sitedeltaService.updateAll();
 },
 openChanged: function() {
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
  var button = document.getElementById("sitedeltaButton");
  if(button) button.setAttribute("pagestatus", page.status > 0 ? "1" : page.status == 0 ? "0" : "-1");
  
  var button = document.getElementById("sitedeltaButton");
  var pbutton = document.getElementById("sitedeltaPages");
  var watches=document.getElementById("sitedelta-watch-popup").firstChild;
  var found=false, pfound = false; 
  while((watches=watches.nextSibling)!=null) {
   if(watches.id!="") {pfound = true; }
   if(watches.id!="" && watches.id != url) { found=true; break; }
  }
  if(button) button.setAttribute("type", found && !pbutton ? "menu-button" : "button");
  if(pbutton) pbutton.setAttribute("type", pfound ? "menu-button" : "button");
  
  if(content.document.sitedeltaMatch==-2) {
   content.document.sitedeltaMatch=-1; sitedeltaOverlay.highlightPage(content.document);
  }
 },
 install: function() {
  var url=content.window.location.href; 
  var req = new XMLHttpRequest();
  req.open('GET', url, true); 
  req.onreadystatechange = function() {
   if(req.readyState != 4) return;
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
  };
  req.send(null);
 },
 mouseover: function(e) {
  if(sitedeltaOverlay.needText && !e.target.firstChild.data && (!e.target.id || e.target.id.substr(0,16)=="sitedelta-change")) return;
  e.target.style.outline="red dotted 2px";
  e.preventDefault();
  e.stopPropagation();
 },
 mouseout: function(e) {
  if(e.target && e.target!=sitedeltaOverlay.destelement) e.target.style.outline="none";
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
 cancel: function(e) {
  sitedeltaOverlay.mouseout(e);
  if(sitedeltaOverlay.destelement != null) sitedeltaOverlay.destelement.style.outline="none";
  if(e.button==0 && !e.ctrlKey) return; 
  
  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

  content.document.removeEventListener("mouseover", sitedeltaOverlay.mouseover, true);
  content.document.removeEventListener("mousedown", sitedeltaOverlay.mousedown, true);
  content.document.removeEventListener("mouseup", sitedeltaOverlay.mouseup, true);
  content.document.removeEventListener("mouseout", sitedeltaOverlay.mouseout, true);
  content.document.removeEventListener("click", sitedeltaOverlay.cancel, true);
 },
 mouseup: function(e) {
  if(e.button!=0 || e.ctrlKey) {sitedeltaOverlay.cancel(e); return; }

  sitedeltaOverlay.mouseout(e);
  e.preventDefault();
  e.stopPropagation();

  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

  if(sitedeltaOverlay.destelement == null || e.target == null) return; 
  sitedeltaOverlay.destelement.style.outline="none";
  if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("regionAdded"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});

  sitedeltaOverlay.needText=false;
  if(e.target!=sitedeltaOverlay.destelement && (e.target.firstChild.data || e.target.id)) {
   var to=sitedeltaService.buildXPath(sitedeltaOverlay.destelement, false).split("/");
   var from=sitedeltaService.buildXPath(e.target, false).split("/");
   var common="";
   for(var i=0; i<Math.min(to.length,from.length); i++) {common+="/"+to[i]; if(to[i]!=from[i]) break; }  
   common=common.substr(1);   
   if(e.target.id) {
    var xpath="//*[@id=\""+ e.target.id +"\"]";
    xpath = 'id("' + e.target.id + '")';
   } else {
    var data=new String(e.target.firstChild.data); var func="text()";
    if(data.replace(/[ \n\t\r]+/g," ").replace(/^ /,"").replace(/ $/,"") != data) {
     data=data.replace(/[ \n\t\r]+/g," ").replace(/^ /,"").replace(/ $/,""); func="normalize-space("+func+")";
    }
    if(data.replace(/"/,"'")!=data) {
     data=data.replace(/"/,"'"); func="translate("+func+",'\"',\"'\")";
    }
     
    var xpath="//"+e.target.nodeName.toLowerCase()+'['+func+'="' + data +'"]';
   }
   for(var j=i; j<from.length; j++) xpath+="/..";
   for(i=i; i<to.length; i++) xpath+="/"+to[i];
   sitedelta.addRegion(xpath, sitedelta.regionAction==1);
  } else {
   sitedelta.addRegion(sitedeltaService.buildXPath(sitedeltaOverlay.destelement, true), sitedelta.regionAction==1);
  }
  
  sitedeltaOverlay.needText=false; sitedeltaOverlay.destelement=null;
 },
 selectRegion: function(e) {
  sitedeltaOverlay.needText=false; sitedeltaOverlay.destelement=null;
  content.document.addEventListener("mouseover", sitedeltaOverlay.mouseover, true);
  content.document.addEventListener("mousedown", sitedeltaOverlay.mousedown, true);
  content.document.addEventListener("mouseup", sitedeltaOverlay.mouseup, true);
  content.document.addEventListener("mouseout", sitedeltaOverlay.mouseout, true);
  content.document.addEventListener("click", sitedeltaOverlay.cancel, true);
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
 showPopup: function(e) {
  var popup = document.getElementById("sitedelta-toolbarmenu");
  popup.showPopup(document.getElementById("sitedeltaButton"), -1, -1, "popup", "bottomleft", "topleft"); 
 },
 showPageMenu: function(pg) {
  var popup = document.getElementById("sitedelta-page-context");
  popup.id = pg.id;
 },
 clickButton: function(e) {
  if(e.button && e.button!=0) return;
  var result=sitedeltaService.getPage(content.document.URL);
  if(e.ctrlKey) {
   if(result.status==sitedeltaService.RESULT_NEW) toggleSidebar('viewSitedeltaSidebar'); else sitedeltaOverlay.showProperties(e);
   return false;
  }
  if(result.status==sitedeltaService.RESULT_NEW) {
   sitedeltaOverlay.showPopup(e); 
   return false;
  }
  if(content.document.sitedeltaMatch) {
   sitedeltaOverlay.nextChange();   
   return false;
  }
  sitedeltaOverlay.highlightChanges(e) 
 },
 highlightChanges: function(e) {
  var url=content.window.location.href;
  if(url=="about:blank") return;
  sitedeltaOverlay.highlightPage(content.document);
  if(content.document.getElementById("sitedelta-change0")) 
   content.document.getElementById("sitedelta-change0").scrollIntoView(true);
  content.document.sitedeltaMatch = 1; 
 },
 nextChange: function() {
  if(!content.document.getElementById("sitedelta-change"+content.document.sitedeltaMatch))
   content.document.sitedeltaMatch=0;
  var elem = content.document.getElementById("sitedelta-change"+content.document.sitedeltaMatch);
  elem.scrollIntoView(true);
  var elems = content.document.getElementsByClassName("sitedelta-change" + content.document.sitedeltaMatch);
  for(var i=0; i<elems.length; i++) {
   var elem = elems[i];
   setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 0.5), 10);
   setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 1), 200);
   setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 0.5), 400);
   setTimeout(function(elem,opac) {return function() {elem.style.opacity = opac;}}(elem, 1), 600);
  }
  content.document.sitedeltaMatch++;	 
 },
 highlightPage: function(doc) {
  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

  var changes=sitedeltaService.highlightPage(doc);   
  if(changes==sitedeltaService.RESULT_ERROR) {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("noContentMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH, {});
  } else if(changes==sitedeltaService.RESULT_NEW) {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("firstScanMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {}); 
  } else if(changes==sitedeltaService.RESULT_UNCHANGED) {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("noChangesMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
  } else {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("changesFoundMessage").replace("%d",changes), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
  }
  content.document.sitedeltaMatch = -1;
 }
}

window.addEventListener("load", sitedeltaOverlay.onLoad, false);
window.addEventListener("unload", sitedeltaOverlay.onUnLoad, false);
