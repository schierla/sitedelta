const sitedeltaListener = {
 onStatusChange: function(){},
 onProgressChange: function(){},
 onLocationChange: function(awp, ar, al) {sitedeltaOverlay.pageChange(); },
 onStateChange: function(){},
 onSecurityChange: function(){}
};

var sitedeltaOverlay= {
  showOutline: function() {
   var xpath=this.label;
   if(sitedeltaOverlay.outlinedElement) removeOutline();
   var element=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
   if(!element) return;
   sitedeltaOverlay.outlinedElement=element; sitedeltaOverlay.outlinedElementStyle=element.style.MozOutline;
   element.style.MozOutline= (this.regionEntry==1?"dotted "+sitedelta.prefs.getCharPref("includeRegion")+" 2px;":"dotted "+sitedelta.prefs.getCharPref("excludeRegion")+" 2px;");
  },
  removeOutline: function() {
   if(sitedeltaOverlay.outlinedElement) sitedeltaOverlay.outlinedElement.style.MozOutline = sitedeltaOverlay.outlinedElementStyle;
   sitedeltaOverlay.outlinedElement=false;
  },
  removeRegion: function() {
   url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var result=sitedelta.readFile(fn+".dat");
   result.url=url.replace(/#.*$/,'');
   if(result.name=="") result.name=content.document.title.replace(/[\n\r]/g,' ');
   if(this.regionEntry==1) {
    for(var i=this.value; i<result.includes.length-1; i++) result.includes[i]=result.includes[i+1];
    result.includes.pop();
   } else {
    for(var i=this.value; i<result.excludes.length-1; i++) result.excludes[i]=result.excludes[i+1];
    result.excludes.pop();
   }

   sitedelta.saveFile(fn+".dat", result);
  },
  onLoad: function() {
   gBrowser.addProgressListener(sitedeltaListener);
   var panel=gBrowser.mPanelContainer; panel.addEventListener("select", sitedeltaOverlay.pageSwitch, false);
  },
  onUnLoad: function() {
   gBrowser.removeProgressListener(sitedeltaListener);
   window.removeEventListener("load", sitedeltaOverlay.onLoad, false);
  },
  pageSwitch: function() {
   setTimeout(sitedeltaOverlay.pageSelected, 100);
  },
  pageChange: function() {
   setTimeout(sitedeltaOverlay.pageChanged, 100);
  },
  pageChanged: function() {
   var url=content.window.location.href; 
   var noB=false;
   if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
   if(noB && !content.document.sitedeltaMatch && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

   if(/\.sitedelta-preset$/.test(url)) {
    if(noB) noB.appendNotification(sitedelta.strings.getString("presetFoundMessage"), "sitedelta-install", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH, [{ label: sitedelta.strings.getString("presetFoundInstall"), accessKey: "i", popup: null, callback: sitedeltaOverlay.install }]);
   }
   sitedeltaOverlay.pageSelected();
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
   if(noB) noB.appendNotification(sitedelta.strings.getString("presetFoundDone").replace(/%s/,preset.url), "sitedelta-install", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH);
   var fn=sitedelta.newPreset(preset);
   window.openDialog("chrome://sitedelta/content/sitedeltaPreset.xul", "sitedelta-preset", "width=600,height=400,resizable=yes,centerscreen", fn);
  },
  pageSelected: function() {
   var url=content.window.location.href; fn=sitedelta._getFilename(url);
   var file = sitedelta.sitedeltaDir(); file.append(fn+".dat");
   var icon=document.getElementById("sitedelta-status");
   if(file.exists()) { 
    icon.setAttribute("src", "chrome://sitedelta/skin/sitedelta-known.gif");
   } else {
    icon.setAttribute("src", "chrome://sitedelta/skin/sitedelta.gif");
   }
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

    var to=sitedelta.buildPath(sitedeltaOverlay.destelement).split("/");
    var from=sitedelta.buildPath(e.target).split("/");
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
     var e=content.document.evaluate(xpath, content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
     var j=1; var f=null;
     if(e!=dest) for(var j=1; j>0; j++) {
      var e=content.document.evaluate(xpath+"/following-sibling::"+dest.nodeName+"[position()="+j+"]", content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
      if(e==dest) {xpath+="/following-sibling::"+dest.nodeName+"[position()="+j+"]"; break; }
      var f=content.document.evaluate(xpath+"/preceding-sibling::"+dest.nodeName+"[position()="+j+"]", content.document, null, XPathResult.ANY_TYPE, null).iterateNext();
      if(f==dest) {xpath+="/preceding-sibling::"+dest.nodeName+"[position()="+j+"]"; break; }
      if(!e && !f) {break;}
     }
    } else {
     i--; 
    }
    for(i=i+1; i<to.length; i++) xpath+="/"+to[i];
    sitedelta.addXPathRegion(xpath);
   } else {
    sitedelta.addXPathRegion(sitedelta.buildPath(sitedeltaOverlay.destelement));
   }
  },
  selectRegion: function(e) {
   sitedeltaOverlay.needText=false; sitedeltaOverlay.destelement=null;
   content.document.addEventListener("mouseover", sitedeltaOverlay.mouseover, true);
   content.document.addEventListener("mousedown", sitedeltaOverlay.mousedown, true);
   content.document.addEventListener("mouseup", sitedeltaOverlay.mouseup, true);
   content.document.addEventListener("mouseout", sitedeltaOverlay.mouseout, true);
   content.document.addEventListener("click", sitedeltaOverlay.preventevent, true);
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
   window.openDialog("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "width=600,height=400,resizable=yes,centerscreen", "");
  },
  showManagerAndCheck: function(e) {
   window.openDialog("chrome://sitedelta/content/sitedeltaManager.xul", "sitedelta-manager", "width=600,height=400,resizable=yes,centerscreen", "check");
  },
  removeHighlight: function(e) {
   sitedelta.removeHighlight();
  },
  listRegions: function(menu) {
   sitedelta.listRegions(menu, content.window.location.href);
  },
  listPresets: function(menu) {
   sitedelta.listPresets(menu, content.window.location.href);
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
   var fn=sitedelta._getFilename(url);

   var result=sitedelta.readFile(fn+".dat");
   sitedelta.last = result.content;

   var noB=false;
   if(gBrowser.getNotificationBox) noB=gBrowser.getNotificationBox();
   if(noB && noB.getNotificationWithValue("sitedelta")) noB.removeNotification(noB.getNotificationWithValue("sitedelta"));

   var text="";
   
   var showRegions=sitedelta.prefs.getBoolPref("showRegions");

   sitedelta.excludes=new Array();
   for(var i=0;i<result.excludes.length; i++) {
    sitedelta.excludes.push(content.document.evaluate(result.excludes[i], content.document, null, XPathResult.ANY_TYPE, null).iterateNext());
    if(sitedelta.excludes[i] && showRegions) sitedelta.excludes[i].style.MozOutline="dotted "+sitedelta.prefs.getCharPref("excludeRegion")+" 2px;";
   }
   var regions=new Array();
   for(var i=0; i<result.includes.length; i++) {
    var xpath=result.includes[i];
    var startElement=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
    if(!startElement) {
     if(xpath!="/html/body[1]") xpath="/html/body[1]";
     startElement=content.document.evaluate(xpath,content.document,null,XPathResult.ANY_TYPE,null).iterateNext();
    }
    if(!startElement) {
     if(noB) noB.appendNotification(sitedelta.strings.getString("noContentMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_HIGH, {}); return; 
    }
    
    if(showRegions) startElement.style.MozOutline="dotted "+sitedelta.prefs.getCharPref("includeRegion")+" 2px;";
    regions.push(startElement);
   }
   sitedelta.changes=0; sitedelta.pos=0; sitedelta.currentpos=-1; 
   for(var i=0; i<regions.length; i++) 
    text+=sitedelta.walkTree(regions[i], false);

   if(sitedelta.last.replace(/[ \t\n]+/,"")=="" && text.replace(/[ \t\n]+/,"")!="") {
    if(noB) noB.appendNotification(sitedelta.strings.getString("firstScanMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {}); 
   } else {
    sitedelta.current = text; sitedelta.changes=0; sitedelta.pos=0; 
    sitedelta.currentpos=1; sitedelta.insertElement=false;
    for(var i=0; i<regions.length; i++) 
     sitedelta.walkTree(regions[i], true);

    if(sitedelta.changes>0) {
     if(noB) noB.appendNotification(sitedelta.strings.getString("changesFoundMessage").replace("%d",sitedelta.changes), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
     content.window.location.hash="#sitedelta-change0";
     content.document.sitedeltaMatch = 1; 
    } else {
     if(noB) noB.appendNotification(sitedelta.strings.getString("noChangesMessage"), "sitedelta", "chrome://sitedelta/content/sitedelta.gif", noB.PRIORITY_WARNING_LOW, {});
    }
   }
   result.url=url.replace(/#.*$/,''); result.title=content.document.title.replace(/[\n\r]/g,' ');
   if(result.name=="") result.name=result.title;
   var date=new Date(); result.date=date.toLocaleString(); result.content = text;
   sitedelta.saveFile(fn+".dat", result);
  }
}

window.addEventListener("load", sitedeltaOverlay.onLoad, false);
window.addEventListener("unload", sitedeltaOverlay.onUnLoad, false);
