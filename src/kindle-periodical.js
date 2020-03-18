(() => {
    'use strict';

    const _ = require('underscore');
    const fs = require('fs');
    const path = require('path');
    const assert = require('assert');
    const promisify = require('util').promisify;
    const readFile = promisify(fs.readFile);
    const sanitizeHtml = require('sanitize-html');
    const minify = require('html-minifier').minify;
    const exec = require('child_process').exec;
    const showdown = require('showdown');
    const converter = new showdown.Converter();

    const FileHandler = require('./file.js');
    const RemoteHandler = require('./remote.js');

    const bookFolderPath = path.join(process.cwd(), 'book');
    const mobiSupportedTags = [
        'a', 'address', 'article', 'aside', 'b', 'blockquote', 'body', 'br',
        'caption', 'center', 'cite', 'code', 'col', 'dd',
        'del', 'dfn', 'div', 'dl', 'dt', 'em', 'figcaption',
        'figure', 'footer', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'head', 'header', 'hgroup', 'hr', 'html', 'i', 'img', 'ins',
        'kbd', 'li', 'link', 'mark', 'map', 'menu', 'ol',
        'output', 'p', 'pre', 'q', 'rp', 'rt', 'samp', 'section',
        'small', 'source', 'span', 'strong', 'style', 'strike', 'sub',
        'sup', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'time',
        'title', 'tr', 'u', 'ul', 'var', 'wbr', 'nav', 'summary', 'details',
        'meta'
    ];

    function pad (value) {
        return (`00000${value}`).slice(-5);
    }

    async function checkContent (content, article) {
        content = content.toString();

        // remove not supported tags
        content = sanitizeHtml(content, {
            allowedTags      : mobiSupportedTags,
            allowedAttributes: {
                meta: [ 'charset', 'content', 'http-equiv'],
                a   : [ 'href', 'name', 'target' ],
                img : [ 'src', 'srcset' ],
                '*' :  [ 'style', 'class' ]
            }
        });

        // minify html
        content = minify(content, {
            collapseWhitespace       : true,
            preserveLineBreaks       : true,
            removeEmptyElements      : true,
            removeEmptyAttributes    : true,
            removeAttributeQuotes    : true,
            removeComments           : true,
            decodeEntities           : true,
            minifyCSS                : true,
            removeRedundantAttributes: true
        });

        content = content.replace(/data-src/g, 'src');
        content = content.replace(/<source>/g, '<source/>');
        content = content.replace(/<img>/g, '');

        if ((content.split('<body>').length - 1) === 0) {
            content = `<body>${content}</body>`;
        }

        content = await RemoteHandler.readRemoteImagesFromContent(content, article);

        return content;
    }

    function createMobiFile (filename) {
        return new Promise((resolve, reject) => {
            let commands = [
                'cd ' + path.normalize(bookFolderPath),
                `${path.resolve(__dirname, '..', 'bin/kindlegen')} -c2 contents.opf -o ${filename}.mobi`
            ];

            let kindlegenExec = exec(commands.join(' && '));

            kindlegenExec.stdout.pipe(process.stdout);
            kindlegenExec.stderr.pipe(process.stderr);
            kindlegenExec.on('close', (code) => {
                console.log(`--> .mobi file created`);
                resolve();
            });
        });
    }

    async function copyCreatedMobi (fileName, targetFolder) {
        assert.ok(fileName, 'no fileName given');

        targetFolder = targetFolder || path.join(process.cwd(), 'compiled');
        let createdMobiPath = `${path.join(bookFolderPath, fileName)}.mobi`;
        let compiledMobiPath = `${path.join(targetFolder, fileName)}.mobi`;

        await FileHandler.copyFile(createdMobiPath, compiledMobiPath);
    }

    async function createArticleHTMLFiles (article, articleNumber, sectionNumber) {
        try {
            assert.ok(typeof sectionNumber === 'number', 'sectionNumber is no number');
            assert.ok(typeof articleNumber === 'number', 'articleNumber is no number');

            let fileName = `${sectionNumber}-${pad(articleNumber)}.html`;

            let content = article.content || undefined;
            if (article.url) {
                try {
                    content = await RemoteHandler.readRemoteContent(article.url);
                } catch (err) {
                    console.log(`fail to read remote ( ${article.url} ) content: ${err.message}`);
                }
            }
            else if (article.file) {
                content = await readFile(article.file);
            }

            if (article.markdown) {
                content = converter.makeHtml(content);
            }

            console.log(`-> create article (HTML) with Name ${fileName}`);
            const checkedContent = await checkContent(content, article);
            await FileHandler.writeToBookFolder(fileName, checkedContent);

            return fileName;
        } catch (err) {
            console.log('fail to create HTML for Article');
            throw Error(err);
        }
    }

    async function createSections (availableSections = []) {
        assert.ok(availableSections, 'no sections given');

        // get template data
        const $article = _.template(await FileHandler.getTemplate('content-article'));
        const $section = _.template(await FileHandler.getTemplate('content-section'));

        // prepare sections
        let sections = [];
        for (let sectionIndex in availableSections) {
            let currentSection = availableSections[sectionIndex];

            let articles = [];
            for (let articleIndex in currentSection.articles) {
                let article = currentSection.articles[articleIndex];
                let createdFileName = await createArticleHTMLFiles(
                    article,
                    parseInt(articleIndex, 10),
                    parseInt(sectionIndex, 10)
                );

                articles.push($article({
                    file : createdFileName,
                    title: article.title
                }));
            }

            sections.push($section({
                title   : currentSection.title,
                articles: articles.join('')
            }));
        }

        return sections;
    }

    async function createContentHTMLFile (createdSections = []) {
        try {
            assert.ok(createdSections, 'no sections given');

            const $content = _.template(await FileHandler.getTemplate('content'));

            let fileName = `contents.html`;
            let fileContent = $content({
                sections: createdSections.join('')
            });

            console.log(`-> create contents (HTML) with Name ${fileName}`);
            await FileHandler.writeToBookFolder(fileName, fileContent);

            return fileName;
        } catch (err) {
            console.log('fail to create content html');
            throw Error(err);
        }
    }

    async function createOpfHTMLFile (params = {}) {
        try {
            assert.ok(params, 'no params given');

            const $opf = _.template(await FileHandler.getTemplate('opf'));
            const $opfManifest = _.template(await FileHandler.getTemplate('opf-manifest'));
            const $opfSpineItem = _.template(await FileHandler.getTemplate('opf-spine-item'));

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

            let cover = '';
            if (params.cover) {
                cover = path.basename(params.cover);
            }

            let fileName = 'contents.opf';
            console.log(`-> create opf (HTML) with Name ${fileName}`);
            await FileHandler.writeToBookFolder(fileName, $opf({
                doc_uuid      : currentDate,
                title         : params.title,
                author        : params.creator,
                cover         : cover,
                publisher     : params.publisher,
                subject       : params.subject,
                language      : params.language || 'en-gb',
                date          : dateString,
                description   : params.description,
                manifest_items: manifestItems.join(''),
                spine_items   : refItems.join('')
            }));

            return fileName;
        } catch (err) {
            console.log('fail to create opf html file');
            throw Error(err);
        }
    }

    async function createNsxHTMLFile (params = {}) {
        assert.ok(params, 'no params given');

        const $ncx = _.template(await FileHandler.getTemplate('ncx'));
        const $ncxArticle = _.template(await FileHandler.getTemplate('ncx-article'));
        const $ncxSection = _.template(await FileHandler.getTemplate('ncx-section'));

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
        FileHandler.writeToBookFolder(fileName, $ncx({
            title   : params.title,
            author  : params.creator,
            sections: sections.join('')
        }));

        return fileName;
    }

    exports.create = async function (params = {}, opts = {}) {
        try {
            assert.ok(params.title, 'no title given');
            assert.ok(params.sections, 'no sections given');

            await FileHandler.cleanupBookFolder();
            await FileHandler.createFolder(bookFolderPath);

            if (params.cover) {
                await FileHandler.copyFile(params.cover, path.join(bookFolderPath, path.basename(params.cover)));
            }

            let createdSections = await createSections(params.sections);
            await createContentHTMLFile(createdSections);
            await createOpfHTMLFile(params);
            await createNsxHTMLFile(params);

            let filename = opts.filename || params.title.replace(' ', '');
            await createMobiFile(filename);
            await copyCreatedMobi(filename, opts.targetFolder);

            return true;
        } catch (err) {
            console.log('fail to create .mobi');
            throw Error(err);
        }
    };
})();
