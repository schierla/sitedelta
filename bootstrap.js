"use strict";

function setDefaultPref(prefName, prefValue) {
  var branch = Services.prefs.getDefaultBranch(null);
  switch (typeof prefValue) {
    case "number": return branch.setIntPref(prefName, prefValue);
    case "boolean": return branch.setBoolPref(prefName, prefValue);
    case "string": return branch.setCharPref(prefName, prefValue);
  }
}

function startup({ webExtension }) {
  Components.utils.import("chrome://sitedelta/content/SiteDeltaExport.jsm");
  Components.utils.import("resource://gre/modules/Services.jsm");

  Services.scriptloader.loadSubScript("chrome://sitedelta/content/defaultprefs.js", { pref: setDefaultPref });

  // Start the embedded webextension.
  webExtension.startup().then(api => {
    const { browser } = api;
    browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
      if (msg == "getSettings") {
        SiteDeltaExport.getSettings(sendReply);
      } else if (msg == "getPages") {
        SiteDeltaExport.getPages(sendReply);
      } else if (msg == "getPresets") {
        SiteDeltaExport.getPresets(sendReply);
      }
    });
  });
}

function shutdown(data) {
  Components.utils.unload("resource://gre/modules/Services.jsm");
  Components.utils.unload("chrome://sitedelta/content/SiteDeltaExport.jsm");
}

function install(data) {

}

function uninstall(data) {

}