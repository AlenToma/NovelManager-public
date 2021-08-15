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

    var container = await HttpClient.getHtml(url);
    var items = container.querySelector(".mybox") == undefined ? Array.from(container.querySelectorAll("section .columns")) : Array.from(container.querySelectorAll(".mybox li"));

    var result = [];
    items.forEach(x => {
        var a = container.querySelector(".mybox") ? x.querySelector("h3 a") : Array.from(x.querySelectorAll("a")).last()
        result.push(new LightItem(parser.uurl(parser.attr("src", x.querySelector("img"))),
            parser.text(a, false), "",
            parser.attr("href", a), parser.name));
    });


    return result;
}

async function getChapters(url) {
    var chapters = []
    var page = 0;

    while (true) {
        page++;
        var pUrl = (`/page/${page}/`).uri(url);
        var container = await HttpClient.getHtml(pUrl);
        var chs = container.querySelectorAll("tbody tr th a");
        if (!chs || chs.length <= 0) {
            break;
        }

        var newChaps = Array.from(chs).map(x => {
            return new Chapter(x.innerHTML, parser.uurl(x.getAttribute("href")));
        }).filter(f => f.chapterUrl && f.chapterUrl.length > 0 && !chapters.find(x => x.chapterUrl == f.chapterUrl));
        if (newChaps.length <= 0)
            break;
        chapters = chapters.concat(newChaps);
    }
    return chapters;

}


async function getNovel(novelUrl, basicInfo) {
    var container = await HttpClient.getHtml(novelUrl);
    var chapters = basicInfo === true ? [] : await getChapters(novelUrl);
    var novelReviews = new NovelReviews();
    if (!basicInfo) {
        try {
            var nodes = Array.from(container.querySelectorAll("#NovelInfo > p"));

            novelReviews.genres = nodes.findAt(1) ? Array.from(nodes.findAt(1).querySelectorAll("a")).map(x => x.innerHTML.htmlText(false)) : "";
            novelReviews.author = nodes.findAt(2) ? parser.text(nodes.findAt(2).querySelector("a"), false) : ""
            novelReviews.completed = (nodes.last() ? parser.text(nodes.last().querySelector("a"), false) : "") === "Complete" ? "Status:Completed" : "Status:Ongoing";
            novelReviews.authorUrl = nodes.findAt(2) ? parser.attr("href", nodes.findAt(2).querySelector("a")) : ""

        } catch (e) {
            console.log(e);
        }

    }
    return new DetaliItem(
        parser.uurl(parser.attr("src", container.querySelector('#NovelInfo img'))),
        parser.text(container.querySelector('title'), false).replace("Comrade Mao", "").replace("-", "").trim(),
        parser.text(Array.from(container.querySelectorAll('#NovelInfo .columns .column')).last(), true),
        novelUrl,
        chapters.reverse(),
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    var container = await HttpClient.getHtml(url);
    return parser.outerHTML(container.querySelector("#content"))

}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = await HttpClient.getHtml(url);
    var items = Array.from(container.querySelectorAll("tbody > tr > th:first-child > a"));

    var result = [];
    items.forEach(x => {
        result.push(new LightItem( "ParserImageHandler?url="+x.getAttribute("href"),
            parser.text(x, false), "", parser.uurl(parser.attr("href", x)), parser.name));
    });

    return result;
}