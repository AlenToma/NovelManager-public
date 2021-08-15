
function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("romance", "Romance", "Search", false, new Filter([8])),
        new Section("action", "Action", "Search", false, new Filter([1])),
        new Section("mystery", "Mystery", "Search", false, new Filter([14])),
    ]
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
    return item;
}


async function search(filter, page) {

    if (!filter.title)
        filter.title = "";
    if (filter.genres.length <= 0 && filter.title == "")
        return [];
    var url = filter.genres.length > 0 ? filter.genres[0].toString().uri(parser.url).replace("{p}", page) : parser.searchUrl.replace("{q}", filter.title);
    var container = await HttpClient.getHtml(url);
    var items = Array.from(container.querySelectorAll(".list-novel a"));
    var result = [];
    items.forEach(x => {
        result.push(new LightItem(parser.uurl(parser.attr("src", container.querySelector('img'))),
            parser.text(x.querySelector(".title-home-novel"), false),
            "",
            parser.uurl(parser.attr("href", x)), parser.name));
    });

    return result;

}

async function getNovel(novelUrl) {
    var container = await HttpClient.getHtml(novelUrl);
    var chapters = Array.from(container.querySelectorAll(".list-page-novel a")).map(x => new Chapter(x.innerHTML, parser.uurl(parser.attr("href", x))));
    var novelReviews = new NovelReviews();
    var infos = Array.from(container.querySelectorAll(".list-info"));
    novelReviews.genres = infos.length >= 2 ? Array.from(infos[1].querySelectorAll("a")).map(x => x.innerHTML.htmlText(false)) : [];
    novelReviews.author = infos.length >= 1 ? parser.text(infos[0].querySelector("a"), false) : "";
    novelReviews.uvotes = infos.length >= 3 ? (parser.text(infos[2].querySelector("span"), false)) + " Views" : "";
    return new DetaliItem(
        parser.uurl(parser.attr("src", container.querySelector('.row img'))),
        parser.text(container.querySelector('.detail-novel h1'), false),
        parser.innerHTML(container.querySelector('.des-novel')),
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    var container = await HttpClient.getHtml(url);
    container.querySelectorAll(".ad-container").forEach(x => x.remove());
    return parser.outerHTML(container.querySelector(".content_novel"));

}

async function latest(page) {
    var url = parser.latestUrl.replace("{p}", page.toString());
    var container = await HttpClient.getHtml(url);
    var items = Array.from(container.querySelectorAll(".list-novel a"));
    var result = [];
    items.forEach(x => {
        result.push(new LightItem(parser.uurl(parser.attr("src", x.querySelector("img"))),
            parser.text(x.querySelector(".title-home-novel"), false),
            "",
            parser.uurl(parser.attr("href", x)),
            parser.name));
    });

    return result;
}