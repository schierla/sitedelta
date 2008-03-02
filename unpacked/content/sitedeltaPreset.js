var sitedeltaPreset = {
onLoad: function() {
 sitedeltaPreset.listPresets();
},
listPresets: function() {
 var list=document.getElementById("presets");
 while(list.getRowCount()>0) list.removeItemAt(0);
 var presets=sitedeltaService.listPresets();
 for(var i=0; i<presets.length; i++) {
  var preset=sitedeltaService.getPreset(presets[i]);
  var item=list.appendItem(preset.name,presets[i]);
  if(window.arguments[0]==presets[i]) list.selectItem(item);
 }
},
showDetails: function() {
 var file=document.getElementById("presets").getSelectedItem(0);
 var url=""; var include=""; var exclude=""; var name="";
 var checkImages=null, checkDeleted=false, ignoreNumbers=null, ignoreCase=null;
 if(file) {
  var result=sitedeltaService.getPreset(file.value);
  url=result.url; 
  for(var i=0; i<result.includes.length; i++) include+=result.includes[i]+"\n";
  for(var i=0; i<result.excludes.length; i++) exclude+=result.excludes[i]+"\n";
  name=result.name;
  checkImages=result.scanImages; ignoreCase=result.ignoreCase; checkDeleted=result.checkDeleted; ignoreNumbers=result.ignoreNumbers;
 }
 document.getElementById("url").value=url;
 document.getElementById("include").value=include;
 document.getElementById("name").value=name;
 document.getElementById("exclude").value=exclude;
 document.getElementById("name").disabled=false;
 document.getElementById("url").disabled=false;
 sitedeltaPreset.setCheckbox(document.getElementById("checkimages"), checkImages);
 sitedeltaPreset.setCheckbox(document.getElementById("checkdeleted"), checkDeleted);
 sitedeltaPreset.setCheckbox(document.getElementById("ignorenumbers"), ignoreNumbers);
 sitedeltaPreset.setCheckbox(document.getElementById("ignorecase"), ignoreCase);
},
getItemStatus: function(item) {
 switch(item.selectedIndex) {
  case 0: return null;
  case 1: return true;
  case 2: return false;
 }
},
saveData: function() {
 var file=document.getElementById("presets").getSelectedItem(0);
 if(file) {
  var result=sitedeltaService.getPreset(file.value);
  result.url= document.getElementById("url").value;
  result.name = document.getElementById("name").value;
 
  result.scanImages=sitedeltaPreset.getItemStatus(document.getElementById("checkimages"));
  result.checkDeleted=sitedeltaPreset.getItemStatus(document.getElementById("checkdeleted"));
  result.ignoreCase=sitedeltaPreset.getItemStatus(document.getElementById("ignorecase")); 
  result.ignoreNumbers=sitedeltaPreset.getItemStatus(document.getElementById("ignorenumbers")); 
  
  sitedeltaService.putPreset(result, file.value);
  file.setAttribute("label", result.name);
 }
},
setCheckbox: function(item, value) {
 if(value==null) item.selectedIndex=0;
 else if(value==false) item.selectedIndex=2;
 else if(value==true) item.selectedIndex=1;
},
duplicate: function() {
 var file=document.getElementById("presets").getSelectedItem(0);
 if(!file) return;
 var result=sitedeltaService.getPreset(file.value);
 sitedeltaService.newPreset(result);
 sitedeltaPreset.listPresets();
}, 
delete: function() {
 var file=document.getElementById("presets").getSelectedItem(0);
 if(!file) return;
 var fn=file.value;
 sitedeltaService.deletePreset(fn);
 sitedeltaPreset.listPresets();
}
};