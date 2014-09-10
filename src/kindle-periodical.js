(function() {

    "use strict";

    var _               = require('underscore');
    var fs              = require('fs');
    var when            = require('when');
    var path            = require('path');
    var sanitizeHtml    = require('sanitize-html');
    var minify          = require('html-minifier').minify;
    var exec            = require('child_process').exec;

    function truncate(string, length) {

        return string.substring(0, length) + '..';
    }

    function pad(value) {

        return ("00000" + value).slice(-5);
    }


    function _checkContent(content) {

        content = content.toString();

        //cleanup html
        content = sanitizeHtml(content, {
            allowedTags: Main.supportedHTMLTags
        });

        //minify html
        content = minify(content, {
            collapseWhitespace : true,
            preserveLineBreaks : true,
            removeEmptyElements : true,
            removeEmptyAttributes : true,
            removeAttributeQuotes: true
        });

        content = content.replace(/data-src/g, 'src');
        content = content.replace(/<img>/g, '');

        return content;
    }

    function _writeFile(filename, content) {

        return when.promise(function(resolve, reject) {
            fs.writeFile(filename, content, { encoding : 'utf8' }, function(err) {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    function _getTemplate(filename) {

        return when.promise(function(resolve, reject) {
            fs.readFile( __dirname + path.sep + 'templates' + path.sep + filename + '.tpl', { encoding : 'UTF-8' }, function(err, tpl) {
                if (err) reject(err);
                else resolve(tpl);
            });
        });
    }

    var Main = {};

        Main.supportedHTMLTags = [  'a', 'address',
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

        /**
        Main.supportedHTMLTags = [  '!--...-->' '<!DOCTYPE>', '<?xml?>', '<a>', '<address>',
                                    '<article>', '<aside>', '<b>', '<blockquote>', '<body>', '<br>',
                                    '<caption>', '<center>', '<cite>', '<code>', '<col>', '<dd>',
                                    '<del>', '<dfn>', '<div>', '<dl>', '<dt>', '<em>', '<figcaption>',
                                    '<figure>', '<footer>', '<h1>', '<h2>', '<h3>', '<h4>', '<h5>', '<h6>',
                                    '<head>', '<header>', '<hgroup>', '<hr>', '<html>', '<i>', '<img>', '<ins>',
                                    '<kbd>', '<li>', '<link>', '<mark>', '<map>', '<menu>', '<ol>',
                                    '<output>', '<p>', '<pre>', '<q>', '<rp>', '<rt>', '<samp>', '<section>',
                                    '<small>', '<source>', '<span>', '<strong>', '<style>', '<strike>', '<sub>',
                                    '<sup>', '<table>', '<tbody>', '<td>', '<tfoot>', '<th>', '<thead>', '<time>',
                                    '<title>', '<tr>', '<u>', '<ul>', '<var>', '<wbr>', '<nav>', '<summary>', '<details>'
                                    ];
        **/

        Main._createNxc = function(params) {

            params = params || {};

            return when.promise(function(resolve, reject) {

                var promises = [];
                    promises.push(_getTemplate('ncx'));
                    promises.push(_getTemplate('ncx-article'));
                    promises.push(_getTemplate('ncx-section'));

                return when.all(promises)
                    .then(function(tpls) {

                        var $ncx        = _.template(tpls[0]);
                        var $article    = _.template(tpls[1]);
                        var $section    = _.template(tpls[2]);

                        var i = 0;
                        var s = 0;

                        var sectionFirst;
                        var sections = [];

                        _.each(params.sections, function(section) {

                            sectionFirst = i;

                            var articles = [];
                            _.each(section.articles, function(article) {

                                articles.push($article({
                                    playorder : i,
                                    idref : i,
                                    short_title : article.title,
                                    href : pad(i) + '.html',
                                    description : article.title,
                                    author : article.author
                                }));

                                i++;
                            });

                            if (articles.length !== 0) {
                                sections.push($section({
                                    playorder : sectionFirst,
                                    idref : 'sectionid-' + s,
                                    title : section.title,
                                    href : pad(sectionFirst) + '.html',
                                    articles : articles.join('')
                                }));
                            }

                            s++;
                        });

                       _writeFile(__dirname + '/book/nav-contents.ncx', $ncx({
                            title       : params.title,
                            author      : params.creator,
                            sections    : sections.join('')
                        })).done(function() {
                            resolve();
                        });
                    });

            });
        };

        Main._createOpf = function(params) {

            params = params || {};

            return when.promise(function(resolve, reject) {

                var promises = [];
                    promises.push(_getTemplate('opf'));
                    promises.push(_getTemplate('opf-manifest'));
                    promises.push(_getTemplate('opf-spine-item'));


                when.all(promises)
                    .then(function(tpls) {

                        var $opf            = _.template(tpls[0]);
                        var $manifest       = _.template(tpls[1]);
                        var $spineItem      = _.template(tpls[2]);

                        var manifestItems   = [];
                        var refItems        = [];

                        var i = 0;
                        _.each(params.sections, function(section) {
                            _.each(section.articles, function(article) {

                                    manifestItems.push($manifest({
                                        href    : pad(i) + '.html',
                                        media   : 'application/xhtml+xml',
                                        idref   : 'item-' + pad(i)
                                    }));

                                    refItems.push($spineItem({
                                        idref   : 'item-' + pad(i)
                                    }));

                                i++;
                            });
                        });

                        var currentDate = Date.now();

                        _writeFile( __dirname + path.sep + 'book' + path.sep + 'contents.opf', $opf({
                            doc_uuid        : currentDate,
                            title           : params.title,
                            author          : params.creator,
                            publisher       : params.publisher,
                            subject         : params.subject,
                            date            : currentDate,
                            description     : params.description,
                            manifest_items  : manifestItems.join(''),
                            spine_items     : refItems.join('')
                        })).done(function() {
                            resolve();
                        });
                    });
            });
        };


        Main._createArticleHtml = function(params) {

            params = params || {};

            return when.promise(function(resolve, reject) {

                if (!params.sections) {
                    return reject('no sections given');
                }

                var i = 0;

                var promises = [];
                _.each(params.sections, function(section) {
                    _.each(section.articles, function(article) {

                        var fileName    = __dirname + path.sep + 'book' + path.sep + pad(i) + '.html';
                        var fileContent = '<body>' + _checkContent(article.content) + '</body>';

                        promises.push(_writeFile(fileName, fileContent));

                        i++;
                    });
                });

                when.all(promises).done(function() {
                    resolve();
                });
            });
        };

        Main._createContentsHtml = function(params) {

            params = params || {};

            return when.promise(function(resolve, reject) {

                var promises = [];
                    promises.push(_getTemplate('content'));
                    promises.push(_getTemplate('content-article'));
                    promises.push(_getTemplate('content-section'));

                return when.all(promises)
                    .then(function(tpls) {

                        var $content = _.template(tpls[0]);
                        var $article = _.template(tpls[1]);
                        var $section = _.template(tpls[2]);

                        var i = 0;
                        var sections = [];
                        _.each(params.sections, function(section) {

                            var articles = [];
                            _.each(section.articles, function(article) {
                                articles.push($article({
                                    file    : pad(i) + '.html',
                                    title   : article.title
                                }));
                                i++;
                            });

                            sections.push($section({
                                title       : section.name,
                                articles    : articles.join('')
                            }));
                        });

                        _writeFile( __dirname + path.sep + 'book' + path.sep + 'contents.html', $content({
                            sections : sections.join('')
                        })).done(function() {
                            resolve();
                        });
                    });
            });
        };

        Main._createMobi = function(params, opts) {

            params  = params || {};

            opts    = opts || {};
            if (!opts.failOnError) opts.failOnError = false;

            return when.promise(function(resolve, reject) {

                var filename = opts.filename || params.title.replace(' ', '');

                var commands = [
                    'cd ' + path.normalize( __dirname + path.sep + 'book'),
                    'kindlegen -c2 contents.opf -o ' + filename + '.mobi'
                ];

                exec(commands.join(' && '), function (error, stdout, stderr) {
                    if (opts.failOnError && error) reject(error);
                    else {
                        console.log(stdout);
                        resolve(stdout);
                    }
                });
            });
        };

        Main._copyCreatedMobi = function(params, opts) {

            return when.promise(function(resolve, reject) {

                var filename = opts.filename || params.title.replace(' ', '');

                var targetPath = path.resolve(opts.target) + path.sep + filename + '.mobi';
                var sourcePath = path.normalize(__dirname + path.sep + 'book' + path.sep) + filename + '.mobi';

                if (fs.existsSync(sourcePath)) {

                    var readStream  = fs.createReadStream(sourcePath);
                        readStream.on("error", function(err) {
                            reject(err);
                        });

                    var writeStream = fs.createWriteStream(targetPath);
                        writeStream.on("close", function(err) {
                            resolve();
                        });
                        writeStream.on("error", function(err) {
                            reject(err);
                        });

                        readStream.pipe(writeStream);
                }
            });
        };

        Main._cleanup = function(params) {

            return when.promise(function(resolve, reject) {

                var sourcePath = __dirname + path.sep + 'book' + path.sep;
                fs.readdirSync(sourcePath)
                    .forEach(function(fileName) {
                        fs.unlinkSync(sourcePath + fileName);
                    });
            });
        };

        Main.create = function(params, opts) {

            params  = params    || {};

            return when.promise(function(resolve, reject) {

                Main._createArticleHtml(params)
                    .then(Main._createContentsHtml(params))
                    .then(Main._createOpf(params))
                    .then(Main._createNxc(params))
                    .then(function() {
                        return Main._createMobi(params)
                            .then(function() {
                                Main._copyCreatedMobi(params, opts)
                                    .then(function(data) {
                                        Main._cleanup(params);
                                        resolve(opts.filename || params.title.replace(' ', ''));
                                    });
                            });
                    });
            });
        };

    module.exports = {
        create  : Main.create
    };

})();
