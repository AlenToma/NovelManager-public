(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.wuxiaworld_site";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'Wuxiaworld.Site';
    returnObject.latestUrl = 'https://wuxiaworld.site/page/{p}/';
    returnObject.url = 'https://wuxiaworld.site';
    returnObject.searchUrl = 'https://wuxiaworld.site/wp-admin/admin-ajax.php';
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://wuxiaworld.b-cdn.net/wp-content/uploads/2019/04/favicon-1.ico';

    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.multiSelection = true;
    returnObject.parserSearchSettings.genres =
    {
        multiSelection: true,
        values: [
            new labelValue('Action', "action"),
            new labelValue('Adult', "adult"),
            new labelValue("Drama", "drama"),
            new labelValue("Ecchi", "ecchi"),
            new labelValue('Adventure', "adventure"),
            new labelValue("Gender Bender", "gender-bender"),
            new labelValue("Historical", "historical"),
            new labelValue("Horror", "horror"),
            new labelValue("Isekai", "isekai"),
            new labelValue("Josei", "josei"),
            new labelValue("LGBT+", "lgbt"),
            new labelValue("Magical Realism", "magical-realism"),
            new labelValue("Manhwa", "manhwa"),
            new labelValue("Martial Arts", "martial-arts"),
            new labelValue("Mature", "mature"),
            new labelValue("Mecha", "mecha"),
            new labelValue("Psychological", "psychological"),
            new labelValue("Reincarnation", "reincarnation"),
            new labelValue("School Life", "school-life"),
            new labelValue("Seinen", "seinen"),
            new labelValue("Shoujo", "shoujo"),
            new labelValue("Shoujo-Ai", "shoujo-ai"),
            new labelValue("Shounen", "shounen"),
            new labelValue("Shounen-Ai", "shounen-ai"),
            new labelValue("Slice of Life", "slice-of-life"),
            new labelValue("Smut", "smut"),
            new labelValue("Supernatural", "supernatural"),
            new labelValue("Thriller", "thriller"),
            new labelValue("Teen", "teen"),
            new labelValue("Video Games", "video-games"),
            new labelValue("Webcomics", "webcomics"),
            new labelValue('Comedy', "comedy"),
            new labelValue('Fantasy', "fantasy"),
            new labelValue('Harem', "harem-novel"),
            new labelValue('Yaoi', "yaoi"),
            new labelValue("Yuri", "yuri"),
            new labelValue('Kingdom Building'),
            new labelValue('Modern Setting'),
            new labelValue('Mystery', "mystery"),
            new labelValue('Romance', "romance"),
            new labelValue('Sci-fi', "sci-fi"),
            new labelValue('Tragedy', "tragedy"),
            new labelValue('Virtual Reality'),
            new labelValue('Xianxia', "xianxia"),
            new labelValue('Wuxia', "wuxia"),
            new labelValue('Xuanhuan', "xuanhuan"),
            new labelValue('Sports', "sports"),
        ],
    };

    returnObject.parserSearchSettings.statuses =
    {
        multiSelection: false,
        values: [
            new labelValue('Ongoing', "on-going"),
            new labelValue('Completed', "end"),
        ],
    };


    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("manga", "Comics", "Search", false, new Filter(["webcomics"])),
            new Section("action", "Action Novel", "Search", false, new Filter(["action"])),
            new Section("adult", "Adult Novel", "Search", false, new Filter(["adult"])),
            new Section("romance", "Romance Novel", "Search", false, new Filter(["romance"])),
            new Section("drama", "Drama Novel", "Search", false, new Filter(["drama"])),
            new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, undefined, undefined, "end"))
        ]

        return sections.filter(x => !keys || keys.includes(x.name));
    }

    returnObject.translateSection = async (section, page) => {
        try {
            if (section.identifier == "Latest")
                return await returnObject.latest(page);
            else
                return await returnObject.search(section.filter || returnObject.defaultFilter(), page);
        } catch (error) {
            console.log(error)
            return [];
        }
    }

    returnObject.defaultFilter = () => {
        return new Filter();
    }

    returnObject.getType = (url) => {
        var url = url.toLowerCase();
        if (url.indexOf("manga") != -1 || url.indexOf("comic") != -1 || url.indexOf("comics") != -1 || url.indexOf("webcomics") != -1)
            return DetaliItemType.Managa;
        return DetaliItemType.Novel;
    }

    returnObject.getByGenres = async (filter, page) => {
        var result = [];
        var advancedSeachUrl = "https://wuxiaworld.site/page/"+page+"/?s=&post_type=wp-manga&{g}&op&author&artist&release&adult&{s}"
        if (filter.genres.length > 0)
            advancedSeachUrl = advancedSeachUrl.replace("{g}", filter.genres.map(x => "genre%5B%5D=" +x).join("&"))
        else advancedSeachUrl = advancedSeachUrl.replace("&{g}", "")

        if (filter.active && filter.active != "")
            advancedSeachUrl = advancedSeachUrl.replace("{s}", filter.active);
        else advancedSeachUrl = advancedSeachUrl.replace("&{s}", "");
        var container = returnObject.parser.jq(await HttpClient.getHtml(advancedSeachUrl));
        container.find(".c-tabs-item__content").forEach(x => {
            result.push(
                new LightItem(
                    x.select(".tab-thumb img").attr("src | srcset").url(),
                    x.select(".tab-thumb a").attr("title").text(),
                    "",
                    x.select(".tab-thumb a").attr("href").url(),
                    returnObject.name,
                    returnObject.getType(x.select(".tab-thumb a").attr("href").url())
                )
            )
        })
        return result;
    }


    returnObject.search = async (filter, page) => {
        if (!filter.title)
        filter.title ="";
        if ((filter.title.isEmptyOrSpaces()) && (filter.genres.length > 0 || (!filter.active && filter.active != "")))
            return await returnObject.getByGenres(filter, page);

        if (filter.title.isEmptyOrSpaces())
            return [];


        var json = await HttpClient.postForm(returnObject.searchUrl, { action: "wp-manga-search-manga", title: filter.title });

        if (json && json.data && json.data.length > 0) {
            return json.data.map(x => {
                return new LightItem(
                    async () => (await returnObject.getNovel(x.url.uri(returnObject.url), true)).image,
                    x.title,
                    "",
                    x.url.uri(returnObject.url),
                    returnObject.name,
                    returnObject.getType(x.type || x.url)
                )
            })
        }
        return [];

    }

    returnObject.getChapters = async (container) => {
        var url = "https://wuxiaworld.site/wp-admin/admin-ajax.php";
        var chapters = container.select(".listing-chapters_wrap").hasElement() && container.find(".listing-chapters_wrap a").length() > 1 ? container.find(".listing-chapters_wrap a") : returnObject.parser.jq(await HttpClient.postForm(url, { action: "manga_get_chapters", manga: container.select(".rating-post-id").attr("value").text() })).find("a");
        return chapters.map((x) => {
            return new Chapter(
                x.text(false),
                x.attr("href").url()
            );
        });
    }

    returnObject.getNovel = async (novelUrl, ignoreChapters) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl, ignoreChapters));
        var chapters = [];
        if (!ignoreChapters) {
            chapters = await returnObject.getChapters(container);
        }

        var novelReviews = new NovelReviews();
        if (!ignoreChapters) {
            novelReviews.uvotes = container.select(".vote-details").remove('[property="itemReviewed"]').text(false);
            novelReviews.author = container.find(".author-content a").text(false);
            novelReviews.genres = container.find(".genres-content a").textArray();
            novelReviews.completed = container.find(".post-content_item").where(x => x.innerHTML().indexOf("Completed") != -1).hasElement() ? "Status:Completed" : "Status:Ongoing";
            novelReviews.description = container.select(".description-summary").cleanInnerHTML();
        }

        return new DetaliItem(
            container.select('.summary_image img').attr("src | srcset").url(),
            container.select('.post-title').text(false),
            novelReviews.description || "",
            novelUrl,
            chapters.reverse(),
            novelReviews,
            returnObject.name,
            "",
            returnObject.getType(novelUrl)
        );
    }

    returnObject.getChapter = async (url) => {
        var container = returnObject.parser.jq(await new client().getHtml(url)).remove("script").remove("style");
        var result = "";
        if (returnObject.getType(url) === DetaliItemType.Managa)
            result = container.find(".reading-content img").map(x => x.attr("src").hasValue() ? x.attr("src").url() : "").filter(x => !x.isEmptyOrSpaces());
        else
            result = container.select(".reading-content").cleanInnerHTML();
        return result;
    }

    returnObject.latest = async (page) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(returnObject.latestUrl.replace("{p}", page.toString())));

        return container.find(".page-item-detail").map(x => {
            return new LightItem(
                x.select("img").attr("src | srcset").url(),
                x.select(".post-title a").text(),
                "",
                x.select(".post-title a").attr("href").url(),
                returnObject.name,
                returnObject.getType(x.select(".post-title a").attr("href").url())
            )
        })
    }


    return returnObject;
};