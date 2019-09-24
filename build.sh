#!/bin/bash
if [ "A$1" != "A" ]; then
  rm -rf build/unpacked
  mkdir -p build/unpacked
  cp -rp $1/* build/unpacked/
  cp -rp common build/unpacked/
  cp -rp _locales build/unpacked/
  rm -rf build/common/scripts
  rm -rf build/scripts
  cp -rp build/typescript/common/scripts build/unpacked/common/
  cp -rp build/typescript/$1/scripts build/unpacked/
  mv build/unpacked/$2.manifest.json build/unpacked/manifest.json
  rm build/unpacked/*.manifest.json
  if [ "A$3" == "Apack" ]; then
    web-ext build -s build/unpacked -a build/$2 --overwrite-dest
  elif [ "A$3" == "Arun" ]; then
    web-ext run -s build/unpacked
  fi
  exit
fi

echo "Usage: build.sh (watch|highlight) (firefox|chrome) [pack|run]"
exit


