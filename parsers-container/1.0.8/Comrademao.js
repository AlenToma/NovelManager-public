function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "complete")),
        new Section("chinese", "Chinese", "Search", false, new Filter(undefined, "chinese")),
        new Section("japanese", "Japanese", "Search", false, new Filter(undefined, "japanese")),
        new Section("korean", "Korean", "Search", false, new Filter(undefined, "korean"))
    ];
    item.detaliItemType = DetaliItemType.Novel;
    item.id = "1.comrademao";
    item.name = 'Comrademao';
    item.latestUrl = 'https://comrademao.com/page/{p}/';
    item.url = 'https://comrademao.com';
    item.searchUrl = 'https://comrademao.com/page/{p}/?s={q}&post_type=novel';
    item.panination = true;
    item.searchPagination = true;
    item.icon = 'https://www.google.com/s2/favicons?domain=https://comrademao.com';
    item.parserSearchSettings = new ParserSearchSettings();
    item.parserLanguage = "en";
    item.parserSearchSettings.genres =
    {
        multiSelection: false,
        values: [
            new labelValue('Action'),
            new labelValue('Comedy'),
            new labelValue('Fantasy'),
            new labelValue('Harem'),
            new labelValue('Mature'),
            new labelValue('Mystery'),
            new labelValue('Romance'),
            new labelValue('Sci-fi'),
            new labelValue('Tragedy'),
            new labelValue('Xianxia'),
            new labelValue('Wuxia'),
            new labelValue('Xuanhuan'),
            new labelValue('Adventure'),
            new labelValue('Supernatural'),
            new labelValue('Drama'),
            new labelValue('Martial Arts', "Martial-Arts"),
            new labelValue('Seinen'),
            new labelValue('Psychological'),
            new labelValue('Slice of Life', "slice-of-life"),
        ],
    };



    item.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Chinese', 'chinese'),
            new labelValue('Japanese', 'japanese'),
            new labelValue('Korean', 'korean'),
        ],
    };

    item.parserSearchSettings.statuses = {
        multiSelection: false,
        values: [
            new labelValue("Complete", "complete"),
            new labelValue("OnGoing", "on-going")
        ]
    }
    return item;
}


async function search(filter, page) {
    var sortTypeUri = "https://comrademao.com/mtype/{s}/page/{p}/"
    var sortTypeUrl = sortTypeUri.replace("{s}", filter.sortType).replace("{p}", page.toString());

    var url = filter.sortType && filter.sortType != "" ? sortTypeUrl : parser.searchUrl.replace('{q}', filter.title).replace("{p}", page.toString());
    if (filter.genres.length)
        url = "genre/" + filter.genres[0] + "/page/${page}".uri(parser.url);
    else
        if (filter.active && (!filter.sortType || filter.sortType == ""))
            url = "status/" + filter.active + "/page/${page}".uri(parser.url);

    var container = parser.jq(await HttpClient.getHtml(url));
    var mybox = container.select(".mybox").hasElement();
    var item = !mybox ? container.find("section .columns") : container.find(".mybox li");

    var result = [];
    item.forEach(x => {
        var a = mybox ? x.select("h3 a") : x.find("a").last();
        result.push(new LightItem(
            x.select("img").attr("src").url(),
            a.text(false), "",
            a.attr("href").url(), parser.name));
    });


    return result;
}

async function getChapters(url) {
    var chapters = []
    var page = 0;

    while (true) {
        page++;
        var pUrl = (`/page/${page}/`).uri(url);
        var container = parser.jq(await HttpClient.getHtml(pUrl)).select("tbody tr th a");
        if (!container.hasElements()) {
            break;
        }

        var newChaps = container.map(x => {
            return new Chapter(x.innerHTML(), x.attr("href").url());
        }).filter(f => f.chapterUrl && f.chapterUrl.length > 0 && !chapters.find(x => x.chapterUrl == f.chapterUrl));
        if (newChaps.length <= 0)
            break;
        chapters = chapters.concat(newChaps);
    }
    return chapters;

}


async function getNovel(novelUrl, basicInfo) {
    var container = parser.jq(await HttpClient.getHtml(novelUrl));
    var chapters = basicInfo === true ? [] : await getChapters(novelUrl);
    var novelReviews = new NovelReviews();
    if (!basicInfo) {
        try {
            var node = container.select("#NovelInfo > p");

            novelReviews.genres = node.findAt(1).find("a").map(x => x.text());
            novelReviews.author = node.findAt(2).select("a").text();
            novelReviews.completed = node.last().select("a").text() === "Complete" ? "Status:Completed" : "Status:Ongoing";
            novelReviews.authorUrl = nodes.findAt(2).select("a").attr("href").text();

        } catch (e) {
            console.log(e);
        }

    }
    return new DetaliItem(
        container.select('#NovelInfo img').attr("src").url(),
        container.select('title').text().replace("Comrade Mao", "").replace("-", "").trim(),
        container.find('#NovelInfo .columns .column').last().innerHTML(),
        novelUrl,
        chapters.reverse(),
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    return parser.jq(await HttpClient.getHtml(url)).select("#content").outerHTML();
}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = parser.jq(await HttpClient.getHtml(url));
    var result = [];
    container.find("tbody > tr > th:first-child > a").forEach(x => {
        result.push(new LightItem(async () => (await getNovel(x.attr("href").url(), true)).image,
            x.text(false), "", x.attr("href").url(), parser.name));
    });

    return result;
}