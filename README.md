# kindle-periodical
create a periodical format .mobi file

##### Support

[Buy me a Coffee](https://www.patreon.com/moszeed)

### Features
* Kindlegen will be installed **automatically**
* usable as **CLI** and **programmatically**
* support for **remote webpages** ( will be downloaded with [node-readability](https://github.com/luin/readability) ) and **files**
* **Markdown**

### How to install
    npm install kindle-periodical

Kindlegen must **NOT** be in PATH, will be downloaded on install!

### CLI usage
    kindle-periodical -f nameOfBook /path/to/.json
    
    -f --filename   name of created .mobi
    -o --output     folder of created .mobi

will create a ```compiled``` folder with the generated book

### API usage

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
