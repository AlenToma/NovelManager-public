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
        new Section("new", "New Novel", "Search", false, HttpClient.cloneItem(item.defaultFilter, { sortType: "New" })),
        new Section("popular", "Popular Novel", "Search", false, HttpClient.cloneItem(item.defaultFilter, { sortType: "Popular" })),
        new Section("completed", "Completed Novel", "Search", false, HttpClient.cloneItem(item.defaultFilter, { active: false }))
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
    var container = await HttpClient.getHtml(novelUrl);
    var chapters = [];
    var htmlChapters = container.querySelectorAll(
        '.novel-content .chapter-item a',
    );

    htmlChapters.forEach((x) => {
        chapters.push(
            new Chapter(
                parser.text(x),
                parser.uurl(parser.attr("href", x))
            ),
        );
    });

    var desc = '';

    Array.from(container.querySelector('.novel-bottom')?.childNodes ?? [])
        .filter((x) => parser.outerHTML(x))
        .forEach((x, i) => {
            var node = x;
            if (i <= 3 && node && node.outerHTML) desc += node.outerHTML;
        });

    return new DetaliItem(
        parser.uurl(parser.attr("src", container.querySelector('.img-thumbnail'))),
        parser.text(container.querySelector('.novel-body h2'), false),
        desc,
        novelUrl,
        chapters,
        Array.from(container.querySelectorAll('.genres a')).map(x => x.innerHTML.htmlText(false)),
        parser.name,
    );
}

async function getChapter(url) {
    return parser.outerHTML((await HttpClient.getHtml(url)).querySelector('#chapter-content'));

}

async function latest(page) {
    var container = await HttpClient.getHtml(parser.latestUrl);
    var data = container.querySelectorAll('.section-content .title a');
    return await Array.from(data).asyncForeachWithReturn(async (x) => {
        return new LightItem(async () => {
            return parser.uurl(parser.attr("src", (await HttpClient.getHtml(parser.uurl(parser.attr("href", x.getAttribute('href'))))).querySelector('.img-thumbnail')))
        }, x.innerHTML, '', parser.uurl(parser.attr("href", x)), parser.name);
    });
}