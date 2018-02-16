(async () => {
    try {
        const download = require('download');
        const kindlegenDownloadUrls = {
            'darwin': 'https://kindlegen.s3.amazonaws.com/KindleGen_Mac_i386_v2_9.zip',
            'linux' : 'https://kindlegen.s3.amazonaws.com/kindlegen_linux_2.6_i386_v2_9.tar.gz',
            'win32' : 'https://kindlegen.s3.amazonaws.com/kindlegen_win32_v2_9.zip'
        };

        const selectedUrl = kindlegenDownloadUrls[process.platform];
        if (!selectedUrl) {
            throw new Error('not supported platform');
        }

        await download(selectedUrl, 'bin', {extract: true});
        console.log('Download completed');
    } catch (err) {
        console.log('fail to download');
        throw Error(err);
    }
})();
