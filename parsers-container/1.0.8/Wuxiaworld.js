function parserDetali() {
    var item = {};
    item.id = "1.wuxiaworld";
    item.detaliItemType = DetaliItemType.Novel;
    item.parserLanguage = "en";
    item.name = 'Wuxiaworld';
    item.latestUrl = 'https://www.wuxiaworld.com/updates';
    item.url = 'https://www.wuxiaworld.com';
    item.searchUrl = 'https://www.wuxiaworld.com/api/novels/search';
    item.panination = false;
    item.searchPagination = true;
    item.icon = 'https://www.wuxiaworld.com/favicon-32x32.png?v=jwEkKXw8PY';

    item.parserSearchSettings = new ParserSearchSettings();
    item.parserSearchSettings.multiSelection = true;
    item.parserSearchSettings.genres =
    {
        multiSelection: true,
        values: [
            new labelValue('Action'),
            new labelValue('Cheat Systems'),
            new labelValue('Cooking'),
            new labelValue('Alchemy'),
            new labelValue('Crafting'),
            new labelValue('Comedy'),
            new labelValue('Fantasy'),
            new labelValue('Harem'),
            new labelValue('Mature'),
            new labelValue('Kingdom Building'),
            new labelValue('Modern Setting'),
            new labelValue('Mystery'),
            new labelValue('Political Intrigue'),
            new labelValue('Pets'),
            new labelValue('Post-apocalyptic'),
            new labelValue('Romance'),
            new labelValue('Female Protagonist'),
            new labelValue('Sci-fi'),
            new labelValue('Thriller'),
            new labelValue('Superpowers'),
            new labelValue('Tragedy'),
            new labelValue('Virtual Reality'),
            new labelValue('Xianxia'),
            new labelValue('Wuxia'),
            new labelValue('Xuanhuan'),
            new labelValue('Esports'),
            new labelValue('Cultivation'),
        ],
    };

    item.parserSearchSettings.languages =
    {
        multiSelection: false,
        values: [
            new labelValue('Any'),
            new labelValue('Chinese'),
            new labelValue('English'),
            new labelValue('Korean'),
        ],
    };

    item.parserSearchSettings.statuses =
    {
        multiSelection: false,
        values: [
            new labelValue('Any', null),
            new labelValue('Ongoing', true),
            new labelValue('Completed', false),
        ],
    };

    item.parserSearchSettings.sortTypes =
    {
        multiSelection: false,
        values: [
            new labelValue('Name'),
            new labelValue('Popular'),
            new labelValue('Chapters'),
            new labelValue('New'),
            new labelValue('Rating'),
        ],
    };

    item.defaultFiter = new Filter();
    item.defaultFiter.language = item.parserSearchSettings.languages.values[0].value;
    item.defaultFiter.sortType = item.parserSearchSettings.sortTypes.values[0].value;
    item.defaultFiter.active = item.parserSearchSettings.statuses.values[0].value;

    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("new", "New Novel", "Search", false, HttpClient.cloneItem(item.defaultFiter, { sortType: "New" })),
        new Section("popular", "Popular Novel", "Search", false, HttpClient.cloneItem(item.defaultFiter, { sortType: "Popular" })),
        new Section("completed", "Completed Novel", "Search", false, HttpClient.cloneItem(item.defaultFiter, { active: false }))
    ]

    return item;
}

async function search(filter, page) {
    var data = await HttpClient.postJson(parser.searchUrl, filter);
    return data && data.items
        ? data.items.filter(x => !x.sneakPeek).map(x =>
            new LightItem(
                x.coverUrl,
                x.name,
                x.synopsis,
                x.slug.uri('https://www.wuxiaworld.com/novel/'), parser.name
            ),
        )
        : [];
}

async function getNovel(novelUrl) {
    var container = parser.jq(await HttpClient.getHtml(novelUrl));
    var chapters = [];
    container.find('.novel-content .chapter-item a').forEach((x) => {
        chapters.push(
            new Chapter(
                x.text(false),
                a.attr("href").url()
            ),
        );
    });

    return new DetaliItem(
        container.select('.img-thumbnail').attr("src").url(),
        container.select('.novel-body h2').text(false),
        container.find('.novel-bottom >div').findAt(1).innerHTML(),
        novelUrl,
        chapters,
        container.find('.genres a').textArray(),
        parser.name,
    );
}

async function getChapter(url) {
    return parser.jq(await HttpClient.getHtml(url)).select('#chapter-content').outerHTML();
}

async function latest(page) {
    var container = parser.jq(await HttpClient.getHtml(parser.latestUrl));
    return container.find('.section-content .title a').map((x) => {
        return new LightItem(async () => {
            var elem = parser.jq(await HttpClient.getHtml(x.attr('href').url()))
            return elem.select(".img-thumbnail").attr("src").url();
        }, x.text(false), '', x.attr('href').url(), parser.name);
    });
}