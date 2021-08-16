function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter(undefined, "pageviews", undefined, "all");
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("popular", "Popular", "Search", false, new Filter(undefined, "pageviews")),
        new Section("favorites", "Favorites", "Search", false, new Filter(undefined, "favorites")),
        new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "completed"))
    ];

    item.id = "1.scribblehub";
    item.detaliItemType = DetaliItemType.Novel;
    item.parserLanguage = "en";
    item.name = 'ScribbleHub';
    item.latestUrl = 'https://www.scribblehub.com/?pg={p}';
    item.url = 'https://www.scribblehub.com';
    item.searchUrl = 'https://www.scribblehub.com/?s={q}&post_type=fictionposts';
    item.panination = true;
    item.searchPagination = false;
    item.icon = 'https://www.scribblehub.com/favicon.ico';
    item.parserSearchSettings = new ParserSearchSettings();
    item.parserSearchSettings.multiSelection = true;
    item.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Chapters per Week', "frequency"),
            new labelValue('Date Added', "dateadded"),
            new labelValue('Favorites', "favorites"),
            new labelValue('Last Update', "lastchpdate"),
            new labelValue('Number of Ratings', "numofrate"),
            new labelValue('Pages', "pages"),
            new labelValue('Pageviews', "pageviews"),
            new labelValue('Ratings', "ratings"),
            new labelValue('Readers', "readers"),
            new labelValue('Total Words', "totalwords"),
        ],
    };

    item.parserSearchSettings.genres = {
        multiSelection: true,
        values: [
            new labelValue("Action", 9),
            new labelValue("Comedy", 7),
            new labelValue("Fantasy", 19),
            new labelValue("Historical", 21),
            new labelValue("LitRPG", 1180),
            new labelValue("Mystery", 909),
            new labelValue("Sci-fi", 912),
            new labelValue("Adult", 902),
            new labelValue("Drama", 903),
            new labelValue("Gender Bender", 905),
            new labelValue("Horror", 22),
            new labelValue("Martial Arts", 907),
            new labelValue("Psychological", 910),
            new labelValue("Seinen", 913),
            new labelValue("Supernatural", 5),
            new labelValue("Adventure", 8),
            new labelValue("Ecchi", 904),
            new labelValue("Girls Love", 892),
            new labelValue("Isekai", 37),
            new labelValue("Mature", 20),
            new labelValue("Romance", 6),
            new labelValue("Slice of Life", 914),
            new labelValue("Tragedy", 901),
            new labelValue("Boys Love", 891),
            new labelValue("Fanfiction", 38),
            new labelValue("Harem", 1015),
            new labelValue("Josei", 906),
            new labelValue("Mecha", 908),
            new labelValue("School Life", 911),
            new labelValue("Smut", 915),

        ]
    }

    item.parserSearchSettings.statuses = {
        multiSelection: false,
        values: [
            new labelValue("All", "all"),
            new labelValue("Completed", "completed"),
            new labelValue("Ongoing", "ongoing"),
            new labelValue("Hiatus", "hiatus")
        ]
    }

    return item;
}

async function search(filter, page) {
    var sortTypeUri = "https://www.scribblehub.com/series-finder/?sf=1&gi={g}&mgi=and&sort={sort}&order=desc&cp={status}&pg=" + page;
    var sortTypeUrl = sortTypeUri.replace("{g}", filter.genres.join(",")).replace("{sort}", filter.sortType).replace("{status}", filter.active);

    var url = filter.title && filter.title.length > 0 ? parser.searchUrl.replace("{q}", filter.title) : sortTypeUrl;

    var container = await HttpClient.getHtml(url);
    var items = Array.from(container.querySelectorAll(".search_main_box"));
    var result = [];
    items.forEach(x => {
        result.push(new LightItem(
            parser.uurl(parser.attr("src", x.querySelector("img"))),
            parser.text(x.querySelector(".search_title")),
            "",
            parser.uurl(parser.attr("href", x.querySelector(".search_title a"))),
            parser.name));
    });
    return result;
}


async function getChapters(id) {
    console.log("strSID:" + id);
    var html = await HttpClient.postForm("https://www.scribblehub.com/wp-admin/admin-ajax.php", { action: "wi_gettocchp", strSID: parseInt(id), strmypostid: 0, strFic: "yes" });
    var container = HttpClient.parseHtml(html);

    return container.querySelectorAll("a").map(x => new Chapter(x.innerHTML, parser.uurl(x.getAttribute("href"))));
}

async function getNovel(novelUrl) {
    var container = await HttpClient.getHtml(novelUrl);
    var id = container.querySelector("#mypostid") ? container.querySelector("#mypostid").nodeValue : novelUrl.split("/")[novelUrl.split("/").indexOf("series") + 1];
    var chapters = await getChapters(id);
    var reg = new RegExp(/"(ratingValue)":"((\\"|[^"])*)"/, "i")
    var res = reg.exec(container.innerHTML);
    var rate = eval((res && res.length > 0 ? res.findAt(0).split(":").last() : "1"));
    var novelReviews = new NovelReviews();
    novelReviews.author = parser.text(container.querySelector("[property='author'] .auth_name_fic"), false);
    novelReviews.genres = Array.from(container.querySelectorAll(".wi_fic_genre a")).map(x => x.innerHTML.htmlText(false));
    novelReviews.uvotes = "Rating:" + parseInt(rate ? rate : "1").toFixed(0) + "/5";
    novelReviews.completed = parser.text(container.querySelector(".widget_fic_similar"), false).indexOf("Completed") != -1 ? "Status:Completed" : "Status:Ongoing";
    return new DetaliItem(
        parser.uurl(parser.attr("src", container.querySelector(".novel-cover img"))),
        parser.text(container.querySelector('.fic_title')),
        parser.innerHTML(container.querySelector('.wi_fic_desc')),
        novelUrl,
        chapters.reverse(),
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    var container = await HttpClient.getHtml(url);
    return parser.outerHTML(container.querySelector(".chp_raw"));
}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = await HttpClient.getHtml(url);
    var items = Array.from(container.querySelectorAll("#main_releases td"));
    var result = [];
    items.forEach(x => {
        result.push(new LightItem(
            parser.uurl(parser.attr("src", x.querySelector("img"))),
            parser.text(x.querySelector(".fp_title")),
            "",
            parser.uurl(parser.attr("href", x.querySelector(".fp_title"))),
            parser.name));
    });
    return result;
}
