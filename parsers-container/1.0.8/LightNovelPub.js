export default `(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client) => {
    const returnObject = {};
    returnObject.id = "1.lightnovelpub";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'LightNovelPub';
    returnObject.latestUrl = 'https://www.lightnovelpub.com/browse/all/updated/all/{p}';
    returnObject.url = 'https://www.lightnovelpub.com';
    returnObject.searchUrl = 'https://www.lightnovelpub.com/lnwsearchlive?inputContent={q}';
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://static.lightnovelpub.com/content/img/lightnovelpub/apple-touch-icon.png';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.multiSelection = true;
    returnObject.parserSearchSettings.genres = {
        multiSelection: true,
        values: [
            new labelValue("Action", 1),
            new labelValue("Adult", 48),
            new labelValue("Adventure", 2),
            new labelValue("Comedy", 12),
            new labelValue("Contemporary Romance", 59),
            new labelValue("Drama", 3),
            new labelValue("Eastern Fantasy", 58),
            new labelValue("Ecchi", 11),
            new labelValue("Fantasy", 4),
            new labelValue("Fantasy Romance", 60),
            new labelValue("Gender Bender", 52),
            new labelValue("Harem", 5),
            new labelValue("Historical", 46),
            new labelValue("Horror", 44),
            new labelValue("Josei", 23),
            new labelValue("Lolicon", 51),
            new labelValue("Magical Realism", 57),
            new labelValue("Martial Arts", 6),
            new labelValue("Mature", 7),
            new labelValue("Mecha", 45),
            new labelValue("Mystery", 14),
            new labelValue("Psychological", 18),
            new labelValue("Romance", 8),
            new labelValue("School Life", 21),
            new labelValue("Sci-fi", 19),
            new labelValue("Seinen", 49),
            new labelValue("Shoujo", 47),
            new labelValue("Shoujo Ai", 61),
            new labelValue("Shounen", 43),
            new labelValue("Shounen Ai", 53),
            new labelValue("Slice of Life", 13),
            new labelValue("Smut", 56),
            new labelValue("Sports", 50),
            new labelValue("Supernatural", 16),
            new labelValue("Tragedy", 9),
            new labelValue("Video Games", 55),
            new labelValue("Wuxia", 42),
            new labelValue("Xianxia", 20),
            new labelValue("Xuanhuan", 10),
            new labelValue("Yaoi", 54)
        ]
    }

    returnObject.parserSearchSettings.statuses = {
        multiSelection: true,
        values: [
            new labelValue("Completed", 1),
            new labelValue("Ongoing", 2),
        ]
    }

    returnObject.parserSearchSettings.languages = {
        multiSelection: true,
        values: [
            new labelValue("Chinese Novel", 4),
            new labelValue("Korean Novel", 5),
            new labelValue("Light Novel", 6),
            new labelValue("Light Novel (JP)", 9),
            new labelValue("Light Novel (KR)", 10),
            new labelValue("Published Novel (CN)", 11),
            new labelValue("Published Novel (KR)", 8),
            new labelValue("Web Novel", 7),
            new labelValue("Web Novel (CN)", 1),
            new labelValue("Web Novel (JP)", 3),
            new labelValue("Web Novel (KR)", 2)
        ]
    }


    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("romance", "Romance", "Search", false, new Filter([8])),
            new Section("action", "Action", "Search", false, new Filter([1])),
            new Section("mystery", "Mystery", "Search", false, new Filter([14])),
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
    };

    returnObject.getGenres = async (filter, page) => {
        var url = "https://www.lightnovelpub.com/searchadv?ctgcon=and&tagcon=and&ratcon=min&rating=0&sort=sdate&pageNo=" + page;
        if (filter.active)
            url = url + "&status=" + filter.active;
        if (filter.language && filter.language != "")
            url = url + "&genretypes=" + filter.language;

        if (filter.genres.length > 0)
            url = url + "&categories=" + filter.genres.join("%2C");
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find(".novel-item").forEach(x => {
            result.push(new LightItem(x.select("img").attr("data-src | src").url(),
                x.select(".novel-title a").text(false),
                "",
                x.select(".novel-title a").attr("href").url(),
                returnObject.name));
        });

        return result;
    }

    returnObject.search = async (filter, page) => {
        if (!filter.title)
            filter.title = "";
        var url = returnObject.searchUrl.replace("{p}", page.toString()).replace("{q}", filter.title);
        if (filter.genres.length > 0 || filter.language != "" || filter.active)
            return await returnObject.getGenres(filter, page);
        var container = await HttpClient.GetJson(url);
        var html = returnObject.parser.jq(container.resultview.toHtml());
        var result = [];
        html.find(".novel-item").forEach(x => {
            result.push(new LightItem(x.select("img").attr("data-src | src").url(),
                x.select(".novel-title").text(false),
                "",
                x.select("a").attr("href").url(),
                returnObject.name));
        });
        return result;
    }


    returnObject.getChapters = async (novelUrl) => {
        var page = 1;
        var result = {};
        while (true) {
            var url = novelUrl + "/page-{page}";
            var item = returnObject.parser.renderCounterCalls(page, url);
            page = item.page;
            var values = await Promise.all(item.promises);
            var breakIt = false;

            values.forEach(x => {
                if (!breakIt) {
                    var items = returnObject.parser.jq(x).find(".chapter-list a");
                    if (!items.hasElements()) {
                        breakIt = true;
                    }

                    var resultA = items.reduce((arr, x) => {
                        arr[x.attr("title").text() + x.attr("href").url()] = new Chapter(x.attr("title").text(), x.attr("href").url());
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

    returnObject.getNovel = async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapterUrl = container.select(".chapter-latest-container").attr("href").url();
        if (!chapterUrl || chapterUrl == "")
            chapterUrl = novelUrl;
        var chapters = await returnObject.getChapters(chapterUrl);
        var novelReviews = new NovelReviews();
        var info = container.select(".novel-info");
        novelReviews.genres = info.find(".categories a").textArray();
        novelReviews.author = info.select(".author a").text(false);
        novelReviews.uvotes = "Rating:" + container.select(".rating-star strong").text(false) + "/5";
        novelReviews.description = container.select("#info .summary").cleanInnerHTML();
        novelReviews.completed = info.text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";

        return new DetaliItem(
            container.select(".cover img").attr("data-src | src").url(),
            container.select(".novel-title").text(false),
            novelReviews.description,
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        )
    }

    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select("#chapter-container").cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace("{p}", page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find(".novel-item").forEach(x => {
            result.push(new LightItem(x.select(".novel-cover img").attr("data-src | src").url(),
                x.select(".novel-title").text(),
                "",
                x.select(".cover-wrap a").attr("href").url(),
                returnObject.name));
        });
        return result;
    }

    return returnObject;

};`