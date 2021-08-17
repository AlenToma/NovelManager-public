
function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();

    item.detaliItemType = DetaliItemType.Novel;
    item.id = "1.allnovel";
    item.parserLanguage = "en";
    item.name = 'AllNovel';
    item.latestUrl = 'https://allnovel.net/';
    item.url = 'https://allnovel.net/';
    item.searchUrl = 'https://allnovel.net/search.php?keyword={q}';
    item.panination = false;
    item.searchPagination = true;
    item.icon = 'https://allnovel.net/media/favicon.png';
    item.parserSearchSettings = new ParserSearchSettings();
    item.detaliItemType = DetaliItemType.Novel;
    item.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue("Romance", "romance.html?page={p}"),
            new labelValue("Adventure", "adventure.html?page={p}"),
            new labelValue("Thriller", "thriller.html?page={p}"),
            new labelValue("Fantasy", "fantasy.html?page={p}"),
            new labelValue("Young Adult", "young-adult.html?page={p}"),
            new labelValue("Mystery", "mystery.html?page={p}"),
            new labelValue("Historical", "historical.html?page={p}"),
            new labelValue("Horror", "horror.html?page={p}"),
            new labelValue("Science Fiction", "science-fiction.html?page={p}"),
            new labelValue("Humorous", "humorous.html?page={p}"),
            new labelValue("Christian", "christian.html?page={p}"),
            new labelValue("Western", "western.html?page={p}")
        ]
    }

    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("romance", "Romance", "Search", false, new Filter([item.parserSearchSettings.genres.values[0].value])),
        new Section("action", "Action", "Search", false, new Filter([item.parserSearchSettings.genres.values[1].value])),
        new Section("mystery", "Mystery", "Search", false, new Filter([[item.parserSearchSettings.genres.values[2].value]])),
        new Section("mystery", "Mystery", "Search", false, new Filter([[item.parserSearchSettings.genres.values[4].value]])),
    ]
    return item;
}


async function search(filter, page) {
    if (!filter.title)
        filter.title = "";
    if (filter.genres.length <= 0 && filter.title == "")
        return [];
    var url = filter.genres.length > 0 ? filter.genres[0].toString().uri(parser.url).replace("{p}", page) : parser.searchUrl.replace("{q}", filter.title);
    var result = [];
    parser.jq(await HttpClient.getHtml(url)).find(".list-novel a").forEach(x => {
        result.push(new LightItem(
            x.select("img").attr("src").url(),
            x.select(".title-home-novel").text(),
            "",
            x.attr("href").url(),
            parser.name));
    });

    return result;

}

async function getNovel(novelUrl) {

    var container = parser.jq(await HttpClient.getHtml(novelUrl));
    var chapters = container.find(".list-page-novel a").map(x => new Chapter(x.text(false), x.attr("href").url()));
    var novelReviews = new NovelReviews();
    var info = container.find(".list-info");
    novelReviews.genres = info.findAt(1).find("a").textArray();
    novelReviews.author = info.findAt(0).select("a").text(false);
    novelReviews.uvotes = info.findAt(2).select("span").hasElement() ? info.findAt(2).select("span").text(false) + " Views" : "";
    return new DetaliItem(
        container.select(".row img").attr("src").url(),
        container.select(".detail-novel h1").text(false),
        container.select(".des-novel").innerHTML(),
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    return parser.jq(await HttpClient.getHtml(url)).remove(".ad-container").select(".content_novel").outerHTML();
}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = parser.jq(await HttpClient.getHtml(url));
    var result = [];
    container.find(".list-novel a").forEach(x => {
        result.push(new LightItem(
            x.select("img").attr("src").url(),
            x.select(".title-home-novel").text(false),
            "",
            x.attr("href").url(),
            parser.name));
    });

    return result;

}