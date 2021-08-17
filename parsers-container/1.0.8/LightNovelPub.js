function getImage(component) {
    if (component === null)
        return "";
    var src = component.attr("data-src").attValue();
    if (!src || src === "")
        src = component.attr("src").attValue();
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
    item.detaliItemType = DetaliItemType.Novel;
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

    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("romance", "Romance", "Search", false, new Filter([8])),
        new Section("action", "Action", "Search", false, new Filter([1])),
        new Section("mystery", "Mystery", "Search", false, new Filter([14])),
    ]

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
    var container = parser.jq(await HttpClient.getHtml(url));
    var result = [];
    container.find(".novel-item").forEach(x => {
        result.push(new LightItem(getImage(x.select("img")),
            x.select(".novel-title a").text(false),
            "",
            x.select(".novel-title a").attr("href").url(),
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
    var html = parser.jq(container.resultview.toHtml());
    var result = [];
    html.find(".novel-item").forEach(x => {
        result.push(new LightItem(getImage(x.select("img"), false),
            x.select(".novel-title").text(false),
            "",
            x.select("a").attr("href").url(),
            parser.name));
    });
    return result;
}

async function getChapters(novelUrl) {
    var page = 0;
    var result = {};
    while (true) {
        page++;
        var url = novelUrl + "/page-" + page;
        var items = parser.jq(await HttpClient.getHtml(url)).find(".chapter-list a");
        if (!items.hasElements()) {
            break;
        }



        var resultA = items.reduce((arr, x) => {
            arr[x.attr("title").text() + x.attr("href").url()] = new Chapter(x.attr("title").text(), x.attr("href").url());
        }, {});

        if (parser.validateChapters(resultA, result) == false) {
            break;
        }
    }

    return Object.values(result);
}



async function getNovel(novelUrl) {
    var container = parser.jq(await HttpClient.getHtml(novelUrl));
    var chapterUrl = container.select(".chapter-latest-container").attr("href").url();
    if (!chapterUrl || chapterUrl == "")
        chapterUrl = novelUrl;
    var chapters = await getChapters(chapterUrl);
    var novelReviews = new NovelReviews();
    var info = container.select(".novel-info");

    novelReviews.genres = info.find(".categories a").textArray();
    novelReviews.author = info.select(".author a").text(false);
    novelReviews.uvotes = "Rating:" + container.select(".rating-star strong").text(false) + "/5";
    novelReviews.description = container.select("#info .summary").innerHTML();
    novelReviews.completed = info.text(".header-stats .completed") === "Completed" ? "Status:Completed" : "Status:Ongoing";

    return new DetaliItem(
        getImage(container.select('.cover img')),
        container.select(".novel-title").text(false),
        novelReviews.description,
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    return parser.jq(await HttpClient.getHtml(url)).select("#chapter-container").outerHTML();
}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = parser.jq(await HttpClient.getHtml(url));
    var result = []
    container.find(".novel-item").forEach(x => {
        result.push(new LightItem(getImage(x.select(".novel-cover img")),
            x.select(".novel-title").text(),
            "",
            x.select(".cover-wrap a").attr("href").url(),
            parser.name));
    });

    return result;
}