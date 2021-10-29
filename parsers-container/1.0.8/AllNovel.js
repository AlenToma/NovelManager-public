(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client) => {
    var returnObject = {};
    returnObject.id = "1.allnovel";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'AllNovel';
    returnObject.latestUrl = 'https://allnovel.net/';
    returnObject.url = 'https://allnovel.net/';
    returnObject.searchUrl = 'https://allnovel.net/search.php?keyword={q}';
    returnObject.panination = false;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://allnovel.net/media/favicon.png';
    returnObject.parserSearchSettings = new ParserSearchSettings();

    returnObject.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue("Romance", "romance.html?page={p}"),
            new labelValue("Adventure", "adventure.html?page={p}"),
            new labelValue("Thriller", "thriller.html?page={p}"),
            new labelValue("Fantasy", "fantasy.html?page={p}"),
            new labelValue("Young Adult", "young-adult.html?page={p}"),
            new labelValue("Mystery", "mystery.html?page={p}"),
            new labelValue("Historical", "historical.html?page={p}"),
            new labelValue("Horror", "horror.html?page={p}"),
            new labelValue("Science Fiction", "science-fiction.html?page={p}"),
            new labelValue("Humorous", "humorous.html?page={p}"),
            new labelValue("Christian", "christian.html?page={p}"),
            new labelValue("Western", "western.html?page={p}")
        ]
    }
    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("romance", "Romance", "Search", false, new Filter(["romance.html?page={p}"])),
            new Section("young-adult", "Young Adult", "Search", false, new Filter(["young-adult.html?page={p}"])),
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

    returnObject.search = async (filter, page) => {
        if (!filter.title)
            filter.title = "";
        if (filter.genres.length <= 0 && filter.title == "")
            return [];
        var url = filter.genres.length > 0 ? filter.genres[0].toString().uri(returnObject.url).replace("{p}", page) : returnObject.searchUrl.replace("{q}", filter.title);
        var result = []
        returnObject.parser.jq(await HttpClient.getHtml(url)).find(".list-novel a").forEach(x => {
            result.push(new LightItem(
                x.select("img").attr("src").url(),
                x.select(".title-home-novel").text(),
                "",
                x.attr("href").url(),
                returnObject.name));
        });

        return result;
    }

    returnObject.getNovel = async (novelUrl) => {

        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapters = container.find(".list-page-novel a").map(x => new Chapter(x.text(false), x.attr("href").url()));
        var novelReviews = new NovelReviews();
        var info = container.find(".list-info");
        novelReviews.genres = info.eq(1).find("a").textArray();
        novelReviews.author = info.eq(0).select("a").text(false);
        novelReviews.uvotes = info.eq(2).select("span").hasElement() ? info.eq(2).select("span").text(false) + " Views" : "";
        return new DetaliItem(
            container.select(".row img").attr("src").url(),
            container.select(".detail-novel h1").text(false),
            container.select(".des-novel").cleanInnerHTML(),
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        );
    }

    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).remove(".ad-container").select(".content_novel").cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace("{p}", page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find(".list-novel a").forEach(x => {
            result.push(new LightItem(
                x.select("img").attr("src").url(),
                x.select(".title-home-novel").text(false),
                "",
                x.attr("href").url(),
                returnObject.name));
        });

        return result;
    }

    return returnObject;
};