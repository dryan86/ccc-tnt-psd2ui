#!/bin/bash

# 安装必要的包
brew install pkg-config cairo pango libpng jpeg giflib librsvg pixman

if [ $? -eq 0 ]; then
    ln -s /opt/homebrew/Cellar/jpeg/9e/lib/libjpeg.9.dylib /opt/homebrew/opt/jpeg-turbo/lib/libjpeg.8.dylib
else
    echo "Failed to install some packages, exiting."
    exit 1
fi

