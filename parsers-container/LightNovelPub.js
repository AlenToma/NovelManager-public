function getChapters(novelUrl, HttpClient) {
    var page = 1;
    var result = []
    while (page > 0) {
        var url = novelUrl + `/page-` + page;
        var container = await HttpClient.getHtml(url);
        if (container.querySelectorAll(".chapter-list a").length <= 0) {
            page = 0;
            break;
        }

        var resultA = Array.from(container.querySelectorAll(".chapter-list a")).reduce((acc, x, index, arr) => {
            var ch = {
                name: x.getAttribute("title"),
                chapterUrl: x.getAttribute("href")?.uri(this.url)
            }

            if (result.find((a) => a.chapterUrl == ch.chapterUrl && a.name == ch.name) === undefined)
                acc.push(ch);
            return acc;
        }, [])

        if (resultA.length <= 0) {
            page = 0;
            break;
        }

        resultA.forEach((x) => {
            result.push(x);
        });

        page++;
    }

    return result;

}
