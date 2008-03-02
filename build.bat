cd unpacked
del ..\chrome\sitedelta.jar
"C:\Program Files\7-Zip\7z" a -tzip ..\chrome\sitedelta.jar content locale skin
cd ..
del SiteDelta.xpi
"C:\Program Files\7-Zip\7z" a -tzip SiteDelta.xpi a install.rdf chrome defaults components
cd unpacked
"C:\Program Files\7-Zip\7z" a -tzip ..\SiteDelta.xpi a chrome.manifest
cd ..
