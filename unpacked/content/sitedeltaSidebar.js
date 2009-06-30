var sitedeltaSidebar = {
onLoad: function() {
 var list=document.getElementById("sitedeltaPages");
 list.database.AddDataSource(sitedeltaService.RDF);
 list.builder.rebuild();
},
openCurrent: function() {
 var gBrowser = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow).getBrowser();
 for(var i=0; i<document.getElementById("sitedeltaPages").selectedCount; i++)
  gBrowser.selectedTab=gBrowser.addTab(document.getElementById("sitedeltaPages").getSelectedItem(i).id);
},
updateCurrent: function() {
 for(var i=0; i<document.getElementById("sitedeltaPages").selectedCount; i++)
  sitedeltaService.updatePage(document.getElementById("sitedeltaPages").getSelectedItem(i).id);
},
markSeen: function() {
 for(var i=0; i<document.getElementById("sitedeltaPages").selectedCount; i++)
  sitedeltaService.markSeen(document.getElementById("sitedeltaPages").getSelectedItem(i).id);
},
openChanged: function() {
 var gBrowser = window.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIWebNavigation).QueryInterface(Components.interfaces.nsIDocShellTreeItem).rootTreeItem.QueryInterface(Components.interfaces.nsIInterfaceRequestor).getInterface(Components.interfaces.nsIDOMWindow).getBrowser();
 for(var i=0; document.getElementById("sitedeltaPages").getItemAtIndex(i); i++)
  if(document.getElementById("sitedeltaPages").getItemAtIndex(i).getAttribute("status")==1)
   gBrowser.selectedTab=gBrowser.addTab(document.getElementById("sitedeltaPages").getItemAtIndex(i).id);
},
updateAll: function() {
// sitedeltaService.updateAll();
 for(var i=0; document.getElementById("sitedeltaPages").getItemAtIndex(i); i++)
  sitedeltaService.updatePage(document.getElementById("sitedeltaPages").getItemAtIndex(i).id);	
},
deletePage: function() {
 var pages=[]; 
 for(var i=0; i<document.getElementById("sitedeltaPages").selectedCount; i++)
  pages.push(document.getElementById("sitedeltaPages").getSelectedItem(i).id);
 for(var i=0; i<pages.length; i++) sitedeltaService.deletePage(pages[i]); 
},
showManager: function(e) {
 var file=document.getElementById("sitedeltaPages").getSelectedItem(0);
 if(!file) return;
 var result=sitedeltaService.getPage(file.id);
 return sitedelta.showProperties(result.url);
},
doSearch: function(text) {
 var found=null, sp=document.getElementById("sitedeltaPages");
 for(var i=sp.getRowCount()-1; i>=0; i--) {
  if(sp.getItemAtIndex(i).getAttribute("label").toLowerCase().indexOf(text.toLowerCase())!=-1 || sp.getItemAtIndex(i).id.toLowerCase().indexOf(text.toLowerCase())!=-1) {
   if(!sp.getItemAtIndex(i).selected) sp.toggleItemSelection(sp.getItemAtIndex(i));
   found = sp.getItemAtIndex(i);
  } else {
   if(sp.getItemAtIndex(i).selected) sp.toggleItemSelection(sp.getItemAtIndex(i));  	  	
  }
 }
 if(found!=null) sp.ensureElementIsVisible(found);
},
keyDown: function(e) {
 if(e.altKey && e.keyCode==13) {
  sitedeltaSidebar.showManager();
 } else if(e.ctrlKey) { 
  if(e.keyCode==32) {
   sitedeltaSidebar.updateCurrent();
  } else if(e.keyCode==13) {
   sitedeltaSidebar.openCurrent();
  } else if(e.keyCode==46) {
   sitedeltaSidebar.deletePage();
  } else if(e.keyCode==8) {
   sitedeltaSidebar.markSeen();
  } else {
   return;
  }
 } else {
  return;
 }
 sitedelta.preventevent(e);
}
}

window.addEventListener("load", sitedeltaSidebar.onLoad, false);
