function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("hot", "Hot Novel", "Search", false, new Filter(undefined, "hot-novel")),
        new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, "completed-novel")),
        new Section("popular", "Most Popular", "Search", false, new Filter(undefined, "most-popular-novel"))
    ]

    item.id = "1.readnovelfull";
    item.parserLanguage = "en";
    item.name = 'ReadNovelFull';
    item.latestUrl = 'https://readnovelfull.com/latest-release-novel?page={p}';
    item.url = 'https://readnovelfull.com/';
    item.searchUrl = 'https://readnovelfull.com/search?keyword={q}&page={p}';
    item.chaptersUrl = 'https://readnovelfull.com/ajax/chapter-option?novelId={id}&currentChapterId=1';
    item.panination = true;
    item.searchPagination = true;
    item.detaliItemType = DetaliItemType.Novel;
    item.icon = 'https://readnovelfull.com/img/favicon.ico';

    item.parserSearchSettings = new ParserSearchSettings();
    item.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue('Shounen'),
            new labelValue('Harem'),
            new labelValue('Comedy'),
            new labelValue('Martial Arts', 'Martial+Arts'),
            new labelValue('School Life', 'School+Life'),
            new labelValue('Mystery'),
            new labelValue('Shoujo'),
            new labelValue('Romance'),
            new labelValue('Sci-fi'),
            new labelValue('Gender Bender', 'Gender+Bender'),
            new labelValue('Mature'),
            new labelValue('Fantasy'),
            new labelValue('Horror'),
            new labelValue('Drama'),
            new labelValue('Tragedy'),
            new labelValue('Supernatural'),
            new labelValue('Ecchi'),
            new labelValue('Xuanhuan'),
            new labelValue('Adventure'),
            new labelValue('Psychological'),
            new labelValue('Xianxia'),
            new labelValue('Wuxia'),
            new labelValue('Historical'),
            new labelValue('Slice of Life', 'Slice+of+Life'),
            new labelValue('Lolicon'),
            new labelValue('Adult'),
            new labelValue('Josei'),
            new labelValue('Sports'),
            new labelValue('Smut'),
            new labelValue('Mecha'),
            new labelValue('Yaoi'),
            new labelValue('Shounen Ai', 'Shounen+Ai'),
        ],
    };

    item.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Latest Release Novel', 'latest-release-novel'),
            new labelValue('Hot Novel', 'hot-novel'),
            new labelValue('Completed Novel', 'completed-novel'),
            new labelValue('Most Popular', 'most-popular-novel'),
        ],
    };

    return item;
}


async function search(filter, page) {
    var genreUrl = "genre/{g}?page={p}".uri(parser.url).replace("{p}", page.toString());
    var sortTypeUrl = "{s}?page={p}".uri(parser.url).replace("{p}", page.toString());
    var q = filter.genres.length > 0 ? genreUrl.replace("{g}", filter.genres[0]) : filter.sortType && filter.sortType != '' ? sortTypeUrl.replace("{s}", filter.sortType) : undefined;

    var query = q ? q : parser.searchUrl.replace('{q}', filter.title).replace('{p}', page.toString());
    var container = parser.jq(await HttpClient.getHtml(query));
    var result = [];
    container.find('.list-novel .row').forEach((x) => {
        if (x.select('img').attr("src").hasValue())
            result.push(
                new LightItem(
                    x.select('img').attr("src").url().replace(/\d+x\d+/, "150x170"),
                    x.select('.novel-title a').text(false),
                    '',
                    x.select('.novel-title a').attr("href").url()
                    ,
                    parser.name
                ),
            );
    });

    return result;
}

async function getChapters(novelUrl, htmlContainer) {
    var chapters = [];
    var url = parser.chaptersUrl.replace('{id}', (htmlContainer.select('#rating').attr("data-novel-id").hasValue() ?
        htmlContainer.select('#rating').attr("data-novel-id").attValue() :
        htmlContainer.select('[data-novel-id]').attr("data-novel-id").attValue()));

    var container = parser.jq(await HttpClient.getHtml(url));
    container.find('option').forEach(x => {
        if (x.attr("value").hasValue())
            chapters.push(new Chapter(x.text(false), x.attr("value").url()));
    });
    return chapters;
}

async function getNovel(novelUrl) {
    var container = parser.jq(await HttpClient.getHtml(novelUrl));
    var chapters = await getChapters(novelUrl, container);
    var item = new NovelReviews();
    var info = container.find('.info li');
    item.genres = info.search(x => x.innerHTML().toLowerCase().indexOf("genre") != -1).find("a").textArray();
    item.author = info.search(x => x.innerHTML().toLowerCase().indexOf("author") != -1).find("a").text(false)
    item.completed = info.search(x => x.innerHTML().toLowerCase().indexOf("status") != -1).text(false);
    item.alternativeNames = info.search(x => x.innerHTML().toLowerCase().indexOf("alternative names") != -1).text();
    return new DetaliItem(
        container.select('.book img').attr("src").url(),
        container.select('.title').text(false),
        container.select('.desc-text').outerHTML(),
        novelUrl,
        chapters,
        item,
        parser.name,
        undefined
    );
}

async function getChapter(url) {
    return parser.jq(await HttpClient.getHtml(url)).select('#chr-content').outerHTML();
}

async function latest(page) {
    var url = parser.latestUrl.replace('{p}', page.toString());
    var container = parser.jq(await HttpClient.getHtml(url));
    var result = [];
    container.find('.list-novel .row').forEach((x) => {
        if (x.select('img').attr("src").hasValue())
            result.push(
                new LightItem(
                    x.select('img').attr("src").url().replace(/\d+x\d+/, "150x170"),
                    x.select('.novel-title a').text(),
                    '',
                    x.select('.novel-title a').attr("href").url()
                    , parser.name
                ),
            );
    });

    return result;
}