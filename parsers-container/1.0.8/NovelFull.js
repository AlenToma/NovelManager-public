function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("hot", "Hot Novel", "Search", false, new Filter(undefined, "hot-novel")),
        new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, "completed-novel")),
        new Section("popular", "Most Popular", "Search", false, new Filter(undefined, "most-popular"))
    ]

    item.id = "1.novelfull";
    item.detaliItemType = DetaliItemType.Novel;
    item.parserLanguage = "en";
    item.name = 'NovelFull';
    item.latestUrl = 'https://novelfull.com/latest-release-novel?page={p}';
    item.url = 'https://novelfull.com';
    item.searchUrl = 'https://novelfull.com/search?keyword={q}&page={p}';
    item.panination = true;
    item.searchPagination = true;
    item.icon = 'https://novelfull.com/web/images/favicon.ico';
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
            new labelValue('Kỳ Tích Vương Tọa', 'Kỳ+Tích+Vương+Tọa'),
            new labelValue('MT'),
        ],
    };

    item.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Latest Release Novel', 'latest-release-novel'),
            new labelValue('Hot Novel', 'hot-novel'),
            new labelValue('Completed Novel', 'completed-novel'),
            new labelValue('Most Popular', 'most-popular'),
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
    var data = container.querySelectorAll('.list-truyen .row');
    var result = []
    data.forEach((x) => {
        if (parser.attr("src", x.querySelector('img')) !== '')
            result.push(
                new LightItem(async () => { return (await getNovel(parser.uurl(parser.attr("href", x.querySelector('.truyen-title a'))), true)).image },
                    parser.text(x.querySelector('.truyen-title a'), false),
                    '',
                    parser.uurl(parser.attr("href", x.querySelector('.truyen-title a'))), parser.name
                ),
            );
    });

    return result;
}

async function getChapters(novelUrl, htmlContainer) {
    var chapters = []
    var url = 'https://novelfull.com/ajax-chapter-option?novelId={id}'.chaptersUrl.replace(
        '{id}',
        parser.attr("data-novel-id", htmlContainer.querySelector('#rating')) != "" ?
            parser.attr("data-novel-id", htmlContainer.querySelector('#rating')) :
            parser.attr("data-novel-id", htmlContainer.querySelector("[data-novel-id]"))
    );

    var container = await HttpClient.getHtml(url);
    var htmlChapters = container.querySelectorAll('option');

    for (var i = 0; i < htmlChapters.length; i++) {
        var a = htmlChapters[i];
        var aUrl = parser.uurl(parser.attr("value", a));
        var title = a.innerHTML;
        if (url && url !== '') chapters.push(new Chapter(title, aUrl));
    }

    return chapters;
}

async function getNovel(novelUrl, ignoreChapters) {
    var container = await HttpClient.getHtml(novelUrl);
    var chapters = ignoreChapters ? [] : await getChapters(novelUrl, container);
    var novelReviews = new NovelReviews();
    var infos = Array.from(container.querySelectorAll(".info > div"))
    novelReviews.genres = infos.length > 2 ? Array.from(infos.findAt(2).querySelectorAll("a")).map(x => x.innerText) : []
    novelReviews.author = infos.length > 0 ? Array.from(infos.findAt(0).querySelectorAll("a")).map(x => x.innerText).join(",") : ""
    novelReviews.uvotes = parser.text(container.querySelector(".col-info-desc > .desc > .small strong:first-child span"), false) + " / 10";
    novelReviews.completed = (infos.last() ? parser.text(infos.last().querySelector("a"), false) : "") === "Completed" ? "Status:Completed" : "Status:Ongoing";
    return new DetaliItem(
        parser.uurl(parser.attr("src", container.querySelector('.book img'))),
        parser.text(container.querySelector('.title')),
        parser.outerHTML(container.querySelector('.desc-text')),
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    var container = await HttpClient.getHtml(url);
    return parser.outerHTML(container.querySelector('#chapter-content'));
}

async function latest(page) {
    var url = parser.latestUrl.replace('{p}', page.toString());
    var container = await HttpClient.getHtml(url);
    var result = [];
    var data = container.querySelectorAll('.list-truyen .row');
    data.forEach((x) => {
        if (parser.attr("src", x.querySelector('img')) != "")
            result.push(
                new LightItem(async () => { return (await parser.getNovel(parser.uurl(parser.attr("href", x.querySelector('.truyen-title a'))), true)).image },
                    parser.text(x.querySelector('.truyen-title a'), false),
                    '',
                    parser.uurl(parser.attr("href", x.querySelector('.truyen-title a'))), parser.name
                ))
    });

    return result;
}