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
    const read = require('node-readability');
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

    async function compressImage (imgFilePath) {
        const imgExtension = path.extname(imgFilePath);
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

        return jimp.read(imgFilePath)
            .then((image) => {
                try {
                    if (image.getExtension() === 'png' &&
                        image.getMIME() === jimp.MIME_PNG) {
                        return writeImage(image.deflateLevel(1), compressFileFullPath);
                    }

                    if (image.getExtension() === 'jpeg' &&
                        image.getMIME() === jimp.MIME_JPEG) {
                        return writeImage(image.quality(60), compressFileFullPath);
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

    exports.readRemoteImagesFromContent = async function (content, article) {
        const dom = new JSDOM(content);

        // download images
        let imgs = dom.window.document.querySelectorAll('img');
        if (imgs.length !== 0) {
            console.log(`\n   found ${imgs.length} images, now downloading:`);
            for (let img of imgs) {
                const extension = path.extname(img.src);
                const baseName = path.basename(img.src, extension);
                const cleanedBaseName = baseName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
                const cleanedFileName = cleanedBaseName + extension;
                const cleanedImagePath = path.join(process.cwd(), 'book', cleanedFileName);

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

                console.log(`\n   from: ${img.src}`);
                console.log(`   to: ${cleanedImagePath}`);

                await download(img.src)
                    .then(data => writeFile(cleanedImagePath, data))
                    .catch((err) => {
                        console.log(`fail to download image: ${err.message}`);
                    });

                let compressImagesPath = cleanedImagePath;
                if (extension !== '') {
                    compressImagesPath = await compressImage(cleanedImagePath);
                    if (!compressImagesPath) {
                        compressImagesPath = cleanedImagePath;
                    }
                }

                // get file zizes
                let fstatCompress = await fileStat(compressImagesPath);
                img.src = compressImagesPath;

                let fstatCleaned = await fileStat(cleanedImagePath);
                if (fstatCompress.size > fstatCleaned.size) {
                    img.src = cleanedImagePath;
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

    exports.readRemoteContent = function (url) {
        return new Promise((resolve, reject) => {
            read(url, { encoding: 'utf8' }, async (err, article, meta) => {
                if (err) reject(err);
                else {
                    await FileHandler.createFolder(bookFolderPath);

                    // create a new JSOM object
                    const dom = new JSDOM(article.content);
                    article.close();

                    // add a utf8 header
                    dom.window.document.head.insertAdjacentHTML('beforeend', '<meta charset="utf-8">');
                    resolve(dom.serialize());
                }
            });
        });
    };
})();
