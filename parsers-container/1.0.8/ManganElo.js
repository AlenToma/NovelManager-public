function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("hot", "Newest", "Search", false, new Filter(undefined, "newest")),
        new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "completed")),
        new Section("popular", "Most Popular", "Search", false, new Filter(undefined, "topview"))
    ]

    item.id = "1.manganelo";
    item.detaliItemType = DetaliItemType.Managa;
    item.parserLanguage = "en";
    item.name = 'ManganElo';
    item.latestUrl = 'https://manganelo.com/genre-all/{p}';
    item.url = 'https://manganelo.com/';
    item.searchUrl = 'https://manganelo.com/advanced_search?s=all&page={p}';
    item.panination = true;
    item.searchPagination = true;
    item.icon = 'https://manganelo.com/favicon.png';
    item.parserSearchSettings = new ParserSearchSettings();
    item.parserSearchSettings.multiSelection = true;
    item.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue('Action', 2),
            new labelValue('Adult', 3),
            new labelValue('Adventure', 4),
            new labelValue('Comedy', 6),
            new labelValue('Cooking', 7),
            new labelValue('Doujinshi', 9),
            new labelValue('Drama', 10),
            new labelValue('Ecchi', 11),
            new labelValue('Fantasy', 12),
            new labelValue('Gender bender', 13),
            new labelValue('Harem', 14),
            new labelValue('Historical', 15),
            new labelValue('Horror', 16),
            new labelValue('Isekai', 45),
            new labelValue('Josei', 17),
            new labelValue('Manhua', 44),
            new labelValue('Manhwa', 43),
            new labelValue('Martial arts', 19),
            new labelValue('Mature', 20),
            new labelValue('Mecha', 21),
            new labelValue('Medical', 22),
            new labelValue('Mystery', 24),
            new labelValue('One shot', 25),
            new labelValue('Psychological', 26),
            new labelValue('Romance', 27),
            new labelValue('School life', 28),
            new labelValue('Sci fi', 29),
            new labelValue('Seinen', 30),
            new labelValue('Shoujo', 31),
            new labelValue('Shoujo ai', 32),
            new labelValue('Shounen', 33),
            new labelValue('Shounen ai', 34),
            new labelValue('Slice of life', 35),
            new labelValue('Smut', 36),
            new labelValue('Sports', 37),
            new labelValue('Supernatural', 38),
            new labelValue('Tragedy', 39),
            new labelValue('Webtoons', 40),
            new labelValue('Yaoi', 41),
            new labelValue('Yuri', 42),
        ],
    };

    item.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Latest Release', ''),
            new labelValue('Newest', 'newest'),
            new labelValue('Top view', 'topview'),
        ],
    };

    item.parserSearchSettings.statuses = {
        multiSelection: false,
        values: [
            new labelValue("Completed", "completed"),
            new labelValue("ongoing", "ongoing")
        ]
    }

    return item;
}

async function search(filter, page) {
    var url = parser.searchUrl.replace("{p}", page.toString());
    if (filter.genres.length > 0)
        url = ("&g_i=_" + filter.genres.join("_")).uri(url);
    if (filter.sortType && filter.sortType != "")
        url = ("&orby=" + filter.sortType).uri(url);
    if (filter.active && filter.active != "")
        url = ("&sts=" + filter.active).uri(url);
    if (filter.title && filter.title.trim().length > 0)
        url = ("&keyw=" + filter.title.replace(/[ ]/g, "_")).uri(url);
    var container = await HttpClient.getHtml(url);
    var data = container.querySelectorAll('.content-genres-item');
    var result = [];
    data.forEach((x) => {
        if (parser.attr("src", x.querySelector('.genres-item-img img')) !== "")
            result.push(
                new LightItem(
                    parser.uurl(parser.attr("src", x.querySelector('.genres-item-img img'))),
                    parser.attr("title", x.querySelector('.genres-item-img')),
                    '',
                    parser.uurl(parser.attr("href", x.querySelector('.genres-item-img'))),
                    parser.name
                ),
            );
    });

    return result;
}



async function getNovel(novelUrl) {
    var container = await HttpClient.getHtml(novelUrl);

    var item = new NovelReviews();
    var tbInfo = container.querySelectorAll(".variations-tableInfo tr")
    if (tbInfo.length > 3)
        item.genres = Array.from(tbInfo[3].querySelectorAll(".table-value a")).map(x => x.innerHTML.htmlText(false));
    else if (tbInfo.length == 3)
        item.genres = Array.from(tbInfo[2].querySelectorAll(".table-value a")).map(x => x.innerHTML.htmlText(false));
    item.description = parser.text(container.querySelector(".panel-story-info-description"));

    item.uvotes = parser.text(container.querySelector("em[typeof='v:Rating']")).replace(/\r?\n|\r/g, " ");
    item.alternativeNames = tbInfo.length > 3 ? parser.text(tbInfo[0].querySelector("#editassociated")) : "";
    if (tbInfo.length > 3)
        item.author = tbInfo.length >= 1 ? parser.text(tbInfo[1].querySelector(".table-value"), false) : "";
    else if (tbInfo.length > 0)
        item.author = parser.text(tbInfo[0].querySelector(".table-value"), false);
    item.lang = "";
    if (tbInfo.length > 3)
        item.completed = parser.text(tbInfo[2], false).replace(/\r?\n|\r/g, " ");
    else if (tbInfo.length == 3)
        item.completed = parser.text(tbInfo[1], false).replace(/\r?\n|\r/g, " ");
    var chapters = Array.from(container.querySelectorAll(".row-content-chapter a")).map(x => new Chapter(x.innerHTML, parser.uurl(x.getAttribute("href"))));
    return new DetaliItem(
        parser.uurl(parser.attr("src", x.querySelector('.info-image img'))),
        parser.text(container.querySelector('.story-info-right h1'), false),
        item.description,
        novelUrl,
        chapters.reverse(),
        item,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    var container = await HttpClient.getHtml(url);
    var chps = Array.from(container.querySelectorAll('.container-chapter-reader img')).map(x => parser.uurl(x.getAttribute("src")));
    return chps ? chps.filter(x => x && x != "") : [];
}

async function latest(page) {
    var url = parser.latestUrl.replace('{p}', page.toString());
    var container = await HttpClient.getHtml(url);
    var result = [];
    var data = container.querySelectorAll('.content-genres-item');
    data.forEach((x) => {
        if (parser.attr("src", x.querySelector('.genres-item-img img')) != "")
            result.push(
                new LightItem(
                    parser.uurl(parser.attr("src", x.querySelector('.genres-item-img img'))),
                    parser.attr("title", x.querySelector('.genres-item-img')),
                    '',
                    parser.uurl(parser.attr("href", x.querySelector('.genres-item-img'))),
                    parser.name
                ),
            );
    });

    return result;
}