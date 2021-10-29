export default `(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.manganelo";
    returnObject.detaliItemType = DetaliItemType.Managa;
    returnObject.parserLanguage = "en";
    returnObject.name = 'ManganElo';
    returnObject.latestUrl = 'https://manganelo.com/genre-all/{p}';
    returnObject.url = 'https://manganelo.com/';
    returnObject.searchUrl = 'https://manganelo.com/advanced_search?s=all&page={p}';
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://manganelo.com/favicon.png';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.multiSelection = true;
    returnObject.parserSearchSettings.genres = {
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

    returnObject.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Latest Release', ''),
            new labelValue('Newest', 'newest'),
            new labelValue('Top view', 'topview'),
        ],
    };

    returnObject.parserSearchSettings.statuses = {
        multiSelection: false,
        values: [
            new labelValue("Completed", "completed"),
            new labelValue("ongoing", "ongoing")
        ]
    }

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("hot", "Newest", "Search", false, new Filter(undefined, "newest")),
            new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "completed")),
            new Section("popular", "Most Popular", "Search", false, new Filter(undefined, "topview"))
        ]

        return sections.filter(x => !keys || keys.includes(x.name));
    }

    returnObject.translateSection = async (section, page) => {
        if (section.identifier == "Latest")
            return await returnObject.latest(page);
        else
            return await returnObject.search(section.filter || returnObject.defaultFilter(), page);
    }

    returnObject.defaultFilter = () => {
        var filter = new Filter();
        return filter;
    }

    returnObject.search = async (filter, page) => {
        var url = returnObject.searchUrl.replace("{p}", page.toString());
        if (filter.genres.length > 0)
            url = ("&g_i=_" + filter.genres.join("_")).uri(url);
        if (filter.sortType && filter.sortType != "")
            url = ("&orby=" + filter.sortType).uri(url);
        if (filter.active && filter.active != "")
            url = ("&sts=" + filter.active).uri(url);
        if (filter.title && filter.title.trim().length > 0)
            url = ("&keyw=" + filter.title.replace(/[ ]/g, "_")).uri(url);
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find('.content-genres-item').forEach((x) => {
            if (x.select('.genres-item-img img').attr("src").hasValue())
                result.push(
                    new LightItem(
                        x.select('.genres-item-img img').attr("src").url(),
                        x.select('.genres-item-img').attr("title").text(),
                        '',
                        x.select('.genres-item-img').attr("href").url(),
                        returnObject.name
                    ),
                );
        });

        return result;
    }



    returnObject.getNovel = async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));

        var item = new NovelReviews();
        var tbInfo = container.find(".variations-tableInfo tr")
        if (tbInfo.length() > 3)
            item.genres = tbInfo.eq(3).find(".table-value a").map(x => x.text(false));
        else if (tbInfo.length() == 3)
            item.genres = tbInfo.eq(2).find(".table-value a").map(x => x.text(false));
        item.description = container.select(".panel-story-info-description").text(false)

        item.uvotes = container.select("em[typeof='v:Rating']").text(false).removeNewLine(" ");
        item.alternativeNames = tbInfo.length() > 3 ? tbInfo.eq(0).select("#editassociated").text(false) : "";
        if (tbInfo.length() > 3)
            item.author = tbInfo.eq(1).select(".table-value").text(false);
        else if (tbInfo.length() > 0)
            item.author = tbInfo.eq(0).select(".table-value").text(false);
        item.lang = "";
        if (tbInfo.length() > 3)
            item.completed = tbInfo.eq(2).text(false).removeNewLine(" ");
        else if (tbInfo.length() == 3)
            item.completed = tbInfo.eq(1).text(false).removeNewLine(" ");
        var chapters = container.find(".row-content-chapter a").map(x => new Chapter(x.text(false), x.attr("href").url()));
        return new DetaliItem(
            container.select('.info-image img').attr("src").url(),
            container.select('.story-info-right h1').text(false),
            item.description,
            novelUrl,
            chapters.reverse(),
            item,
            returnObject.name,
            undefined,
        );
    }

    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).find(".container-chapter-reader img").map(x => x.attr("src").url()).filter(x => x && x != "");
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace('{p}', page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find('.content-genres-item').forEach(x => {
            if (x.select('.genres-item-img img').attr("src").hasValue())
                result.push(
                    new LightItem(
                        x.select(".genres-item-img img").attr("src").text(),
                        x.select(".genres-item-img").attr("title").text(false),
                        '',
                        x.select('.genres-item-img').attr("href").url(),
                        returnObject.name
                    ),
                );
        });

        return result;
    }

    return returnObject;
};`