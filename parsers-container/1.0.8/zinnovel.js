(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.zinnovel";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'ZinNovel';
    returnObject.latestUrl = 'https://zinnovel.com/page/{p}/';
    returnObject.url = 'https://zinnovel.com/';
    returnObject.searchUrl = '';
    returnObject.panination = true;
    returnObject.searchPagination = false;
    returnObject.icon = 'https://zinnovel.com/wp-content/uploads/2020/07/cropped-Untitled-2-32x32.jpg';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.genres = {
        multiSelection: true,
        values: [],
    };


    returnObject.parserSearchSettings.sortTypes = {
        multiSelection: true,
        values: [
            new labelValue('Ongoing', 'on-going'),
            new labelValue('Completed Novel', 'end'),
        ],
    };


    returnObject.loadSettings = async () => {
        try {
            if (returnObject.parserSearchSettings.genres.values.length <= 0) {
                var container = returnObject.parser.jq(await HttpClient.getHtml("https://zinnovel.com/?s=&post_type=wp-manga"))
                container.find("#search-advanced .checkbox-group .checkbox").forEach(a => {
                    returnObject.parserSearchSettings.genres.values.push(new labelValue(a.find("label").text(), a.find("input").attr("value").text()));
                });
            }
        } catch (e) {
            console.log();
        }
    }

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("action", "Action Novel", "Search", false, new Filter(["action"])),
            new Section("romance", "Romance Novel", "Search", false, new Filter(["romance"])),
            new Section("ongoing", "Ongoing Novel", "Search", false, new Filter(undefined, "end")),
            new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, "end"))

        ]

        return sections.filter(x => !keys || keys.includes(x.name));
    }

    translateSection = async (section, page) => {
        if (section.identifier == "Latest")
            return await returnObject.latest(page);
        else
            return await returnObject.search(section.filter || returnObject.defaultFilter(), page);
    }

    returnObject.defaultFilter = () => {
        var filter = new Filter();
        return filter;
    }
    //https://zinnovel.com/?s={s}&post_type=wp-manga&genre%5B%5D=action&genre%5B%5D=adventure&op=&author=&artist=&release=&adult=&status%5B%5D=end&status%5B%5D=on-going
    returnObject.search = async (filter, page) => {
        var url = "https://zinnovel.com/?s=" +(filter.title || "")+"&post_type=wp-manga&{genre}&op=&author=&artist=&release=&adult=&{status}"
        if (filter.genres.length > 0) {
            url = url.replace("{genre}", filter.genres.map(x => "genre%5B%5D="+x).join("&"));
        } else url = url.replace("&{genre}", "");

        if (filter.sortType && filter.sortType.length > 1)
            url = url.replace("{status}", "status%5B%5D=" +filter.sortType);
        else url = url.replace("&{status}", "");

        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = []
        container.find('.c-tabs-item .row').forEach((x) => {
            result.push(
                new LightItem(x.find("img").attr("data-src").url(),
                    x.select('.post-title a').text(false),
                    '',
                    x.select('.post-title a').attr("href").url(), returnObject.name
                ),
            );
        });

        return result;
    }



    returnObject.getNovel = async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapters = container.find(".listing-chapters_wrap li a").map(x => new Chapter(x.text(false), x.attr("href").url())).reverse()
        var novelReviews = new NovelReviews();

        novelReviews.genres = container.find(".genres-content a").map(x => x.text(false));
        novelReviews.author = container.find(".author-content a").map(x => x.text(false)).join(", ");
        novelReviews.uvotes = container.select(".post-rating .total_votes").text(false) + " / 5";
        novelReviews.completed = container.select(".post-status .post-content_item .summary-content").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";

        return new DetaliItem(
            container.select('.summary_image img').attr("data-src").url(),
            container.select('.post-title').text(false),
            container.select('.description-summary').cleanInnerHTML(),
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        );
    }


    returnObject.getChapter = async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select('.reading-content').cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace('{p}', page.toString());
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        var result = [];
        container.find('.page-content-listing .page-item-detail').forEach((x) => {
            if (x.select('img').attr("src").hasValue())
                result.push(
                    new LightItem(x.find("img").attr("data-src").url(),
                        x.select('.post-title a').text(false),
                        '',
                        x.select('.post-title a').attr("href").url(), returnObject.name
                    ));
        });

        return result;
    }

    return returnObject;
};