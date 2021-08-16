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
    var q =
        filter.genres.length > 0
            ? genreUrl.replace("{g}", filter.genres[0])
            : filter.sortType && filter.sortType != ''
                ? sortTypeUrl.replace("{s}", filter.sortType)
                : undefined;

    var query = q ? q :
        parser.searchUrl
            .replace('{q}', filter.title)
            .replace('{p}', page.toString());
    var container = await HttpClient.getHtml(query);
    var data = container.querySelectorAll('.list-novel .row');
    var result = [];
    data.forEach((x) => {
        if (parser.attr("src", x.querySelector('img')) != "")
            result.push(
                new LightItem(
                    parser.uurl(parser.attr("src", x.querySelector('img')).replace(/\d+x\d+/, "150x170")),
                    parser.text(x.querySelector('.novel-title a'), false),
                    '',
                    parser.uurl(parser.attr("href", x.querySelector('.novel-title a')))
                    , parser.name
                ),
            );
    });

    return result;
}

async function getChapters(novelUrl, htmlContainer) {
    var chapters = [];
    var url = parser.chaptersUrl.replace('{id}',
        parser.attr('data-novel-id', htmlContainer.querySelector('#rating')) !== "" ?
            parser.attr('data-novel-id', htmlContainer.querySelector('#rating')) :
            parser.attr('data-novel-id', htmlContainer.querySelector('[data-novel-id]'))
    );

    var container = await HttpClient.getHtml(url);
    var htmlChapters = container.querySelectorAll('option');
    htmlChapters.forEach(x => {
        var aUrl = parser.uurl(parser.attr("value", a));
        var title = parser.text(a);
        if (aUrl && aUrl !== '')
            chapters.push(new Chapter(title, aUrl));
    });
    return chapters;
}

async function getNovel(novelUrl) {
    var container = await HttpClient.getHtml(novelUrl);
    var chapters = await getChapters(novelUrl, container);
    var item = new NovelReviews();
    var info = Array.from(container.querySelectorAll('.info li'));
    if (info.find(x => x.innerHTML.toLowerCase().indexOf("genre") != -1))
        item.genres = Array.from(info.find(x => x.innerHTML.toLowerCase().indexOf("genre") != -1).querySelectorAll("a")).map(x => x.innerHTML.htmlText(false));
    if (info.find(x => x.innerHTML.toLowerCase().indexOf("author") != -1))
        item.author = Array.from(info.find(x => x.innerHTML.toLowerCase().indexOf("author") != -1).querySelectorAll("a")).map(x => x.innerHTML.htmlText(false)).join(",");
    if (info.find(x => x.innerHTML.toLowerCase().indexOf("status") != -1))
        item.completed = info.find(x => x.innerHTML.toLowerCase().indexOf("status") != -1).innerHTML.htmlText(false);
    if (info.find(x => x.innerHTML.toLowerCase().indexOf("alternative names") != -1))
        item.alternativeNames = info.find(x => x.innerHTML.toLowerCase().indexOf("alternative names") != -1).innerHTML.htmlText(false);
    return new DetaliItem(
        parser.uurl(parser.attr("src", container.querySelector('.book img'))),
        parser.text(container.querySelector('.title')),
        parser.outerHTML(container.querySelector('.desc-text')),
        novelUrl,
        chapters,
        item,
        parser.name,
        undefined
    );
}

async function getChapter(url) {
    var container = await HttpClient.getHtml(url);
    return parser.outerHTML(container.querySelector('#chr-content'));
}

async function latest(page) {
    var url = parser.latestUrl.replace('{p}', page.toString());
    var container = await HttpClient.getHtml(url);
    var result = [];
    var data = container.querySelectorAll('.list-novel .row');
    data.forEach((x) => {
        if (x.querySelector('img')?.getAttribute('src'))
            result.push(
                new LightItem(
                    parser.uurl(parser.attr("src", x.querySelector('img')).replace(/\d+x\d+/, "150x170")),
                    parser.text(x.querySelector('.novel-title a'), false),
                    '',
                    parser.uurl(parser.attr("href", x.querySelector('.novel-title a')))
                    , parser.name
                ),
            );
    });

    return result;
}