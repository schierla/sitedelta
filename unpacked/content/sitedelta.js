var sitedeltaService = Components.classes["@sitedelta.schierla.de/sitedelta;1"].getService(Components.interfaces.nsISupports).wrappedJSObject;
var sitedelta = {
  preventevent: function(e) {
   e.preventDefault();
   e.stopPropagation();
  },
  menuBackups: function(menu, url) {
   var backups=sitedeltaService.listBackups(url);
   var cur=menu.firstChild; while(cur) {last=cur; cur=cur.nextSibling; if(last.backupEntry) menu.removeChild(last); }
   for(var i=0; i<backups.length; i++) {
    var item=menu.ownerDocument.createElement("menuitem");
    item.setAttribute("label", backups[i].name);
    item.value=backups[i].url; item.backupEntry=1; item.addEventListener("command", sitedeltaOverlay.openBackup, false);
    menu.appendChild(item);
   }
  },
  menuPresets: function(menu, url) {
   menu.url=url;
   var presets=sitedeltaService.listPresets();
   var cur=menu.firstChild; while(cur) {last=cur; cur=cur.nextSibling; if(last.presetEntry) menu.removeChild(last); }
   var item=menu.ownerDocument.createElement("menuseparator"); item.presetEntry=1; menu.appendChild(item);
   for(var i=0; i<presets.length; i++) {
    var preset=sitedeltaService.getPreset(presets[i]);
    item=menu.ownerDocument.createElement("menuitem");
    item.setAttribute("label", preset.name);
    if(sitedeltaService.isPresetPreferred(preset, url)) item.setAttribute("style","font-style: italic;");
    item.presetEntry=1; 
    item.value=presets[i]; item.addEventListener("command", sitedelta.applyPreset, false);
    menu.appendChild(item);
   }
  },
  applyPreset: function(e) {
   var url=this.parentNode.url; 
   var result=sitedeltaService.getPage(url);
   var preset=sitedeltaService.getPreset(this.value); 
   result.url=url.replace(/#.*$/,'');
   result.includes=preset.includes; result.excludes=preset.excludes;
   sitedeltaService.putPage(result);
  },
  menuRegions: function(menu, url) {
   var result=sitedeltaService.getPage(url);
   var cur=menu.firstChild; while(cur) {last=cur; cur=cur.nextSibling; if(last.regionEntry) menu.removeChild(last); }

   var includeSeparator=menu.ownerDocument.getElementById('sitedelta-scanregions');
   for(var i=0; i<result.includes.length; i++) {
    var item = menu.ownerDocument.createElement("menuitem");
    item.setAttribute("label", result.includes[i]);
    item.value=i; item.regionEntry=1; item.addEventListener("mouseover", sitedeltaOverlay.showOutline, false);
    item.addEventListener("mouseout", sitedeltaOverlay.removeOutline, false);
    item.addEventListener("command", sitedeltaOverlay.removeIncludeRegion, false);
    menu.insertBefore(item, includeSeparator);
   }

   var excludeSeparator=menu.ownerDocument.getElementById('sitedelta-ignoreregions');
   for(var i=0; i<result.excludes.length; i++) {
    var item = menu.ownerDocument.createElement("menuitem");
    item.setAttribute("label", result.excludes[i]);
    item.value=i; item.regionEntry=2; item.addEventListener("mouseover", sitedeltaOverlay.showOutline, false);
    item.addEventListener("mouseout", sitedeltaOverlay.removeOutline, false);
    item.addEventListener("command", sitedeltaOverlay.removeExcludeRegion, false);
    menu.insertBefore(item, excludeSeparator);
   }

   var loadRegion=menu.ownerDocument.getElementById('sitedelta-load-preset');
   loadRegion.firstChild.url=url;
  },
  addRegion: function(path, include) {
   var url=content.window.location.href; 
   var result=sitedeltaService.getPage(url);
   result.url=url.replace(/#.*$/,'');
   if(result.name=="") result.name=content.document.title.replace(/[\n\r]/g,' ');
   if(include) {
    if(result.includes.length==1 && result.includes[0]=="/html/body[1]") result.includes.pop();
    result.includes.push(path);
   } else {
    result.excludes.push(path);
   }
   sitedeltaService.putPage(result);
  },
  removeRegion: function(nr, include) {
   url=content.window.location.href; var result=sitedeltaService.getPage(url);
   result.url=url.replace(/#.*$/,'');
   if(result.name=="") result.name=content.document.title.replace(/[\n\r]/g,' ');
   if(include) {
    for(var i=nr; i<result.includes.length-1; i++) result.includes[i]=result.includes[i+1];
    result.includes.pop();
   } else {
    for(var i=nr; i<result.excludes.length-1; i++) result.excludes[i]=result.excludes[i+1];
    result.excludes.pop();
   }
   if(result.includes.length==0) result.includes[0]="/html/body[1]";
   sitedeltaService.putPage(result);
  },
  showPresets: function(fn) {
   window.openDialog("chrome://sitedelta/content/sitedeltaPreset.xul", "sitedelta-preset", "width=640,height=480,resizable=yes,centerscreen", fn);
  },
  showPrefs: function() {
   window.openDialog("chrome://sitedelta/content/sitedeltaPrefs.xul", "sitedelta-prefs", "width=700,height=550,resizable=yes,centerscreen");
  },
  showProperties: function(url) {
   return window.openDialog("chrome://sitedelta/content/sitedeltaProperties.xul", "sitedelta-properties", "width=640,height=480,resizable=yes,centerscreen", url);
  },
}