@echo off
echo psd2ui:: Drag and drop a file or folder
set /p var=

node ./dist/index.js --engine-version v342 --pinyin --input %var%
pause
