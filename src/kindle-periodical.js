(() => {
    'use strict';

    const fs = require('fs');
    const path = require('path');
    const assert = require('assert');
    const promisify = require('util').promisify;
    const writeFile = promisify(fs.writeFile);
    const readFile = promisify(fs.readFile);
    const fileStat = promisify(fs.stat);
    const mkdir = promisify(fs.mkdir);
    const _ = require('underscore');
    const sanitizeHtml = require('sanitize-html');
    const minify = require('html-minifier').minify;
    const exec = require('child_process').exec;
    const rimraf = require('rimraf');

    const mobiSupportedTags = [
        'a', 'address',
        'article', 'aside', 'b', 'blockquote', 'body', 'br',
        'caption', 'center', 'cite', 'code', 'col', 'dd',
        'del', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption',
        'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'ins',
        'kbd', 'li', 'link', 'mark', 'map', 'menu', 'ol',
        'output', 'p', 'pre', 'q', 'rp', 'rt', 'samp', 'section',
        'small', 'source', 'span', 'strong', 'style', 'strike', 'sub',
        'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time',
        'title', 'tr', 'u', 'ul', 'var', 'wbr', 'nav', 'summary', 'details'
    ];

    function pad (value) {
        return (`00000${value}`).slice(-5);
    }

    function getTemplate (filename) {
        let fileName = `${filename}.tpl`;
        let filePath = path.join(__dirname, 'templates', fileName);

        return readFile(filePath, {
            encoding: 'UTF-8'
        });
    }

    function checkContent (content) {
        content = content.toString();
        content = sanitizeHtml(content, {
            allowedTags: mobiSupportedTags
        });

        // minify html
        content = minify(content, {
            collapseWhitespace   : true,
            preserveLineBreaks   : true,
            removeEmptyElements  : true,
            removeEmptyAttributes: true,
            removeAttributeQuotes: true
        });

        content = content.replace(/data-src/g, 'src');
        content = content.replace(/<img>/g, '');

        return content;
    }

    async function checkIfFileExists (filePath, notExistCallback) {
        try {
            await fileStat(filePath);
        } catch (err) {
            if (err.code !== 'ENOENT') {
                throw Error(err);
            }
            await notExistCallback();
        }
    }

    function createFolder (fileFolder) {
        return checkIfFileExists(fileFolder, () => {
            return mkdir(fileFolder)
                .catch((err) => {
                    if (err.code !== 'EEXIST') {
                        throw Error(err);
                    }
                });
        });
    }

    async function writeToBookFolder (fileName, fileContent) {
        assert.ok(fileName, 'no filename given');
        assert.ok(fileContent, 'no content given');

        let fileFolder = path.join(process.cwd(), 'book');

        // create folder if not exists
        await createFolder(fileFolder);

        return writeFile(path.join(fileFolder, fileName), fileContent);
    }

    async function copyCreatedMobi (fileName) {
        assert.ok(fileName, 'no fileName given');
        let bookFolder = path.join(process.cwd(), 'book');
        let targetFolder = path.join(process.cwd(), 'compiled');

        await createFolder(targetFolder);

        fs.createReadStream(`${path.join(bookFolder, fileName)}.mobi`)
            .pipe(fs.createWriteStream(`${path.join(targetFolder, fileName)}.mobi`));
    }

    function cleanupBookFolder () {
        return new Promise((resolve, reject) => {
            rimraf(path.join(process.cwd(), 'book'), (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async function createArticleHTMLFiles (article, articleNumber, sectionNumber) {
        try {
            assert.ok(typeof sectionNumber === 'number', 'sectionNumber is no number');
            assert.ok(typeof articleNumber === 'number', 'articleNumber is no number');

            let fileName = `${sectionNumber}-${pad(articleNumber)}.html`;
            let fileContent = '<body>' + checkContent(article.content) + '</body>';

            console.log(`-> create article (HTML) with Name ${fileName}`);
            await writeToBookFolder(fileName, fileContent);

            return fileName;
        } catch (err) {
            console.log('fail to create HTML for Article');
            throw Error(err);
        }
    }

    async function createSections (availableSections = []) {
        assert.ok(availableSections, 'no sections given');

        // get template data
        const $article = _.template(await getTemplate('content-article'));
        const $section = _.template(await getTemplate('content-section'));

        // prepare sections
        let sections = [];
        for (let sectionIndex in availableSections) {
            let currentSection = availableSections[sectionIndex];

            let articles = [];
            await Promise.all(currentSection.articles.map(async (article, articleIndex) => {
                let createdFileName = await createArticleHTMLFiles(article, articleIndex, parseInt(sectionIndex, 10));
                articles.push($article({
                    file : createdFileName,
                    title: article.title
                }));
            }));

            sections.push($section({
                title   : currentSection.title,
                articles: articles.join('')
            }));
        }

        return sections;
    }

    async function createContentHTMLFile (createdSections = []) {
        assert.ok(createdSections, 'no sections given');

        const $content = _.template(await getTemplate('content'));

        let fileName = `contents.html`;
        let fileContent = $content({
            sections: createdSections.join('')
        });

        console.log(`-> create contents (HTML) with Name ${fileName}`);
        await writeToBookFolder(fileName, fileContent);

        return fileName;
    }

    async function createOpfHTMLFile (params = {}) {
        assert.ok(params, 'no params given');

        const $opf = _.template(await getTemplate('opf'));
        const $opfManifest = _.template(await getTemplate('opf-manifest'));
        const $opfSpineItem = _.template(await getTemplate('opf-spine-item'));

        const manifestItems = [];
        const refItems = [];

        for (let sectionIndex in params.sections) {
            let currentSection = params.sections[sectionIndex];
            for (let articleIndex in currentSection.articles) {
                let fileName = `${sectionIndex}-${pad(articleIndex)}`;
                let idrefName = `item-${fileName}`;
                manifestItems.push($opfManifest({
                    href : `${fileName}.html`,
                    media: 'application/xhtml+xml',
                    idref: idrefName
                }));

                refItems.push($opfSpineItem({
                    idref: idrefName
                }));
            }
        }

        let currentDate = Date.now();
        let dateString = new Date();
        dateString = dateString.getFullYear() + '-' + (dateString.getMonth() + 1) + '-' + dateString.getDay();

        let fileName = 'contents.opf';

        console.log(`-> create opf (HTML) with Name ${fileName}`);
        await writeToBookFolder(fileName, $opf({
            doc_uuid      : currentDate,
            title         : params.title,
            author        : params.creator,
            publisher     : params.publisher,
            subject       : params.subject,
            date          : dateString,
            description   : params.description,
            manifest_items: manifestItems.join(''),
            spine_items   : refItems.join('')
        }));

        return fileName;
    }

    async function createNsxHTMLFile (params = {}) {
        assert.ok(params, 'no params given');

        const $ncx = _.template(await getTemplate('ncx'));
        const $ncxArticle = _.template(await getTemplate('ncx-article'));
        const $ncxSection = _.template(await getTemplate('ncx-section'));

        var sections = [];
        for (let sectionIndex in params.sections) {
            let currentSection = params.sections[sectionIndex];
            let sectionFirst = sectionIndex;

            let articles = [];
            for (let articleIndex in currentSection.articles) {
                let currentArticle = currentSection.articles[articleIndex];

                articles.push($ncxArticle({
                    playorder  : sectionIndex,
                    idref      : sectionIndex,
                    short_title: currentArticle.title,
                    href       : `${sectionIndex}-${pad(articleIndex)}.html`,
                    description: currentArticle.title,
                    author     : currentArticle.author
                }));
            }

            if (articles.length !== 0) {
                sections.push($ncxSection({
                    playorder: sectionFirst,
                    idref    : `sectionid-${sectionIndex}`,
                    title    : currentSection.title,
                    href     : `${sectionIndex}-${pad(0)}.html`, // ?
                    articles : articles.join('')
                }));
            }
        }

        let fileName = 'nav-contents.ncx';
        console.log(`-> create ncx (HTML) with Name ${fileName}`);
        writeToBookFolder(fileName, $ncx({
            title   : params.title,
            author  : params.creator,
            sections: sections.join('')
        }));

        return fileName;
    }

    function createMobiFile (filename) {
        return new Promise((resolve, reject) => {
            let bookFolder = path.join(process.cwd(), 'book');
            let commands = [
                'cd ' + path.normalize(bookFolder),
                `${path.resolve(__dirname, '..', 'bin/kindlegen')} -c2 contents.opf -o ${filename}.mobi`
            ];

            let kindlegenExec = exec(commands.join(' && '), () => {
                resolve();
            });

            kindlegenExec.stdout.pipe(process.stdout);
            kindlegenExec.stderr.pipe(process.stderr);
        });
    }

    exports.create = async function (params = {}, opts = {}) {
        try {
            assert.ok(params.title, 'no title given');
            assert.ok(params.sections, 'no sections given');

            await cleanupBookFolder();
            let createdSections = await createSections(params.sections);
            await createContentHTMLFile(createdSections);
            await createOpfHTMLFile(params);
            await createNsxHTMLFile(params);

            let filename = opts.filename || params.title.replace(' ', '');
            await createMobiFile(filename);
            await copyCreatedMobi(filename);

            return true;
        } catch (err) {
            console.log('fail to create .mobi');
            throw Error(err);
        }
    };
})();
