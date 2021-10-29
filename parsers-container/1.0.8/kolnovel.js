export default `(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client) => {
    const returnObject= {};
    returnObject.id = "1.kolnovel";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "ar";
    returnObject.name = 'KolNovel';
    returnObject.latestUrl = 'http://kolnovel.com/series?page={p}&status=&type=&order=update';
    returnObject.url = "https://kolnovel.com";
    returnObject.searchUrl = "https://kolnovel.com/series?page={p}&order=";
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://kolnovel.com/wp-content/uploads/2019/06/cropped-أيقون-1-1-150x150.png';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.genres = {
        multiSelection: true,
        values: [
            new labelValue("Wuxia", 'wuxia'),
            new labelValue("Xianxia", "xianxia"),
            new labelValue("XUANHUAN", "xuanhuan"),
            new labelValue("أصلية", "original"),
            new labelValue("أكشن", "action"),
            new labelValue("إثارة", "excitement"),
            new labelValue("إنتقال الى عالم أخر", "isekai"),
            new labelValue("إيتشي", "etchi"),
            new labelValue("الخيال العلمي", "sci-fi"),
            new labelValue("بوليسي", "policy"),
            new labelValue("تاريخي", "historical"),
            new labelValue("تقمص شخصيات", "rpg"),
            new labelValue("جريمة", "crime"),
            new labelValue("جوسى", "josei"),
            new labelValue("حريم", "harem"),
            new labelValue("حياة مدرسية", "school-life"),
            new labelValue("خارقة للطبيعة", "supernatural"),
            new labelValue("خيالي", "fantasy"),
            new labelValue("دراما", "drama"),
            new labelValue("رعب", "horror"),
            new labelValue("رومانسي", "romantic"),
            new labelValue("سحر", "magic"),
            new labelValue("سينن", "senen"),
            new labelValue("شريحة من الحياة", "slice-of-life"),
            new labelValue("شونين", "shonen"),
            new labelValue("صيني", "chinese"),
            new labelValue("غموض", "mysteries"),
            new labelValue("فنون القتال", "martial-arts"),
            new labelValue("قوى خارقة", "superpower"),
            new labelValue("كوري", "korean"),
            new labelValue("كوميدى", "comedy"),
            new labelValue("مأساوي", "tragedy"),
            new labelValue("ما بعد الكارثة", "after-the-disaster"),
            new labelValue("مغامرة", "adventure"),
            new labelValue("ميكا", "mechanical"),
            new labelValue("ناضج", "mature"),
            new labelValue("نفسي", "psychological"),
            new labelValue("ياباني", "japanese"),


        ],
    };

    returnObject.parserSearchSettings.statuses = {
        multiSelection: true,
        values: [
            new labelValue('OnGoing', 'ongoing'),
            new labelValue('Hiatus', 'hiatus'),
            new labelValue('Completed', 'completed'),
        ],
    };

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, undefined, undefined, "completed"))
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
        if (filter.title && !filter.title.isEmptyOrSpaces())
            url += "&s=" + filter.title;
        if (filter.genres.length > 0)
            url += "&" + filter.genres.map(x => "genre[]=" + x).join("&");
        if (filter.active && filter.active.length > 0)
            url += "&status=" + filter.active;
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find('.listupd a').forEach((x) => {
            if (x.select('img').attr("src").hasValue())
                result.push(
                    new LightItem(x.select('img').attr("src").url(),
                        x.select('.ntitle').text(false),
                        '',
                        x.attr("href").url(), returnObject.name
                    ),
                );
        });

        return result;
    }

    returnObject.getNovel = async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapters = container.find(".eplister li a").map(x => new Chapter(x.select(".epl-num").text(false) + " " + x.select(".epl-title").text(false), x.attr("href").url()))
        var novelReviews = new NovelReviews();
        var infos = container.find(".ninfo");
        novelReviews.genres = container.find(".genxed a").map(x => x.text(false));
        novelReviews.author = infos.eq(0).find(".info-content .spe span").eq(2).find("a").textArray().join(",");
        novelReviews.uvotes = container.select(".rating strong").text().number() + " / 10";
        novelReviews.completed = container.find(".info-content .spe span").eq(0).remove("b").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";

        return new DetaliItem(
            container.select('.thumb img').attr("src").url(),
            container.select('.entry-title').text(false),
            container.select('.entry-content').cleanInnerHTML(),
            novelUrl,
            chapters.reverse(),
            novelReviews,
            returnObject.name,
            undefined,
        );
    }


    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select('.entry-content').cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace('{p}', page.toString());
        var html =await HttpClient.getHtml(url);
        console.log(html)
        var container = returnObject.parser.jq(html);
        var result = [];
        container.find('.listupd a').forEach((x) => {
            if (x.select('img').attr("src").hasValue())
                result.push(
                    new LightItem(x.select('img').attr("src").url(),
                        x.select('.ntitle').text(false),
                        '',
                        x.attr("href").url(), returnObject.name
                    ),
                );
        });

        return result;
    }

    return returnObject;
};`