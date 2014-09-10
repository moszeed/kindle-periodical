#kindle-periodical
create a periodical format .mobi file

## Dependencies
"kindlegen" must be installed and set as PATH variable ...

####How it works

    var periodical = require('kindle-periodical');

	var bookData = {

        "title"         : '<ebook-title>',
        "creator"       : '<creator>',
        "publisher"     : '<publisher>',
        "subject"       : '<subject>',
        "description"   : '<description>',

        "sections"      : [{

            "title" : '<title-of-section>',

            "articles"  : [{
                "title"     : '<title-of-article',
                "author"    : '<author-of-article>',
                "content"   : '<content-of-article>'
            }]
        }]
    };

    periodical.create(bookData, {
        target : '.' // create folder
    })
