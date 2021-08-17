function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter(["all"], "topview");
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("newest", "Newest Novel", "Search", false, new Filter(undefined, "newest")),
        new Section("top", "Top view", "Search", false, new Filter(undefined, "topview"))
    ]

    item.id = "1.novelonlinefull";
    item.detaliItemType = DetaliItemType.Novel;
    item.parserLanguage = "en";

    item.parserLanguage = "en";
    item.name = 'NovelOnlineFull';
    item.latestUrl = 'https://novelonlinefull.com/novel_list?type=latest&category=all&state=all&page={p}';
    item.url = 'https://novelonlinefull.com/';
    item.searchUrl = 'https://novelonlinefull.com/search_novels/{q}?page={p}';
    item.panination = true;
    item.searchPagination = false;
    item.icon = 'https://novelonlinefull.com/themes/home/images/favicon.png';
    item.parserSearchSettings = new ParserSearchSettings();
    item.parserSearchSettings.multiSelection = true;
    item.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue("All", "all"),
            new labelValue("Chinese", 3),
            new labelValue("English", 6),
            new labelValue("Korean", 13),
            new labelValue("Original", 19),
            new labelValue("Action", 1),
            new labelValue("Adventure", 2),
            new labelValue("Comedy", 4),
            new labelValue("Drama", 5),
            new labelValue("Fantasy", 7),
            new labelValue("Gender Bender", 8),
            new labelValue("Harem", 9),
            new labelValue("Historical", 10),
            new labelValue("Horror", 11),
            new labelValue("Josei", 12),
            new labelValue("Lolicon", 14),
            new labelValue("Martial Arts", 15),
            new labelValue("Mature", 16),
            new labelValue("Mecha", 17),
            new labelValue("Mystery", 18),
            new labelValue("Psychological", 20),
            new labelValue("Reincarnation", 21),
            new labelValue("Romance", 22),
            new labelValue("School Life", 23),
            new labelValue("Sci-fi", 24),
            new labelValue("Seinen", 25),
            new labelValue("Shotacon", 26),
            new labelValue("Shoujo", 27),
            new labelValue("Shoujo Ai", 28),
            new labelValue("Shounen", 29),
            new labelValue("Shounen Ai", 30),
            new labelValue("Slice of Life", 31),
            new labelValue("Smut", 32),
            new labelValue("Sports", 33),
            new labelValue("Supernatural", 34),
            new labelValue("Tragedy", 35),
            new labelValue("Virtual Reality", 36),
            new labelValue("Wuxia", 37),
            new labelValue("Xianxia", 38),
            new labelValue("Xuanhuan", 39),
            new labelValue("Arts", 40),
            new labelValue("Biographies", 41),
            new labelValue("Business", 42),
            new labelValue("Computers", 43),
            new labelValue("Education", 46),
            new labelValue("Entertainment", 47),
            new labelValue("Fiction", 48),
            new labelValue("Humor", 51),
            new labelValue("Investing", 52),
            new labelValue("Literature", 53),
            new labelValue("Memoirs", 54)

        ]
    }

    item.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Latest', 'latest'),
            new labelValue('Newest', 'newest'),
            new labelValue('Top view', 'topview')
        ],
    };

    return item;
}


async function search(filter, page) {
    var sortTypeUri = "https://novelonlinefull.com/novel_list?type={s}&category={g}&state=all&page={p}"
    var sortTypeUrl = sortTypeUri.replace("{s}", filter.sortType).replace("{p}", page.toString()).replace("{g}", filter.genres.length > 0 ? filter.genres[0] : "all");

    var url = (!filter.title || filter.title == "") && filter.sortType && filter.sortType != '' ? sortTypeUrl : parser.searchUrl.replace('{q}', (filter.title).replace(/[ ]/, "_"));

    var container = parser.jq(await HttpClient.getHtml(url));
    var result = [];
    container.find(".update_item, .itemupdate").forEach(x => {
        result.push(new LightItem(x.select("img").attr("src").url(),
            x.select("img").attr("alt | title").text(false),
            "",
            x.select("a").attr("href").url(),
            parser.name));
    });

    return result;

}

async function getNovel(novelUrl) {
    var container = parser.jq(await HttpClient.getHtml(novelUrl));
    var chapters = container.find(".chapter-list .row a").map(x => new Chapter(x.text(false), x.attr("href").url()));
    var novelReviews = new NovelReviews();
    var infos = container.find(".truyen_info_right li")


    novelReviews.genres = infos.findAt(2).find("a").textArray();
    novelReviews.author = infos.findAt(1).find("a").text();
    novelReviews.uvotes = infos.findAt(6).text(false);
    novelReviews.description = infos.select("#noidungm").text(false);
    novelReviews.completed = infos.findAt(3).select("a").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";

    return new DetaliItem(
        container.select(".info_image img").attr("src").url(),
        container.select('.truyen_info_right h1').text(false),
        container.select('#noidungm').innerHTML(),
        novelUrl,
        chapters.reverse(),
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    return parser.jq(await HttpClient.getHtml(url)).select(".vung_doc").outerHTML();
}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = parser.jq(await HttpClient.getHtml(url));
    var result = [];
    container.find(".update_item").forEach(x => {
        result.push(new LightItem(x.select("img").attr("src").url(),
            x.select("img").attr("title").text(false),
            "",
            x.select("a").attr("href").url(),
            parser.name));
    });

    return result;
}