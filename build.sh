#!/bin/bash
if [ "A$1" != "A" ]; then
  rm -rf build/unpacked
  mkdir -p build/unpacked
  rm -rf build/typescript

  cp -rp common build/unpacked/
  cp -rp $1/* build/unpacked/
  cp -rp _locales build/unpacked/

  rm -rf build/unpacked/common/scripts
  mkdir build/unpacked/common/scripts
  rm -rf build/unpacked/scripts
  mkdir build/unpacked/scripts
  if [ "A$3" == "Apack" ]; then
    yarn tsc
  else 
    yarn tsc --inlineSourceMap
    
    mkdir build/unpacked/$1
    cp -rp common/scripts/* build/unpacked/common/scripts/
    cp -rp $1/scripts build/unpacked/$1/
  fi

  cp -rp build/typescript/common/scripts/* build/unpacked/common/scripts/
  cp -rp build/typescript/$1/scripts/* build/unpacked/scripts/

  mv build/unpacked/$2.manifest.json build/unpacked/manifest.json
  rm build/unpacked/*.manifest.json
  if [ "A$3" == "Apack" ]; then
    yarn  web-ext build -s build/unpacked -a build/$2 --overwrite-dest
  elif [ "A$3" == "Arun" ]; then
    yarn web-ext run -s build/unpacked
  fi
  exit
fi

echo "Usage: build.sh (watch|highlight) (firefox|chrome) [pack|run]"
exit


