#kindle-periodical
create a periodical format .mobi file

## Dependencies
[kindlegen](http://smile.amazon.com/gp/feature.html?docId=1000765211) must be installed and set as PATH variable or the path to the directory in options.

## How to install
    npm install kindle-periodical

####How it works

    var periodical = require('kindle-periodical');
    periodical.options({ // All of these are optional
        kindlegenPath: '/path/to/KindleGen', // Path to the directory KindleGen is in, not the executable itself
        tempDir: '/path/to/temp/directory' // if you want the temp files written somewhere else. Make sure this dir is empty, all files are removed.
    });

	var bookData = {

        "title"         : '<ebook-title>',
        "creator"       : '<creator>',
        "publisher"     : '<publisher>',
        "subject"       : '<subject>',
        "description"   : '<description>',
        "date"          : date // (optional) Javascript date object. If unset, will be new Date()

        "sections"      : [{

            "title" : '<title-of-section>',

            "articles"  : [{
                "title"     : '<title-of-article>',
                "author"    : '<author-of-article>',
                "content"   : '<content-of-article>' // HTML between the body tags
            }]
        }]
    };

    periodical.create(bookData, {
        target : '.' // path must exist and be writable
    })
