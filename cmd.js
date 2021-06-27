#!/usr/bin/env node

const { exit } = require('process');

(() => {
    'use strict';

    const fs = require('fs');
    const argv = require('minimist')(process.argv.slice(2));
    const kindlePeriodical = require('.');

    let filename = argv.filename || argv.f || null;
    let targetFolder = argv.output || argv.o || null;
    let maxImageWidth = argv.maxImageWidth || null;
    let maxImageHeight = argv.maxImageHeight || null;
    let saveImageGrayscale = argv.saveImageGrayscale || false;
    let saveImageJpeg = argv.saveImageJpeg || false;

    let opts = {};
    if (filename) opts.filename = filename;
    if (targetFolder) opts.targetFolder = targetFolder;
    if (maxImageWidth) opts.maxImageWidth = maxImageWidth;
    if (maxImageHeight) opts.maxImageHeight = maxImageHeight;
    if (saveImageGrayscale) opts.saveImageGrayscale = saveImageGrayscale;
    if (saveImageJpeg) opts.saveImageJpeg = saveImageJpeg;

    if ((maxImageWidth && !maxImageHeight) || (maxImageHeight && !maxImageWidth)) {
        console.log('Parameters maxImageWidth and maxImageHeight has to be set both or none.');
        exit();
    }

    let bookData = JSON.parse(fs.readFileSync(argv._[0], 'utf8'));
    kindlePeriodical.create(bookData, opts);
})();
