(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.novelfull";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'NovelFull';
    returnObject.latestUrl = 'https://novelfull.com/latest-release-novel?page={p}';
    returnObject.url = 'https://novelfull.com';
    returnObject.searchUrl = 'https://novelfull.com/search?keyword={q}&page={p}';
    returnObject.chaptersUrl = 'https://novelfull.com/ajax-chapter-option?novelId={id}';
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://novelfull.com/web/images/favicon.ico';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.genres = {
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
    }

    returnObject.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Latest Release Novel', 'latest-release-novel'),
            new labelValue('Hot Novel', 'hot-novel'),
            new labelValue('Completed Novel', 'completed-novel'),
            new labelValue('Most Popular', 'most-popular'),
        ],
    }

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("hot", "Hot Novel", "Search", false, new Filter(undefined, "hot-novel")),
            new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, "completed-novel")),
            new Section("popular", "Most Popular", "Search", false, new Filter(undefined, "most-popular"))
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
        return new Filter();
    }

    returnObject.search = async (filter, page) => {
        var genreUrl = "genre/{g}?page={p}".uri(returnObject.url).replace("{p}", page.toString());
        var sortTypeUrl = "{s}?page={p}".uri(returnObject.url).replace("{p}", page.toString());
        var q = filter.genres.length > 0 ? genreUrl.replace("{g}", filter.genres[0]) : ((filter.sortType && filter.sortType != '' ? sortTypeUrl.replace("{s}", filter.sortType) : undefined));
        var query = q || returnObject.searchUrl.replace('{q}', filter.title || "").replace('{p}', page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(query));
        var result = [];
        container.find('.list-truyen .row').forEach((x) => {
            if (x.select('img').attr("src").hasValue())
                result.push(
                    new LightItem(new ImageHandler(returnObject.url, x.select('.truyen-title a').attr("href").url(), ".book img"),
                        x.select('.truyen-title a').text(false),
                        '',
                        x.select('.truyen-title a').attr("href").url(), returnObject.name
                    ),
                );
        });

        return result;
    }

    returnObject.getChapters = async (novelUrl, htmlContainer) => {
        var chapters = [];
        var url = "https://novelfull.com/ajax-chapter-option?novelId={id}".replace("{id}",
            htmlContainer.select("#rating").attr("data-novel-id").hasValue() ?
            htmlContainer.select("#rating").attr("data-novel-id").text() :
            htmlContainer.select("[data-novel-id]").attr("data-novel-id").text());

        var container = returnObject.parser.jq(await HttpClient.getHtml(url));

        container.find('option').forEach(a => {
            var aUrl = a.attr("value").url();
            var title = a.text(false);
            if (url && url !== '') chapters.push(new Chapter(title, aUrl));
        })
        return chapters;
    }

    returnObject.getNovel = async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapters = await returnObject.getChapters(novelUrl, container);
        var novelReviews = new NovelReviews();
        var infos = container.find(".info > div");
        novelReviews.genres = infos.eq(2).find("a").map(x => x.text(false));
        novelReviews.author = infos.eq(0).find("a").text(false);
        novelReviews.uvotes = container.select(".col-info-desc > .desc > .small strong:first-child span").text(false) + " / 10";
        novelReviews.completed = infos.last().select("a").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";

        return new DetaliItem(
            container.select('.book img').attr("src").url(),
            container.select('.title').text(false),
            container.select('.desc-text').cleanInnerHTML(),
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        );
    }


    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select('#chapter-content').cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace('{p}', page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find('.list-truyen .row').forEach((x) => {
            if (x.select('img').attr("src").hasValue())
                result.push(
                    new LightItem(
                        new ImageHandler(returnObject.url, x.select('.truyen-title a').attr("href").url(), ".book img"),
                        x.select('.truyen-title a').text(false),
                        '',
                        x.select('.truyen-title a').attr("href").url(), returnObject.name
                    ));
        });

        return result;
    }

    return returnObject;

};