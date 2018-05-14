(() => {
    'use strict';

    const self = this;

    const fs = require('fs');
    const path = require('path');
    const assert = require('assert');
    const promisify = require('util').promisify;
    const readFile = promisify(fs.readFile);
    const fileStat = promisify(fs.stat);
    const writeFile = promisify(fs.writeFile);
    const mkdir = promisify(fs.mkdir);
    const rimraf = require('rimraf');

    const bookFolderPath = path.join(process.cwd(), 'book');

    exports.getTemplate = function (filename) {
        let fileName = `${filename}.tpl`;
        let filePath = path.join(__dirname, 'templates', fileName);

        return readFile(filePath, {
            encoding: 'UTF-8'
        });
    };

    exports.checkIfFileExists = async function (filePath, notExistCallback) {
        try {
            await fileStat(filePath);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw Error(err);
            }
            await notExistCallback();
        }
    };

    exports.createFolder = function (fileFolder) {
        return self.checkIfFileExists(fileFolder, () => {
            return mkdir(fileFolder)
                .catch((err) => {
                    if (err.code !== 'EEXIST') {
                        throw Error(err);
                    }
                });
        });
    };

    exports.copyFile = async function (sourceFilePath, targetFolder) {
        let fileExists = true;
        await self.createFolder(path.dirname(targetFolder));
        await self.checkIfFileExists(sourceFilePath, () => {
            fileExists = false;
        });

        if (fileExists) {
            fs.createReadStream(sourceFilePath)
                .pipe(fs.createWriteStream(targetFolder));
        }
    };

    exports.writeToBookFolder = async function (fileName, fileContent) {
        assert.ok(fileName, 'no filename given');
        assert.ok(fileContent, 'no content given');

        // create folder if not exists
        await self.createFolder(bookFolderPath);

        return writeFile(path.join(bookFolderPath, fileName), fileContent, 'utf8');
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
