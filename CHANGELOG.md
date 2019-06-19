# kindle-periodical changelog

## 2.0.0
* change: !BREAKING now only support for Node.js Version >= 10.0.0 , using fs.promise API
* change: switch to @mozilla/readability for better support
* bugfix: async folder create errors

## 1.6.6
* bugfix: compress images in not supported format throws error #2

## 1.6.5
* bugfix: compress images in not supported format throws error

## 1.6.4
* bugfix: handle read remote errors

## 1.6.3
* bugfix: handle jimp error

## 1.6.2
* bugfix: isAbsolute from path module is incorrect
* change: try to fix image url with origin

## 1.6.1
* bugfix: .gif images crashing compressing

## 1.6.0
* add: images will now be compressed before added
* bugfix: if no cover is given empty string is added to opf.tpl
* bugfix: body tag added if already is one available
