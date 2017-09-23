#!/bin/bash
if [ "A$1" != "A" ]; then
  rm -rf build/unpacked
  mkdir -p build/unpacked
  cp -rp $1/* build/unpacked
  mv build/unpacked/$2.manifest.json build/unpacked/manifest.json
  rm build/unpacked/*.manifest.json
  web-ext build -s build/unpacked -a build/$2 --overwrite-dest
  rm -rf build/unpacked
  exit
fi

echo "Usage: build.sh (watch|highlight) (firefox|chrome)"
exit


