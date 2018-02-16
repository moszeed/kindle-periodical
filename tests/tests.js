(() => {
    'use strict';

    const test = require('tape');

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

    test('create.withurl', async (t) => {
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
})();
