"use strict";

var EXPORTED_SYMBOLS = ["Export"];

Components.utils.import("resource://gre/modules/Services.jsm");

const BASE_PREF = "extensions.original-bootstrap-addon-id.";

function getSettings(callback) {
	
}

function getPages(callback) {
	
}

function getPresets(callback) {
	
}

function get(key, type = "char") {
  key = BASE_PREF + key;

  switch(type) {
  case "char":
    return Services.prefs.getCharPref(key);
  case "bool":
    return Services.prefs.getBoolPref(key);
  case "int":
    return Services.prefs.getIntPref(key);
  }

  throw new Error(`Unknown type: ${type}`);
}

var Export = {
  getSettings, getPages, getPresets
};