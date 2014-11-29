#kindle-periodical
create a periodical format .mobi file

## Dependencies
"kindlegen" must be installed and set as PATH variable ...

## How to install
    npm install kindle-periodical

####How it works

    var periodical = require('kindle-periodical');

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
                "title"     : '<title-of-article',
                "author"    : '<author-of-article>',
                "content"   : '<content-of-article>' // HTML between the body tags
            }]
        }]
    };

    periodical.create(bookData, {
        target : '.' // folder not automatically created
    })
