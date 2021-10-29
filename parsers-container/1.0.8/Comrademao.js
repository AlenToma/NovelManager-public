export default `(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client) => {
    var returnObject = {};
    returnObject.id = "1.comrademao";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.name = 'Comrademao';
    returnObject.latestUrl = 'https://comrademao.com/page/{p}/';
    returnObject.url = 'https://comrademao.com';
    returnObject.searchUrl = 'https://comrademao.com/page/{p}/?s={q}&post_type=novel';
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://www.google.com/s2/favicons?domain=https://comrademao.com';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserLanguage = "en";
    returnObject.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue('Action'),
            new labelValue('Comedy'),
            new labelValue('Fantasy'),
            new labelValue('Harem'),
            new labelValue('Mature'),
            new labelValue('Mystery'),
            new labelValue('Romance'),
            new labelValue('Sci-fi'),
            new labelValue('Tragedy'),
            new labelValue('Xianxia'),
            new labelValue('Wuxia'),
            new labelValue('Xuanhuan'),
            new labelValue('Adventure'),
            new labelValue('Supernatural'),
            new labelValue('Drama'),
            new labelValue('Martial Arts', "Martial-Arts"),
            new labelValue('Seinen'),
            new labelValue('Psychological'),
            new labelValue('Slice of Life', "slice-of-life"),
        ],
    };



    returnObject.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Chinese', 'chinese'),
            new labelValue('Japanese', 'japanese'),
            new labelValue('Korean', 'korean'),
        ],
    };

    returnObject.parserSearchSettings.statuses = {
        multiSelection: false,
        values: [
            new labelValue("Complete", "complete"),
            new labelValue("OnGoing", "on-going")
        ]
    }

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "complete")),
            new Section("chinese", "Chinese", "Search", false, new Filter(undefined, "chinese")),
            new Section("japanese", "Japanese", "Search", false, new Filter(undefined, "japanese")),
            new Section("korean", "Korean", "Search", false, new Filter(undefined, "korean"))
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
        var sortTypeUri = "https://comrademao.com/mtype/{s}/page/{p}/"
        var sortTypeUrl = sortTypeUri.replace("{s}", filter.sortType).replace("{p}", page.toString());

        var url = filter.sortType && filter.sortType != "" ? sortTypeUrl : returnObject.searchUrl.replace('{q}', filter.title || "").replace("{p}", page.toString());
        if (filter.genres.length && filter.genres.length > 0)
            url = ("genre/" + filter.genres[0] + "/page/{p}").replace("{p}", page.toString()).uri(returnObject.url);
        else
        if (filter.active && (!filter.sortType || filter.sortType == ""))
            url = ("status/" + filter.active + "/page/{p}").replace("{p}", page.toString()).uri(returnObject.url);

        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var mybox = container.select(".mybox").hasElement();
        var item = !mybox ? container.find("section .columns") : container.find(".mybox li");

        var result = [];
        item.forEach(x => {
            var a = mybox ? x.select("h3 a") : x.find("a").last();
            result.push(new LightItem(
                x.select("img").attr("src").url(),
                a.text(false), "",
                a.attr("href").url(), returnObject.name));
        });

        return result;
    }

    returnObject.getChapters = async (url) => {
        var result = {};
        var page = 1;

        while (true) {

            var pUrl = ("/page/{page}/").uri(url);
            var item = returnObject.parser.renderCounterCalls(page, pUrl);
            page = item.page;
            var values = await Promise.all(item.promises);
            var breakIt = false;

            values.forEach(x => {
                if (!breakIt) {
                    var items = returnObject.parser.jq(x).find("tbody tr th a");
                    if (!items.hasElements()) {
                        breakIt = true;
                    }

                    var resultA = items.reduce((arr, x) => {
                        arr[x.text() + x.attr("href").url()] = new Chapter(x.text(false), x.attr("href").url());
                    }, {});

                    if (returnObject.parser.validateChapters(resultA, result) == false) {
                        breakIt = true;
                    }
                }

            })
            if (breakIt)
                break;

        }
        return Object.values(result);
    }

    returnObject.getNovel = async (novelUrl, basicInfo) => {

        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl, basicInfo));
        var chapters = basicInfo === true ? [] : await returnObject.getChapters(novelUrl);
        var novelReviews = new NovelReviews();
        if (!basicInfo) {
            try {
                var node = container.find("#NovelInfo > p");

                novelReviews.genres = node.eq(1).find("a").map(x => x.text());
                novelReviews.author = node.eq(2).select("a").text();
                novelReviews.completed = node.last().select("a").text() === "Complete" ? "Status:Completed" : "Status:Ongoing";
                novelReviews.authorUrl = node.eq(2).select("a").attr("href").text();

            } catch (e) {
                console.log(e);
            }

        }
        return new DetaliItem(
            container.select('#NovelInfo img').attr("src").url(),
            container.select('title').text().replace("Comrade Mao", "").replace("-", "").trim(),
            container.find('#NovelInfo .columns .column').last().cleanInnerHTML(),
            novelUrl,
            chapters.reverse(),
            novelReviews,
            returnObject.name,
            undefined,
        )
    }

    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select("#content").cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace("{p}", page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find("tbody > tr > th:first-child > a").forEach(x => {
            result.push(new LightItem(async () => (await returnObject.getNovel(x.attr("href").url(), true)).image,
                x.text(false), "", x.attr("href").url(), returnObject.name));
        });
        return result;
    }

    return returnObject;
};`