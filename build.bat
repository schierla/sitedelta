mkdir build
del build\SiteDelta.xpi
"C:\Program Files\7-Zip\7z" a -tzip -xr!*.svn build\SiteDelta.xpi install.rdf chrome.manifest bootstrap.js chrome webextension
