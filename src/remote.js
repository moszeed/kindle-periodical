(() => {
    'use strict';

    const fs = require('fs');
    const path = require('path');
    const URL = require('url').URL;
    const promisify = require('util').promisify;
    const fileStat = promisify(fs.stat);
    const writeFile = promisify(fs.writeFile);

    const jsdom = require('jsdom');
    const fetch = require('node-fetch');
    const download = require('download');
    const readability = require('readability');
    const jimp = require('jimp');
    const isAbsoluteUrl = require('is-absolute-url');

    const { JSDOM } = jsdom;

    const FileHandler = require('./file.js');

    const maxImageSizeMb = 5;
    const bookFolderPath = path.join(process.cwd(), 'book');

    async function isUrlAvailable (link) {
        try {
            const response = await fetch(link, { method: 'HEAD' });
            if (response.status !== 200) {
                return false;
            }
            return true;
        } catch (err) {
            console.log(`fail to check link: ${link}`);
            throw Error(err);
        }
    }

    async function compressImage (imgFilePath, opts) {
        const PNG_DEFLATE_LEVEL = 1;
        const JPEG_QUALITY_VALUE = 60;

        const imgExtension = opts.saveImageJpeg ? ".jpg" : path.extname(imgFilePath);
        const imgFileName = path.basename(imgFilePath, imgExtension);
        const compressFileName = `${imgFileName}-small${imgExtension}`;
        const compressFileFullPath = path.join(path.dirname(imgFilePath), compressFileName);

        function writeImage (image, pathToSave) {
            return new Promise((resolve, reject) => {
                image.write(pathToSave, (err) => {
                    if (err) throw Error(err);
                    resolve(pathToSave);
                });
            });
        }

        if (imgExtension.includes('svg')) {
            return false;
        }

        return jimp.read(imgFilePath)
            .then((image) => {
                try {
                    const mime = image.getMIME();

                    if (opts.maxImageWidth && opts.maxImageHeight) {
                        image.scaleToFit(opts.maxImageWidth, opts.maxImageHeight);
                    }

                    if (opts.saveImageGrayscale) {
                        image.color([
                            { apply: 'greyscale', params: [16] }  // kindle reader has 16 gray levels
                        ]);
                        image.normalize();
                    }

                    if (mime === jimp.MIME_JPEG || opts.saveImageJpeg) {
                        return writeImage(image.quality(JPEG_QUALITY_VALUE), compressFileFullPath);
                    } else if (mime === jimp.MIME_PNG) {
                        return writeImage(image.deflateLevel(PNG_DEFLATE_LEVEL), compressFileFullPath);
                    }
                } catch (err) {
                    console.log(err);
                }

                return imgFilePath;
            })
            .catch((err) => {
                console.log('fail to read image:');
                console.log(err);
                return false;
            });
    }

    async function guessExtension(imageFilename) {
        console.log(`Guessing extension for: ${imageFilename}`);
        let extension = '';
        try {
            await jimp.read(imageFilename)
                .then((image) => {
                        const mime = image.getMIME();
                        console.log(`MIME: ${mime}`);
                        if (mime === jimp.MIME_PNG) {
                            extension = '.png';
                        } else if (mime === jimp.MIME_JPEG) {
                            extension = '.jpg';
                        }
                });
        } catch (err) {
            console.log(`Error when guessing extension: ${err}`);
        }

        return extension;
    }

    exports.readRemoteImagesFromContent = async function (content, article, opts) {
        const dom = new JSDOM(content);

        // download images
        let imgs = dom.window.document.querySelectorAll('img');
        if (imgs.length !== 0) {
            console.log(`\n   found ${imgs.length} images, now downloading:`);
            for (let img of imgs) {
                let extension = path.extname(img.src);
                const baseName = path.basename(img.src, extension);
                const cleanedBaseName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

                let cleanedFileName = cleanedBaseName + extension;
                let cleanedImagePath = path.join(process.cwd(), 'book', cleanedFileName);

                // some webservers use lazy loading of images
                if (img['data-src']) {
                    img.src = img['data-src'];
                }

                // check if absolute url, try to fix if not
                if (!isAbsoluteUrl(img.src)) {
                    if (article.url) {
                        img.src = new URL(img.src, article.url).href;
                    }
                }

                // check if image is available
                try {
                    const isImageAvailable = await isUrlAvailable(img.src);
                    if (!isImageAvailable) {
                        const articleOrigin = new URL(article.url).origin;
                        img.src = img.src.replace(article.url, `${articleOrigin}/`);

                        const isFixedImageAvailable = await isUrlAvailable(img.src);
                        if (!isFixedImageAvailable) {
                            img.remove();
                            continue;
                        }
                    }
                } catch (err) {
                    console.log(`error check link: ${err.message}`);
                    img.remove();
                    continue;
                }

                if (!extension || extension !== '') {
                    // some webservers are not using extensions for some reason
                    extension = await guessExtension(img.src);
                    console.log(`Image ${img.src}: extension guessed to ${extension}.`);

                    cleanedImagePath += extension;
                    cleanedFileName += extension;
                }

                console.log(`\n   from: ${img.src}`);
                console.log(`   to: ${cleanedImagePath}`);

                await download(img.src)
                    .then(data => writeFile(cleanedImagePath, data))
                    .catch((err) => {
                        console.log(`fail to download image: ${err.message}`);
                    });

                let compressImagesPath = cleanedImagePath;
                if (extension !== '') {
                    compressImagesPath = await compressImage(cleanedImagePath, opts);
                    if (!compressImagesPath) {
                        compressImagesPath = cleanedImagePath;
                    }
                }

                // get file zizes
                let fstatCompress = await fileStat(compressImagesPath);
                img.src = path.basename(compressImagesPath);

                let fstatCleaned = await fileStat(cleanedImagePath);
                if (fstatCompress.size > fstatCleaned.size) {
                    img.src = cleanedFileName;
                    if (fstatCleaned.size / Math.pow(1024.0, 2) > maxImageSizeMb) {
                        img.remove();
                    }
                } else {
                    if (fstatCompress.size / Math.pow(1024.0, 2) > maxImageSizeMb) {
                        img.remove();
                    }
                }
            }
        }

        return dom.serialize();
    };

    exports.readRemoteContent = async function (url) {
        // get content from url
        const dom = await JSDOM.fromURL(url);

        // simplify
        const reader = new readability(dom.window.document);
        const article = reader.parse();

        var content = new JSDOM(article.content);

        // add a utf8 header
        content.window.document.head.insertAdjacentHTML('beforeend', '<meta content="text/html; charset=utf-8" http-equiv="Content-Type"/>');

        // return content
        return content.serialize();
    };
})();
