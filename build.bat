cd unpacked
del ..\chrome\sitedelta.jar
"C:\Program Files\7-Zip\7z" a -tzip -xr!*.svn ..\chrome\sitedelta.jar content locale skin
cd ..
del SiteDelta.xpi
"C:\Program Files\7-Zip\7z" a -tzip -xr!*.svn SiteDelta.xpi install.rdf chrome defaults components
cd unpacked
"C:\Program Files\7-Zip\7z" a -tzip -xr!*.svn ..\SiteDelta.xpi chrome.manifest
cd ..
