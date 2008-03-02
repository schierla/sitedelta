var sitedeltaOverlay= {
 strings: null,

 onLocationChange: function(awp, ar, al) {
  setTimeout(sitedeltaOverlay.pageChanged, 100);
 },
 onStateChange: function(ap, ar, af, as){
  if((af & Components.interfaces.nsIWebProgressListener.STATE_STOP) && sitedeltaService.scanOnLoad) {
   if(ap.DOMWindow.document.sitedeltaMatch) return;  	
   var result=sitedeltaService.getPage(ap.DOMWindow.document.URL); 
   if(result.status==sitedeltaService.RESULT_UNCHANGED || result.status==sitedeltaService.RESULT_UNCHECKED) sitedeltaService.scanPage(ap.DOMWindow.document);
  }
 },
 onProgressChange: function(aWebProgress, aRequest, aCurSelfProgress, aMaxSelfProgress, aCurTotalProgress, aMaxTotalProgress) {
  return 0;
 },
 onStatusChange: function() {return 0;},
 onSecurityChange: function() {return 0;},
 onLinkIconAvailable: function() {return 0;},
 
 showOutline: function() {
  var xpath=this.label;
  if(sitedeltaOverlay.outlinedElement) sitedeltaOverlay.removeOutline();
  var element=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
  if(!element) return;
  sitedeltaOverlay.outlinedElement=element; sitedeltaOverlay.outlinedElementStyle=element.style.MozOutline;
  element.style.MozOutline= (this.regionEntry==1?"dotted "+sitedeltaService.includeRegion+" 2px;":"dotted "+sitedeltaService.excludeRegion+" 2px;");
 },
 removeOutline: function() {
  if(sitedeltaOverlay.outlinedElement) sitedeltaOverlay.outlinedElement.style.MozOutline = sitedeltaOverlay.outlinedElementStyle;
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
  gBrowser.addProgressListener(sitedeltaOverlay, Components.interfaces.nsIWebProgress.NOTIFY_STATE_DOCUMENT | Components.interfaces.nsIWebProgress.NOTIFY_LOCATION);
  if(sitedeltaService.enableWatch) sitedeltaOverlay.listWatches();
  sitedeltaService.addObserver(sitedeltaOverlay);
 },
 observe: function(aSubject, aTopic, aData) {
  if (aTopic == "sitedelta") {
   sitedeltaOverlay.pageChanged();
   if(!sitedeltaService.enableWatch) return;
   var result=sitedeltaService.getPage(aData);
   if(result.status<=0) sitedeltaOverlay.removeWatch(result.url);
   else if(result.status>0) sitedeltaOverlay.addWatch(result.url);
  }
 },
 listWatches: function() {
  var menu=document.getElementById("sitedelta-watch-popup");
  if(!menu.done) {
   var pages=sitedeltaService.listPages(); var entries=0;
   for(var i=0; i<pages.length; i++) {
   	var result=sitedeltaService.getPage(pages[i]);
   	if(result.status>0) {
   	 entries++;
     var item = menu.ownerDocument.createElement("menuitem");
     item.setAttribute("label", result.url); item.value=result.url; item.watchEntry=1; 
     item.addEventListener("command", sitedeltaOverlay.openWatch, false);
     menu.appendChild(item);
   	}
   }
   document.getElementById("sitedelta-watch").setAttribute("hidden", (entries>0?"false":"true"));
   menu.done=true;
  }
 },
 removeWatch: function(url) {
  var menu=document.getElementById("sitedelta-watch-popup");
  if(!menu.done) sitedeltaOverlay.listWatches(); var entries=0;
  var cur=menu.firstChild; while(cur) {last=cur; cur=cur.nextSibling; if(last.watchEntry && last.value==url) menu.removeChild(last); else if(last.watchEntry==1) entries++; }  
  if(entries==0) document.getElementById("sitedelta-watch").setAttribute("hidden", "true");
 }, 
 addWatch: function(url) {
  var menu=document.getElementById("sitedelta-watch-popup");
  if(!menu.done) sitedeltaOverlay.listWatches();
  document.getElementById("sitedelta-watch").setAttribute("hidden", "false");
  var cur=menu.firstChild; while(cur) {if(cur.watchEntry && cur.value==url) return; cur=cur.nextSibling;}  
  var item = menu.ownerDocument.createElement("menuitem");
  item.setAttribute("label", url); item.value=url; item.watchEntry=1; 
  item.addEventListener("command", sitedeltaOverlay.openWatch, false);
  menu.appendChild(item);
 },
 openWatch: function() {
  gBrowser.addTab(this.value);
 },
 openAllWatches: function() {
  var menu=document.getElementById("sitedelta-watch-popup");
  var cur=menu.firstChild; while(cur) {if(cur.watchEntry) gBrowser.addTab(cur.value); cur=cur.nextSibling; }
 }, 
 openBackup: function() {
  gBrowser.selectedTab=gBrowser.addTab(this.value);
 },
 createBackup: function() {
  sitedeltaService.backupPage(content.document);
 },
 onUnLoad: function() {
  gBrowser.removeProgressListener(sitedeltaOverlay);
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
  var elem=dom.firstChild.firstChild; while(elem) {
   if(elem.firstChild) {
    if(elem.nodeName=="url") preset.url=elem.firstChild.data;
    else if(elem.nodeName=="include") preset.includes.push(elem.firstChild.data);
    else if(elem.nodeName=="exclude") preset.excludes.push(elem.firstChild.data);
    else if(elem.nodeName=="name") preset.name=elem.firstChild.data;
   }
   elem=elem.nextSibling;
  }
  var noB=gBrowser.getNotificationBox();
  if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("presetFoundDone").replace(/%s/,preset.url), "sitedelta-install", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH);
  var fn=sitedeltaService.newPreset(preset);
  window.openDialog("chrome://sitedelta/content/sitedeltaPreset.xul", "sitedelta-preset", "width=600,height=400,resizable=yes,centerscreen", fn);
 },
 mouseover: function(e) {
  if(sitedeltaOverlay.needText && !e.target.firstChild.data && (!e.target.id || e.target.id.substr(0,16)=="sitedelta-change")) return;
  e.target.style.MozOutline="dotted red 2px";
  e.preventDefault();
  e.stopPropagation();
 },
 mouseout: function(e) {
  if(e.target!=sitedeltaOverlay.destelement) e.target.style.MozOutline="none";
  e.preventDefault();
  e.stopPropagation();
 },
 mousedown: function(e) {
  sitedeltaOverlay.needText=true;
  sitedeltaOverlay.destelement=e.target;
  e.target.style.MozOutline="solid green 2px;";
  e.preventDefault();
  e.stopPropagation();
 },
 mouseup: function(e) {
  sitedeltaOverlay.mouseout(e);
  e.preventDefault();
  e.stopPropagation();
  
  sitedeltaOverlay.destelement.style.MozOutline="none";
  content.document.removeEventListener("mouseover", sitedeltaOverlay.mouseover, true);
  content.document.removeEventListener("mousedown", sitedeltaOverlay.mousedown, true);
  content.document.removeEventListener("mouseup", sitedeltaOverlay.mouseup, true);
  content.document.removeEventListener("mouseout", sitedeltaOverlay.mouseout, true);
  content.document.removeEventListener("click", sitedeltaOverlay.mouseclick, true);
  if(e.button!=0) return;

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
   for(var j=i+1; j<from.length; j++) xpath+="/..";
   if(i<from.length) {
    var dest=content.document.evaluate(common, content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
    var el=content.document.evaluate(xpath, content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
    var j=1; var f=null;
    if(el!=dest) for(var j=1; j>0; j++) {
     el=content.document.evaluate(xpath+"/following-sibling::"+dest.nodeName+"[position()="+j+"]", content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
     if(el==dest) {xpath+="/following-sibling::"+dest.nodeName+"[position()="+j+"]"; break; }
     var f=content.document.evaluate(xpath+"/preceding-sibling::"+dest.nodeName+"[position()="+j+"]", content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
     if(f==dest) {xpath+="/preceding-sibling::"+dest.nodeName+"[position()="+j+"]"; break; }
     if(!el && !f) {break;}
    }
   } else {
    i--; 
   }
   for(i=i+1; i<to.length; i++) xpath+="/"+to[i];
   sitedelta.addRegion(xpath, sitedelta.regionAction==1);
  } else {
   sitedelta.addRegion(sitedeltaService.buildXPath(sitedeltaOverlay.destelement), sitedelta.regionAction==1);
  }
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
 },
 excludeRegion: function(e) {
  sitedelta.regionAction=2;
  sitedeltaOverlay.selectRegion();
 },
 showManager: function(e) {
  return window.openDialog("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "width=600,height=400,resizable=yes,centerscreen", "");
 },
 showManagerAndCheck: function(e) {
  return window.openDialog("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "width=600,height=400,resizable=yes,centerscreen", "check");
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
  if(content.document.sitedeltaMatch) {
   if(!content.document.getElementById("sitedelta-change"+content.document.sitedeltaMatch))
    content.document.sitedeltaMatch=0;
   content.window.location.hash="#sitedelta-change"+content.document.sitedeltaMatch;
   content.document.sitedeltaMatch++;
   return;
  }
  var url=content.window.location.href;
  if(url=="about:blank") return sitedeltaOverlay.showManager();

  var noB=false;
  if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
  if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

  var changes=sitedeltaService.highlightPage(content.document);   
  if(changes==sitedeltaService.RESULT_NOTFOUND) {
   if(noB) noB.appendNotification(sitedeltaOverlay.strings.getString("noContentMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH, {}); return; 
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
