# kindle-periodical
create a periodical format .mobi file

Kindlegen must *NOT* be in PATH, will be Downloaded on install

## How to install
    npm install kindle-periodical

#### CLI usage
    kindle-periodical -f nameOfBook /path/to/.json

    -f --filename   name of created .mobi
    -o --output     folder of created .mobi

will reate a ```compiled``` folder with the generated book

#### API usage

    var periodical = require('kindle-periodical');
	var bookData = {
        "title"         : 'ebook-title',
        "creator"       : 'creator',
        "publisher"     : 'publisher',
        "subject"       : 'subject',
        "language"      : 'language (en-Gb, de-De)',
        "cover"         : "path-to-cover",
        "description"   : 'description',
        "sections"      : [{
            "title" : 'title-of-section',
            "articles"  : [{
                "title"  : 'title-of-article',
                "author" : 'author-of-article',
                "content": 'content-of-article'
                "file"   : "path-to-local-file",
                "url"    : 'url-to-a-website'
            }]
        }]
    };

    periodical.create(bookData, {
        targetFolder: '.' // where should the mobi file go
    })


- ```content``` supports HTML and Markdown
- ```file``` full path to a local folder
- ```url``` accepts a website url
- if ```url``` or ```file``` is set, the ```content``` field will be ignored.
