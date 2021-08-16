function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true)
    ]

    item.id = "1.readlightnovel";
    item.detaliItemType = DetaliItemType.Novel;
    item.parserLanguage = "en";
    item.name = 'ReadLightNovel';
    item.latestUrl = 'https://www.readlightnovel.cc';
    item.url = 'https://www.readlightnovel.cc/';
    item.searchUrl = 'https://www.readlightnovel.cc/search/{q}/{p}';
    item.panination = false;
    item.searchPagination = true;
    item.icon = 'https://www.google.com/s2/favicons?domain=https://www.readlightnovel.cc/';

    item.parserSearchSettings = new ParserSearchSettings();
    item.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue('Any', 0),
            new labelValue('Fantasy', 1),
            new labelValue('Xianxia', 2),
            new labelValue('Romantic', 3),
            new labelValue('Historical', 4),
            new labelValue('Sci-fi', 5),
            new labelValue('Game', 6),
        ],
    };

    return item;
}

async function getGenresSearch(filter, page) {
    var q = 'https://www.readlightnovel.cc/memberaction.aspx';
    var f = {
        action: 'nextbookcategory',
        categoryid: filter.genres[0],
        page: page,
    };

    var json = await HttpClient.postForm(q, f);

    return json && json.data ? json.data.map(
        (x) =>
            new LightItem(
                async () => {
                    return (await getNovel(x.BookPinYin.uri(parser.url) + "/", true)).image
                },
                x.BookName,
                x.Description,
                x.BookPinYin.uri(parser.url) + "/",
                parser.name
            ),
    )
        : [];
}

async function search(filter, page) {
    if (filter.genres.length > 0)
        return await getGenresSearch(filter, page);

    var query = parser.searchUrl
        .replace('{q}', filter.title)
        .replace('{p}', page.toString());
    var container = await HttpClient.getHtml(query);
    var data = container.querySelectorAll('.list-item');
    var result = [];
    data.forEach(x => {
        result.push(
            new LightItem(
                parser.uurl(parser.attr("src", x.querySelector('img'))),
                '',
                parser.attr("alt", x.querySelector('img')),
                '',
                parser.uurl(parser.attr("href", x.querySelector('.book-name'))),
                parser.name
            ),
        );
    });
    return result;
}

async function getNovel(novelUrl, ignoreChapters) {
    var container = await HttpClient.getHtml(novelUrl);
    var chapters = [];
    var novelReviews = new NovelReviews();
    if (!ignoreChapters) {
        var htmlChapters = container.querySelectorAll('.chapter-list a');
        htmlChapters.forEach((x) => {
            chapters.push(
                new Chapter(parser.text(x.querySelector('.chapter-name')), parser.uurl(parser.attr("href", x)),
                ),
            );
        });
    }
    novelReviews.genres = Array.from(container.querySelectorAll(".base-info .book-catalog .txt")).map(x => x.innerHTML.htmlText(false));
    novelReviews.author = parser.text(container.querySelector(".author .name"), false);
    novelReviews.uvotes = parser.text(container.querySelector(".score"), false) + " / 10";
    novelReviews.completed = parser.text(container.querySelector(".base-info .book-state .txt"), false) === "Completed" ? "Status:Completed" : "Status:Ongoing";
    return new DetaliItem(
        parser.uurl(parser.attr("src", container.querySelector('.book-container img'))),
        parser.text(container.querySelector('.book-info .book-name')),
        parser.innerHTML(container.querySelector('.synopsis .content .desc')),
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    return parser.outerHTML(((await HttpClient.getHtml(url)).querySelector('.read-container .section-list')));
}

async function latest(page) {
    var container = await HttpClient.getHtml(parser.latestUrl);
    var result = [];

    var data = container.querySelectorAll(
        '.update-content',
    );

    data.forEach((x) => {
        var u = parser.attr("href", x.querySelector('.item-title a'));
        var title = parser.text(x.querySelector('.item-title a'), false);
        if (u != "" && !result.find((x) => u.uri(parser.url) == x.novel || title == x.title))
            result.push(
                new LightItem(
                    async () => {
                        return (await getNovel(u.uri(parser.url), true)).image
                    },
                    title,
                    '',
                    u.uri(parser.url),
                    parser.name
                ),
            );
    });
    return result;
}
