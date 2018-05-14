(() => {
    'use strict';

    const test = require('tape');
    const path = require('path');

    let kindlePeriodical;
    test('check `require`', (t) => {
        kindlePeriodical = require('..');
        t.end();
    });

    test('create.one.section', async (t) => {
        var bookData = {
            title      : 'ebook-title-simple',
            creator    : 'creator',
            publisher  : 'publisher',
            subject    : 'subject',
            description: 'description',
            cover      : path.join(__dirname, 'test.jpg'),
            sections   : [{
                title   : 'title-of-section',
                articles: [{
                    title  : 'title-of-article',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }]
        };

        await kindlePeriodical.create(bookData);
        t.ok(true, 'run to the end');
        t.end();
    });

    test('create.multiple.sections', async (t) => {
        var bookData = {
            title      : 'ebook-title-multiple-sections',
            creator    : 'creator',
            publisher  : 'publisher',
            subject    : 'subject',
            description: 'description',
            sections   : [{
                title   : 'title-of-section-01',
                articles: [
                    {
                        title  : 'title-of-article-01-01',
                        author : 'author-of-article',
                        content: 'simple content'
                    }, {
                        title  : 'title-of-article-01-02',
                        author : 'author-of-article',
                        content: 'simple content'
                    }, {
                        title  : 'title-of-article-01-03',
                        author : 'author-of-article',
                        content: 'simple content'
                    }, {
                        title  : 'title-of-article-01-04',
                        author : 'author-of-article',
                        content: 'simple content'
                    }
                ]
            }, {
                title   : 'title-of-section-02',
                articles: [{
                    title  : 'title-of-article-02-01',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }, {
                title   : 'title-of-section-03',
                articles: [{
                    title  : 'title-of-article-03-01',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-02',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-03',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-04',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-05',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-06',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }, {
                title   : 'title-of-section-04',
                articles: [{
                    title  : 'title-of-article-04-01',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-04-02',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }]
        };

        await kindlePeriodical.create(bookData);
        t.ok(true, 'run to the end');
        t.end();
    });

    test('create.simple.withfile', async (t) => {
        var bookData = {
            title      : 'ebook-title-simple-withfile',
            creator    : 'creator',
            publisher  : 'publisher',
            subject    : 'subject',
            description: 'description',
            sections   : [{
                title   : 'title-of-section',
                articles: [{
                    title : 'title-of-article',
                    author: 'author-of-article',
                    file  : './tests/article.html'
                }]
            }]
        };

        await kindlePeriodical.create(bookData);
        t.ok(true, 'run to the end');
        t.end();
    });

    test('create.simple.withurl', async (t) => {
        var bookData = {
            title      : 'ebook-title-simple-withurl',
            creator    : 'creator',
            publisher  : 'publisher',
            subject    : 'subject',
            description: 'description',
            sections   : [{
                title   : 'title-of-section',
                articles: [{
                    title : 'title-of-article',
                    author: 'author-of-article',
                    url   : 'https://de.wikipedia.org/wiki/Linux'
                }]
            }]
        };

        await kindlePeriodical.create(bookData);
        t.ok(true, 'run to the end');
        t.end();
    });

    test('create.multiple.mixed', async (t) => {
        var bookData = {
            title      : 'ebook-title-multiple-mixed',
            creator    : 'creator',
            publisher  : 'publisher',
            subject    : 'subject',
            description: 'description',
            sections   : [{
                title   : 'title-of-section-01',
                articles: [{
                    title : 'choo-forms',
                    author: 'author-of-article',
                    url   : 'https://choo.io/docs/forms'
                }]
            }, {
                title   : 'title-of-section-02',
                articles: [{
                    title  : 'title-of-article',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }]
        };

        await kindlePeriodical.create(bookData);
        t.ok(true, 'run to the end');
        t.end();
    });

    test('create.complex.mixed', async (t) => {
        var bookData = {
            title      : 'ebook-title-complex-mixed',
            creator    : 'creator',
            publisher  : 'publisher',
            subject    : 'subject',
            description: 'description',
            cover      : path.join(__dirname, 'test.jpg'),
            sections   : [{
                title   : 'title-of-section-01',
                articles: [
                    {
                        title  : 'title-of-article-01-01',
                        author : 'author-of-article',
                        content: 'simple content'
                    }, {
                        title : 'Amazon Kindle',
                        author: 'author-of-article',
                        url   : 'https://de.wikipedia.org/wiki/Amazon_Kindle'
                    }, {
                        title  : 'title-of-article-01-03',
                        author : 'author-of-article',
                        content: 'simple content'
                    }, {
                        title  : 'title-of-article-01-04',
                        author : 'author-of-article',
                        content: 'simple content'
                    }
                ]
            }, {
                title   : 'title-of-section-02',
                articles: [{
                    title  : 'title-of-article-02-01',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }, {
                title   : 'title-of-section-03',
                articles: [{
                    title  : 'title-of-article-03-01',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-02',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-03',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-04',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-05',
                    author : 'author-of-article',
                    content: 'simple content'
                }, {
                    title  : 'title-of-article-03-06',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }, {
                title   : 'github readmes',
                articles: [{
                    title  : 'choo readme',
                    author : 'author-of-article',
                    url    : 'https://raw.githubusercontent.com/choojs/choo/master/README.md'
                }, {
                    title : 'browserify readme',
                    author: 'author-of-article',
                    url   : 'https://raw.githubusercontent.com/browserify/browserify/master/readme.markdown'
                }]
            }]
        };

        await kindlePeriodical.create(bookData);
        t.ok(true, 'run to the end');
        t.end();
    });

    test('create.one.section.targetFolder', async (t) => {
        var bookData = {
            title      : 'ebook-title-simple-other-folder',
            creator    : 'creator',
            publisher  : 'publisher',
            subject    : 'subject',
            description: 'description',
            cover      : path.join(__dirname, 'test.jpg'),
            sections   : [{
                title   : 'title-of-section',
                articles: [{
                    title  : 'title-of-article',
                    author : 'author-of-article',
                    content: 'simple content'
                }]
            }]
        };

        await kindlePeriodical.create(bookData, {
            targetFolder: path.join(process.cwd(), 'otherCompiled')
        });
        t.ok(true, 'run to the end');
        t.end();
    });

})();
