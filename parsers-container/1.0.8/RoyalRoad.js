(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.royalroad";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'RoyalRoad';
    returnObject.latestUrl = 'https://www.royalroad.com/fictions/latest-updates?page={p}';
    returnObject.url = 'https://www.royalroad.com';
    returnObject.searchUrl = 'https://www.royalroad.com/fictions/search?page={p}&title={q}';
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://www.royalroad.com/favicon-16x16.png?v=20200125';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.multiSelection = true;
    returnObject.parserSearchSettings.genres = {
        multiSelection: true,
        values: [
            new labelValue("Action", "action"),
            new labelValue("Adventure", "adventure"),
            new labelValue("Comedy", "comedy"),
            new labelValue("Contemporary", "contemporary"),
            new labelValue("Drama", "drama"),
            new labelValue("Psychological", "psychological"),
            new labelValue("Romance", "romance"),
            new labelValue("Satire", "satire"),
            new labelValue("Sci-Fi", "sci_fi"),
            new labelValue("Short Story", "one_shot"),
            new labelValue("Tragedy", "tragedy"),
            new labelValue("Fantasy", "fantasy"),
            new labelValue("Mystery", "mystery"),
            new labelValue("Historical", "historical"),
            new labelValue("Horror", "horror"),
            new labelValue("Magic", "magic"),
            new labelValue("Anti-Hero Lead", "anti-hero_lead"),
            new labelValue("Artificial Intelligence", "artificial_intelligence"),
            new labelValue("Attractive MC", "attractive_mc"),
            new labelValue("Cyberpunk", "cyberpunk"),
            new labelValue("Dungeon", "dungeon"),
            new labelValue("Dystopia", "dystopia"),
            new labelValue("Female Lead", "female_lead"),
            new labelValue("First Contact", "First_Contact"),
            new labelValue("GameLit", "GameLit"),
            new labelValue("Gender Bender", "gender_bender"),
            new labelValue("Genetically Engineered", "Genetically_Engineered"),
            new labelValue("Grimdark", "Grimdark"),
            new labelValue("Hard Sci-fi", "Hard_Sci_fi"),
            new labelValue("Harem", "harem"),
            new labelValue("High Fantasy", "high_fantasy"),
            new labelValue("LitRPG", "LitRPG"),
            new labelValue("Loop", "Loop"),
            new labelValue("Low Fantasy", "low_fantasy"),
            new labelValue("Male Lead", "male_lead"),
            new labelValue("Martial Arts", "martial_arts"),
            new labelValue("Multiple Lead Characters", "mutliple_lead"),
            new labelValue("Mythos", "mythos"),
            new labelValue("Non-Human lead", "non-human_lead"),
            new labelValue("Portal Fantasy / Isekai", "summoned_hero"),
            new labelValue("Post Apocalyptic", "post_apocalyptic"),
            new labelValue("Progression", "progression"),
            new labelValue("Reader interactive", "reader_interactive"),
            new labelValue("Reincarnation", "reincarnation"),
            new labelValue("Ruling Class", "ruling_class"),
            new labelValue("School Life", "school_life"),
            new labelValue("Secret Identity", "secret_identity"),
            new labelValue("Slice of Life", "slice_of_life"),
            new labelValue("Soft Sci-fi", "Soft_Sci_fi"),
            new labelValue("Space Opera", "space_opera"),
            new labelValue("Sports", "sports"),
            new labelValue("Steampunk", "steampunk"),
            new labelValue("Strategy", "strategy"),
            new labelValue("Strong Lead", "strong_lead"),
            new labelValue("Super Heroes", "super_heroes"),
            new labelValue("Supernatural", "supernatural"),
            new labelValue("Technologically Engineered", "Technologically_Engineered"),
            new labelValue("Time Travel", "Time_Travel"),
            new labelValue("Urban Fantasy", "urban_fantasy"),
            new labelValue("Villainous Lead", "villainous_lead"),
            new labelValue("Virtual Reality", "virtual_reality"),
            new labelValue("War and Military", "war_and_military"),
            new labelValue("Wuxia", "wuxia"),
            new labelValue("Xianxia", "xianxia")
        ]
    }

    returnObject.parserSearchSettings.statuses = {
        multiSelection: true,
        values: [
            new labelValue("Completed", "COMPLETED"),
            new labelValue("Ongoing", "ONGOING"),
            new labelValue("Hiatus", "HIATUS"),

        ]
    }

    returnObject.parserSearchSettings.languages = {
        multiSelection: false,
        values: [
            new labelValue("Fan Fiction", "fanfiction"),
            new labelValue("Original", "original")
        ]
    }


    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("completed", "Completed", "Search", false, new Filter(undefined, undefined, undefined, "COMPLETED")),
            new Section("ongoing", "Ongoing", "Search", false, new Filter(undefined, undefined, undefined, "ONGOING")),
            new Section("romance", "Romance", "Search", false, new Filter(["romance"])),
            new Section("action", "Action", "Search", false, new Filter(["action"])),
            new Section("mystery", "Mystery", "Search", false, new Filter(["mystery"])),
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
        var url = returnObject.searchUrl.replace("{p}", page.toString()).replace("{q}", filter.title || "");
        if (filter.genres.length > 0)
            url += "&" + filter.genres.map(x => "tagsAdd=" + x).join("&")

        if (filter.active && filter.active != "")
            url += "&status=" + filter.active;

        if (filter.language && filter.language != "")
            url += "&type=" + filter.language;

        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find(".fiction-list-item").forEach(x => {
            result.push(new LightItem(x.select("img").attr("src").url(),
                x.select(".fiction-title").text(),
                "",
                x.select(".fiction-title a").attr("href").url(),
                returnObject.name));
        });

        return result;

    }

    returnObject.getNovel= async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapters = container.find("#chapters tbody tr").map(x => x.select("a")).filter(x => x.hasElement()).map(x => new Chapter(x.text(), x.attr("href").url()));
        var novelReviews = new NovelReviews();
        var infos = container.select(".fiction-info .col-md-8");

        novelReviews.genres = infos.find(".tags a").textArray();
        novelReviews.author = container.select(".fic-title span[property=name]").text();
        novelReviews.description = container.select(".description").cleanInnerHTML();
        novelReviews.completed = container.select(".tags").closest("div").find("span").where(x=> x.innerHTML().indexOf("COMPLETED") != -1).hasElements() ? "Status:Completed" : "Status:Ongoing"
        return new DetaliItem(
            container.select(".text-center img").attr("src").url(),
            container.select(".fic-title h1").text(false),
            novelReviews.description,
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        );
    }

    returnObject.getChapter = async (url)=> {
        return returnObject.parser.jq(await new client().getHtml(url)).select(".chapter-content").cleanInnerHTML();

    }

    returnObject.latest= async (page) => {
        var url = returnObject.latestUrl.replace("{p}", page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.select(".fiction-list-item").forEach(x => {
            result.push(new LightItem(
                x.select("img").attr("src").url(),
                x.select(".fiction-title").text(false),
                "",
                x.select(".fiction-title a").attr("href").url(),
                returnObject.name));
        });

        return result;
    }

    return returnObject;

};