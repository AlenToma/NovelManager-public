export default `(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.scribblehub";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'ScribbleHub';
    returnObject.latestUrl = 'https://www.scribblehub.com/?pg={p}';
    returnObject.url = 'https://www.scribblehub.com';
    returnObject.searchUrl = 'https://www.scribblehub.com/?s={q}&post_type=fictionposts';
    returnObject.panination = true;
    returnObject.searchPagination = false;
    returnObject.icon = 'https://www.scribblehub.com/favicon.ico';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.multiSelection = true;
    returnObject.parserSearchSettings.sortTypes = {
        multiSelection: false,
        values: [
            new labelValue('Chapters per Week', "frequency"),
            new labelValue('Date Added', "dateadded"),
            new labelValue('Favorites', "favorites"),
            new labelValue('Last Update', "lastchpdate"),
            new labelValue('Number of Ratings', "numofrate"),
            new labelValue('Pages', "pages"),
            new labelValue('Pageviews', "pageviews"),
            new labelValue('Ratings', "ratings"),
            new labelValue('Readers', "readers"),
            new labelValue('Total Words', "totalwords"),
        ],
    };

    returnObject.parserSearchSettings.genres = {
        multiSelection: true,
        values: [
            new labelValue("Action", 9),
            new labelValue("Comedy", 7),
            new labelValue("Fantasy", 19),
            new labelValue("Historical", 21),
            new labelValue("LitRPG", 1180),
            new labelValue("Mystery", 909),
            new labelValue("Sci-fi", 912),
            new labelValue("Adult", 902),
            new labelValue("Drama", 903),
            new labelValue("Gender Bender", 905),
            new labelValue("Horror", 22),
            new labelValue("Martial Arts", 907),
            new labelValue("Psychological", 910),
            new labelValue("Seinen", 913),
            new labelValue("Supernatural", 5),
            new labelValue("Adventure", 8),
            new labelValue("Ecchi", 904),
            new labelValue("Girls Love", 892),
            new labelValue("Isekai", 37),
            new labelValue("Mature", 20),
            new labelValue("Romance", 6),
            new labelValue("Slice of Life", 914),
            new labelValue("Tragedy", 901),
            new labelValue("Boys Love", 891),
            new labelValue("Fanfiction", 38),
            new labelValue("Harem", 1015),
            new labelValue("Josei", 906),
            new labelValue("Mecha", 908),
            new labelValue("School Life", 911),
            new labelValue("Smut", 915),

        ]
    }

    returnObject.parserSearchSettings.statuses = {
        multiSelection: false,
        values: [
            new labelValue("All", "all"),
            new labelValue("Completed", "completed"),
            new labelValue("Ongoing", "ongoing"),
            new labelValue("Hiatus", "hiatus")
        ]
    }

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("popular", "Popular", "Search", false, new Filter(undefined, "pageviews")),
            new Section("favorites", "Favorites", "Search", false, new Filter(undefined, "favorites")),
            new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "completed"))
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
        var filter = new Filter(undefined, "pageviews", undefined, "all");
        return filter;
    };

    returnObject.search = async (filter, page) => {
        var sortTypeUri = "https://www.scribblehub.com/series-finder/?sf=1&gi={g}&mgi=and&sort={sort}&order=desc&cp={status}&pg=" + page;
        var sortTypeUrl = sortTypeUri.replace("{g}", filter.genres.join(",")).replace("{sort}", filter.sortType).replace("{status}", filter.active);

        var url = filter.title && filter.title.length > 0 ? returnObject.searchUrl.replace("{q}", filter.title) : sortTypeUrl;

        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find(".search_main_box").forEach(x => {
            result.push(new LightItem(
                x.select("img").attr("src").url(),
                x.select(".search_title").text(false),
                "",
                x.select(".search_title a").attr("href").url(),
                returnObject.name));
        });
        return result;
    }


    returnObject.getChapters = async (id) => {
        console.log("strSID:" + id)
        var html = await HttpClient.postForm("https://www.scribblehub.com/wp-admin/admin-ajax.php", {
            action: "wi_gettocchp",
            strSID: parseInt(id),
            strmypostid: 0,
            strFic: "yes"
        });
        return returnObject.parser.jq(HttpClient.parseHtml(html)).find("a").map(x => new Chapter(x.text(false), x.attr("href").url()));
    }

    returnObject.getNovel = async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var id = container.select("#mypostid").nodeValue() ? container.select("#mypostid").nodeValue() : novelUrl.split("/")[novelUrl.split("/").indexOf("series") + 1];
        var chapters = await returnObject.getChapters(id || "");
        var reg = new RegExp(/"(ratingValue)":"((\\"|[^"])*)"/, "i")
        var res = reg.exec(container.innerHTML());
        var rate = eval((res && res.length > 0 ? (res.findAt(0) || "").split(":").last() || "" : "1"));
        var novelReviews = new NovelReviews();
        novelReviews.author = container.select("[property='author'] .auth_name_fic").text(false);
        novelReviews.genres = container.find(".wi_fic_genre a").textArray();
        novelReviews.uvotes = "Rating:" + parseInt(rate ? rate : "1").toFixed(0) + "/5";
        novelReviews.completed = container.select(".widget_fic_similar").text(false).indexOf("Completed") != -1 ? "Status:Completed" : "Status:Ongoing";
        return new DetaliItem(
            container.select(".novel-cover img").attr("src").url(),
            container.select('.fic_title').text(false),
            container.select('.wi_fic_desc').cleanInnerHTML(),
            novelUrl,
            chapters.reverse(),
            novelReviews,
            returnObject.name,
            undefined,
        );
    }

    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select(".chp_raw").cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace("{p}", page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.select("#main_releases td").forEach(x => {
            result.push(new LightItem(
                x.select("img").attr("src").url(),
                x.select(".fp_title").text(false),
                "",
                x.select(".fp_title").attr("href").url(),
                returnObject.name));
        });
        return result;
    }

    return returnObject;

};`