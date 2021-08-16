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
    var container = parser.jq(await HttpClient.getHtml(query));
    var result = [];
    container.find('.list-item').forEach(x => {
        result.push(
            new LightItem(
                x.select('img').attr("src").url(),
                x.select('img').attr("alt").text(false),
                '',
                x.select('.book-name').attr("href").url(),
                parser.name
            ),
        );
    });
    return result;
}

async function getNovel(novelUrl, ignoreChapters) {
    var container = parser.jq(await HttpClient.getHtml(novelUrl));
    var chapters = [];
    var novelReviews = new NovelReviews();
    if (!ignoreChapters) {
        var htmlChapters = container.find('.chapter-list a');
        htmlChapters.forEach((x) => {
            chapters.push(
                new Chapter(x.select('.chapter-name').text(false), x.attr("href").url())
            );
        });
    }
    novelReviews.genres = container.find(".base-info .book-catalog .txt").map(x => x.text(false));
    novelReviews.author = container.select(".author .name").text(false);
    novelReviews.uvotes = container.select(".score").text(false) + " / 10";
    novelReviews.completed = container.select(".base-info .book-state .txt").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";
    return new DetaliItem(
        container.select('.book-container img').attr("src").url(),
        container.select('.book-info .book-name').text(false),
        container.select('.synopsis .content .desc').innerHTML(),
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    return parser.jq(await HttpClient.getHtml(url)).select('.read-container .section-list').outerHTML();
}

async function latest(page) {
    var container = parser.jq(await HttpClient.getHtml(parser.latestUrl));
    var result = [];

    container.find('.update-content').forEach((x) => {
        var u = x.select('.item-title a').attr("href");
        var title = x.select('.item-title a').text(false);
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
