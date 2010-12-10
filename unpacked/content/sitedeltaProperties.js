"use strict";
var sitedeltaProperties = {
strings: null,
page: null,
onLoad: function() {
 sitedeltaProperties.strings = document.getElementById("sitedelta-strings");
 sitedeltaProperties.page=sitedeltaService.getPage(window.arguments[0]);
 sitedeltaProperties.showDetails();
},
showDetails: function() {
 var result = this.page;
 sitedeltaProperties.setCheckbox("enablebackup", result.backupPage==null?sitedeltaService.backupPages:result.backupPage);
 sitedeltaProperties.setCheckbox("checkimages", result.scanImages==null?sitedeltaService.scanImages:result.scanImages);
 sitedeltaProperties.setCheckbox("checkdeleted", result.checkDeleted==null?sitedeltaService.checkDeleted:result.checkDeleted);
 var wv=document.getElementById("watchvalue"), wd=document.getElementById("watchdelay");
 wv.value=""; wv.disabled=true;
 if(result.watchDelay==0) wd.selectedIndex=0;
 else if(result.watchDelay==-1) wd.selectedIndex=1;
 else if(result.watchDelay<0) wd.selectedIndex=2; 
 else if(result.watchDelay==10080) wd.selectedIndex=3;
 else if(result.watchDelay==1440) wd.selectedIndex=4;
 else if(result.watchDelay==60) wd.selectedIndex=5; 
 else {wd.selectedIndex=6; wv.disabled=false; wv.value=result.watchDelay; } 
 sitedeltaProperties.setCheckbox("ignorenumbers", result.ignoreNumbers==null?sitedeltaService.ignoreNumbers:result.ignoreNumbers);
 sitedeltaProperties.setCheckbox("ignorecase", result.ignoreCase==null?sitedeltaService.ignoreCase:result.ignoreCase);
 document.getElementById("title").value=result.title;
 document.getElementById("url").value=result.url;
 document.getElementById("date").value=result.date;
 document.getElementById("content").value=result.content;
 document.getElementById("name").value=result.name;
 
 document.getElementById("login").checked=(result.user!="");
 document.getElementById("login").disabled=true;
 
 var pass=sitedeltaService.hasPass(result.url);
 if(pass) document.getElementById("login").disabled=false;
 
},
showPresets: function() {
 sitedelta.showPresets("");
},
showPrefs: function() {
 sitedelta.showPrefs();
},
saveDefault: function() {
 sitedeltaService.ignoreNumbers=document.getElementById("ignorenumbers").checked;
 sitedeltaService.ignoreCase=document.getElementById("ignorecase").checked;
 sitedeltaService.backupPages=document.getElementById("enablebackup").checked;
 sitedeltaService.scanImages=document.getElementById("checkimages").checked;
 sitedeltaService.checkDeleted=document.getElementById("checkdeleted").checked;
 sitedeltaService.savePrefs();
},
listPresets: function(menu) {
 sitedelta.menuPresets(menu, this.page.url);
},
loadDefault: function() {
 sitedeltaProperties.setCheckbox("ignorenumbers", sitedeltaService.ignoreNumbers);
 sitedeltaProperties.setCheckbox("ignorecase", sitedeltaService.ignoreCase);
 sitedeltaProperties.setCheckbox("enablebackup", sitedeltaService.backupPages);
 sitedeltaProperties.setCheckbox("checkimages", sitedeltaService.scanImages);
 sitedeltaProperties.setCheckbox("checkdeleted", sitedeltaService.checkDeleted);
},
savePreset: function() {
 var result=this.page;
 var preset={}; preset.url=result.url; preset.name=result.name; preset.includes=result.includes; preset.excludes=result.excludes; preset.user=""; preset.pass="";
 preset.ignoreCase=result.ignoreCase; preset.ignoreNumbers=result.ignoreNumbers; preset.checkDeleted=result.checkDeleted; preset.scanImages=result.scanImages;
 preset.watchDelay=result.watchDelay; preset.date=""; preset.title=""; preset.content="";
 var fn=sitedeltaService.newPreset(preset);
 sitedelta.showPresets(fn);
},
 getItemStatus: function(item,global) {
  var checked=document.getElementById(item).checked;
  if(checked==global) return null;
  return checked;
 },
 setCheckbox: function(item, value) {
  document.getElementById(item).checked=value;
 },
 save: function() {
  var page = this.page;
  if(document.getElementById("url").value!=page.url) {
   sitedeltaService.deletePage(page.url);
   page.url=document.getElementById("url").value; 
   sitedeltaService.putPage(page);
  }
  page.name=document.getElementById("name").value;
  page.checkImages=sitedeltaProperties.getItemStatus("checkimages", sitedeltaService.checkImages);
  page.checkDeleted=sitedeltaProperties.getItemStatus("checkdeleted", sitedeltaService.checkDeleted);
  switch(document.getElementById("watchdelay").selectedIndex) {
   case 0: page.watchDelay=0; break;
   case 1: page.watchDelay=-1; break; 
   case 2: page.watchDelay=(page.watchDelay<-1?page.watchDelay:-10); break;
   case 3: page.watchDelay=10080; break;
   case 4: page.watchDelay=1440; break;
   case 5: page.watchDelay=60; break;
   case 6: page.watchDelay= document.getElementById("watchvalue").value; break;
  }
  page.scanImages=sitedeltaProperties.getItemStatus("checkimages", sitedeltaService.scanImages);
  page.backupPage=sitedeltaProperties.getItemStatus("enablebackup", sitedeltaService.backupPages);
  page.ignoreCase=sitedeltaProperties.getItemStatus("ignorecase", sitedeltaService.ignoreCase);
  page.ignoreNumbers=sitedeltaProperties.getItemStatus("ignorenumbers", sitedeltaService.ignoreNumbers);
  if(document.getElementById("login").checked==true) page.user="stored"; else page.user="";
  sitedeltaService.putPage(page); 	
 }
}

window.addEventListener("load", sitedeltaProperties.onLoad, false);
