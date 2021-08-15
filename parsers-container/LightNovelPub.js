function getImage(component) {
    if (component === null)
        return "";
    var src = component.getAttribute("data-src");
    if (!src || src === "")
        src = component.getAttribute("src");
    return parser.uurl(src);
}

function parserDetali() {
    var item = {};
    item.id = "1.lightnovelpub";
    item.parserLanguage = "en";
    item.name = 'LightNovelPub';
    item.latestUrl = 'https://www.lightnovelpub.com/browse/all/updated/all/{p}';
    item.url = 'https://www.lightnovelpub.com';
    item.searchUrl = 'https://www.lightnovelpub.com/lnwsearchlive?inputContent={q}';
    item.panination = true;
    item.searchPagination = true;
    item.icon = 'https://static.lightnovelpub.com/content/img/lightnovelpub/apple-touch-icon.png';
    item.parserSearchSettings = new ParserSearchSettings();
    item.parserSearchSettings.multiSelection = true;
    item.parserSearchSettings.genres = {
        multiSelection: true,
        values: [
            new labelValue("Action", 1),
            new labelValue("Adult", 48),
            new labelValue("Adventure", 2),
            new labelValue("Comedy", 12),
            new labelValue("Contemporary Romance", 59),
            new labelValue("Drama", 3),
            new labelValue("Eastern Fantasy", 58),
            new labelValue("Ecchi", 11),
            new labelValue("Fantasy", 4),
            new labelValue("Fantasy Romance", 60),
            new labelValue("Gender Bender", 52),
            new labelValue("Harem", 5),
            new labelValue("Historical", 46),
            new labelValue("Horror", 44),
            new labelValue("Josei", 23),
            new labelValue("Lolicon", 51),
            new labelValue("Magical Realism", 57),
            new labelValue("Martial Arts", 6),
            new labelValue("Mature", 7),
            new labelValue("Mecha", 45),
            new labelValue("Mystery", 14),
            new labelValue("Psychological", 18),
            new labelValue("Romance", 8),
            new labelValue("School Life", 21),
            new labelValue("Sci-fi", 19),
            new labelValue("Seinen", 49),
            new labelValue("Shoujo", 47),
            new labelValue("Shoujo Ai", 61),
            new labelValue("Shounen", 43),
            new labelValue("Shounen Ai", 53),
            new labelValue("Slice of Life", 13),
            new labelValue("Smut", 56),
            new labelValue("Sports", 50),
            new labelValue("Supernatural", 16),
            new labelValue("Tragedy", 9),
            new labelValue("Video Games", 55),
            new labelValue("Wuxia", 42),
            new labelValue("Xianxia", 20),
            new labelValue("Xuanhuan", 10),
            new labelValue("Yaoi", 54)
        ]
    }

    item.parserSearchSettings.statuses = {
        multiSelection: true,
        values: [
            new labelValue("Completed", 1),
            new labelValue("Ongoing", 2),
        ]
    }

    item.parserSearchSettings.languages = {
        multiSelection: true,
        values: [
            new labelValue("Chinese Novel", 4),
            new labelValue("Korean Novel", 5),
            new labelValue("Light Novel", 6),
            new labelValue("Light Novel (JP)", 9),
            new labelValue("Light Novel (KR)", 10),
            new labelValue("Published Novel (CN)", 11),
            new labelValue("Published Novel (KR)", 8),
            new labelValue("Web Novel", 7),
            new labelValue("Web Novel (CN)", 1),
            new labelValue("Web Novel (JP)", 3),
            new labelValue("Web Novel (KR)", 2)
        ]
    }

    return item;

}

async function getGenres(filter, page) {
    var url = "https://www.lightnovelpub.com/searchadv?ctgcon=and&tagcon=and&ratcon=min&rating=0&sort=sdate&pageNo=" + page;
    if (filter.active)
        url = url + "&status=" + filter.active;
    if (filter.language && filter.language != "")
        url = url + "&genretypes=" + filter.language;

    if (filter.genres.length > 0)
        url = url + "&categories=" + filter.genres.join("%2C");
    var container = await HttpClient.getHtml(url);
    var items = Array.from(container.querySelectorAll(".novel-item"));
    var result = [];
    items.forEach(x => {
        result.push(new LightItem(getImage(x.querySelector("img")),
            parser.text(x.querySelector(".novel-title a"), false),
            "",
            parser.uurl(parser.attr("href", x.querySelector(".novel-title a"))),
            parser.name));
    });
    return result;
}

async function search(filter, page) {
    if (!filter.title)
        filter.title = "";
    var url = parser.searchUrl.replace("{p}", page.toString()).replace("{q}", filter.title);
    if (filter.genres.length > 0 || filter.language != "" || filter.active)
        return await getGenres(filter, page);
    var container = await HttpClient.GetJson(url);
    var html = container.resultview.toHtml();
    var items = Array.from(html.querySelectorAll(".novel-item"));
    var result = [];
    items.forEach(x => {
        result.push(new LightItem(getImage(x.querySelector("img"), false),
            parser.text(x.querySelector(".novel-title")),
            "",
            parser.uurl(parser.attr("href", x.querySelector("a"))),
            parser.name));
    });
    return result;
}

async function getChapters(novelUrl) {
    var page = 1;
    var result = [];

    while (page > 0) {
        var url = novelUrl + "/page-" + page;
        var container = await HttpClient.getHtml(url);
        if (container.querySelectorAll(".chapter-list a").length <= 0) {
            page = 0;
            break;
        }

        var resultA = Array.from(container.querySelectorAll(".chapter-list a")).reduce((acc, x, index, arr) => {
            var ch = new Chapter(x.getAttribute("title"), parser.uurl(x.getAttribute("href")));
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



async function getNovel(novelUrl) {
    var container = await HttpClient.getHtml(novelUrl);
    var chapterUrl = parser.uurl(parser.attr("href", container.querySelector(".chapter-latest-container")));
    if (!chapterUrl || chapterUrl == "")
        chapterUrl = novelUrl;
    var chapters = await getChapters(chapterUrl);
    var novelReviews = new NovelReviews();
    var infos = container.querySelector(".novel-info");

    if (infos) {
        novelReviews.genres = Array.from(infos.querySelectorAll(".categories a")).map(x => x.innerHTML.htmlText(false))
        novelReviews.author = parser.text(infos.querySelector(".author a"), false)
        novelReviews.uvotes = "Rating:" + parser.text(container.querySelector(".rating-star strong"), false) + "/5";
        novelReviews.description = parser.text(container.querySelector("#info .summary"), true)
        novelReviews.completed = parser.text(infos.querySelector(".header-stats .completed"), false) === "Completed" ? "Status:Completed" : "Status:Ongoing";
    }
    return new DetaliItem(
        getImage(container.querySelector('.cover img')),
        parser.text(container.querySelector(".novel-title"), false),
        novelReviews.description,
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    var container = await HttpClient.getHtml(url);
    return parser.outerHTML(container.querySelector("#chapter-container"));
}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = await HttpClient.getHtml(url);
    var items = Array.from(container.querySelectorAll(".novel-item"));
    var result = []
    items.forEach(x => {
        result.push(new LightItem(getImage(x.querySelector(".novel-cover img")),
            parser.innerHTML(x.querySelector(".novel-title")),
            "",
            parser.uurl(parser.attr("href", x.querySelector(".cover-wrap a"))),
            parser.name));
    });

    return result;
}