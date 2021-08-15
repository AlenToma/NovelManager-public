async function getChapters(novelUrl, httpClient) {
    var page = 1;
    var result = []
    while (page > 0) {
        var url = novelUrl + "/page-" + page;
        var container = await httpClient.getHtml(url);
        if (container.querySelectorAll(".chapter-list a").length <= 0) {
            page = 0;
            break;
        }

        var resultA = Array.from(container.querySelectorAll(".chapter-list a")).reduce((acc, x, index, arr) => {
            var ch = {
                name: x.getAttribute("title"),
                chapterUrl: x.getAttribute("href")
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
