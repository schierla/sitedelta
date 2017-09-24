"use strict";

function startup({webExtension}) {
  Components.utils.import("chrome://sitedelta/content/Export.jsm");

  // Start the embedded webextension.
  webExtension.startup().then(api => {
    const {browser} = api;
    browser.runtime.onMessage.addListener((msg, sender, sendReply) => {
      if (msg == "getSettings") {
        Export.getSettings(sendReply);
      } else if(msg == "getPages") {
		Export.getPages(sendReply);
	  } else if(msg == "getPresets") {
		Export.getPresets(sendReply);
	  }
    });
  });
}

function shutdown(data) {
  Components.utils.unload("chrome://original-bootstrap-addon-id/content/AddonPrefs.jsm");
}