#!/usr/bin/env node
(() => {
    'use strict';

    const fs = require('fs');
    const argv = require('minimist')(process.argv.slice(2));
    const kindlePeriodical = require('.');

    let filename = argv.filename || argv.f || null;
    let targetFolder = argv.output || argv.o || null;

    let opts = {};
    if (filename) opts.filename = filename;
    if (targetFolder) opts.targetFolder = targetFolder;

    let bookData = JSON.parse(fs.readFileSync(argv._[0], 'utf8'));
    kindlePeriodical.create(bookData, opts);
})();
