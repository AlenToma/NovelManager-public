(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.readlightnovel";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'ReadLightNovel';
    returnObject.latestUrl = 'https://www.readlightnovel.cc';
    returnObject.url = 'https://www.readlightnovel.cc/';
    returnObject.searchUrl = 'https://www.readlightnovel.cc/search/{q}/{p}';
    returnObject.panination = false;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://www.google.com/s2/favicons?domain=https://www.readlightnovel.cc/';

    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.genres = {
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

    returnObject.getSections = async (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true)
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
    };

    returnObject.getGenresSearch = async (filter, page) => {
        var q = 'https://www.readlightnovel.cc/memberaction.aspx';
        var f = {
            action: 'nextbookcategory',
            categoryid: filter.genres[0],
            page: page,
        };

        var json = await HttpClient.postForm(q, f);

        return json && json.data ? json.data.map((x) =>
                new LightItem(
                    async () => {
                            return (await returnObject.getNovel(x.BookPinYin.uri(returnObject.parser.url) + "/", true)).image
                        },
                        x.BookName,
                        x.Description,
                        x.BookPinYin.uri(treturnObjecthis.url) + "/",
                        returnObject.name
                ),
            ) :
            [];
    }

    returnObject.search = async (filter, page) => {
        if (filter.genres.length > 0)
            return await returnObject.getGenresSearch(filter, page);

        var query = returnObject.searchUrl
            .replace('{q}', filter.title || "")
            .replace('{p}', page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(query));
        var result = [];
        container.find('.list-item').forEach(x => {
            result.push(
                new LightItem(
                    x.select('img').attr("src").url(),
                    x.select('img').attr("alt | title").text(false),
                    '',
                    x.select('.book-name').attr("href").url(),
                    returnObject.name
                ),
            );
        });
        return result;
    }

    returnObject.getNovel = async (novelUrl, ignoreChapters) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl, ignoreChapters));
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
        novelReviews.genres = container.find(".base-info .book-catalog .txt").textArray();
        novelReviews.author = container.select(".author .name").text(false);
        novelReviews.uvotes = container.select(".score").text(false) + " / 10";
        novelReviews.completed = container.select(".base-info .book-state .txt").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";
        return new DetaliItem(
            container.select('.book-container img').attr("src").url(),
            container.select('.book-info .book-name').text(false),
            container.select('.synopsis .content .desc').cleanInnerHTML(),
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        );
    }

    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select('.read-container .section-list').cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(returnObject.latestUrl));
        var result = [];

        container.find('.update-content').forEach((x) => {
            var u = x.select('.item-title a').attr("href").text(false);
            var title = x.select('.item-title a').text(false);
            if (u != "" && !result.find((x) => u.uri(returnObject.url) == x.novel || title == x.title))
                result.push(
                    new LightItem(
                        async () => {
                                return (await returnObject.getNovel(u.uri(returnObject.url), true)).image
                            },
                            title,
                            '',
                            u.uri(returnObject.url),
                            returnObject.name
                    ),
                );
        });
        return result;
    }

    return returnObject;
};