(() => {
    'use strict';

    const fsSync = require('fs');
    const fs = fsSync.promises;

    const path = require('path');
    const assert = require('assert');
    const rimraf = require('rimraf');

    const bookFolderPath = path.join(process.cwd(), 'book');

    exports.getTemplate = function (filename) {
        let fileName = `${filename}.tpl`;
        let filePath = path.join(__dirname, 'templates', fileName);

        return fs.readFile(filePath, {
            encoding: 'UTF-8'
        });
    };

    exports.checkIfFileExists = async function (filePath) {
        try {
            await fs.stat(filePath);
            return true;
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw Error(err);
            }

            return false;
        }
    };

    exports.createFolder = async function (fileFolder) {
        try {
            const exist = await this.checkIfFileExists(fileFolder);
            if (!exist) {
                await fs.mkdir(fileFolder)
            }

        } catch (err) {
            if (err.code !== 'EEXIST') {
                console.error(`fail to create folder: ${fileFolder}`);
                throw Error(err);
            }
        }
    };

    exports.copyFile = async function (sourceFilePath, targetFolder) {
        await this.createFolder(path.dirname(targetFolder));

        const fileExists = await this.checkIfFileExists(sourceFilePath);
        if (fileExists) {
            fsSync.createReadStream(sourceFilePath)
                .pipe(fsSync.createWriteStream(targetFolder));
        }
    };

    exports.writeToBookFolder = async function (fileName, fileContent) {
        assert.ok(fileName, 'no filename given');
        assert.ok(fileContent, 'no content given');

        // create folder if not exists
        await this.createFolder(bookFolderPath);

        return fs.writeFile(path.join(bookFolderPath, fileName), fileContent, 'latin1');
    };

    exports.cleanupBookFolder = function () {
        return new Promise((resolve, reject) => {
            rimraf(bookFolderPath, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    };
})();
