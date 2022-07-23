export default (Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler, parseHtml, plugins) => {

    function Parser() {
        this.id = "1.xxx";
        this.detaliItemType = DetaliItemType.Novel;
        this.parserLanguage = "en";
        this.name = 'parser.2';
        this.displayName = "parser 2";
        this.latestUrl = 'https://xxx.com/?pg={p}';
        this.url = 'https://xxx.com';
        this.searchUrl = 'https://xxx.com/?s={q}&post_type=fictionposts';
        this.panination = true;
        this.searchPagination = false;
        this.icon = 'https://xxx.com/favicon.ico';
        this.parserSearchSettings = new ParserSearchSettings();
        this.parserSearchSettings.multiSelection = true;
        this.enableNovelDownloads= true;
        this.parserSearchSettings.sortTypes = {
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

        this.parserSearchSettings.genres = {
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

        this.parserSearchSettings.statuses = {
            multiSelection: false,
            values: [
                new labelValue("All", "all"),
                new labelValue("Completed", "completed"),
                new labelValue("Ongoing", "ongoing"),
                new labelValue("Hiatus", "hiatus")
            ]
        }
    }

    Parser.prototype = {
		// is the section included in home, eg when you open the app.
		// this method is mendetory
        getSections: function (keys) {
            var sections = [
                new Section("latest", "Latest Update", "Latest", true),
                new Section("popular", "Popular", "Search", false, new Filter(undefined, "pageviews")),
                new Section("favorites", "Favorites", "Search", false, new Filter(undefined, "favorites")),
                new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "completed"))
            ]

            return sections.filter(x => !keys || keys.includes(x.name));
        },
		// this method is mendetory
        translateSection: async function (section, page) {
            if (section.identifier == "Latest")
                return await this.latest(page);
            else
                return await this.search(section.filter || this.defaultFilter(), page);
        },
		// this method is mendetory
        defaultFilter: function () {
            var filter = new Filter(undefined, "pageviews", undefined, "all");
            return filter;
        },
		// this method is mendetory
        search: async function (filter, page) {
            var sortTypeUri = "https://xxx/series-finder/?sf=1&gi={g}&mgi=and&sort={sort}&order=desc&cp={status}&pg=" + page;
            var sortTypeUrl = sortTypeUri.replace("{g}", filter.genres.join(",")).replace("{sort}", filter.sortType).replace("{status}", filter.active);

            var url = filter.title && filter.title.length > 0 ? this.searchUrl.replace("{q}", filter.title) : sortTypeUrl;

            var container = this.parser.jq(await this.cleaner.getClient(this.id).getHtml(url));
            var result = [];
            container.find(".search_main_box").forEach(x => {
                result.push(new LightItem(
                    x.select("img").attr("src").url(),
                    x.select(".search_title").text(false),
                    "",
                    x.select(".search_title a").attr("href").url(),
                    this.name));
            });
            return result;
        },
		// this method is only used in this class in getNovel so this is optional
        getChapters: async function (id) {
            console.log("strSID:" + id)
            var html = await HttpClient.postForm("https://xxx/wp-admin/admin-ajax.php", {
                action: "wi_gettocchp",
                strSID: parseInt(id),
                strmypostid: 0,
                strFic: "yes"
            });
            return this.parser.jq(parseHtml(html)).find("a").map(x => new Chapter(x.text(false), x.attr("href").url()));
        },
		// this method is mendetory
        getNovel: async function (novelUrl) {
            var container = this.parser.jq(await HttpClient.getHtml(novelUrl));
            var id = container.select("#mypostid").nodeValue() ? container.select("#mypostid").nodeValue() : novelUrl.split("/")[novelUrl.split("/").indexOf("series") + 1];
            var chapters = await this.getChapters(id || "");
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
                this.name,
                undefined,
            );
        },
		// this method is mendetory
        getChapter: async function (url) {
            return this.cleaner.cleanChapter(this.parser.jq(await HttpClient.getHtml(url)).select(".chp_raw"), this.name);
        },
		// this method is mendetory
        latest: async function (page) {
            var url = this.latestUrl.replace("{p}", page.toString());
            var container = this.parser.jq(await HttpClient.getHtml(url));
            var result = [];
            container.select("#main_releases td").forEach(x => {
                result.push(new LightItem(
                    x.select("img").attr("src").url(),
                    x.select(".fp_title").text(false),
                    "",
                    x.select(".fp_title").attr("href").url(),
                    this.name));
            });
            return result;
        }

    }
    return new Parser();

}