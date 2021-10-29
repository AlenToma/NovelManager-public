(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client) => {
    const returnObject = {};
    returnObject.id = "1.mtlnovel";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'MtlNovel';
    returnObject.latestUrl = 'https://www.mtlnovel.com/wp-admin/admin-ajax.php?action=rcnt_update&view_all=yes&moreItemsPageIndex={p}&__amp_source_origin=https%3A%2F%2Fwww.mtlnovel.com';
    returnObject.url = 'https://www.mtlnovel.com';
    returnObject.searchUrl = 'https://www.mtlnovel.com/wp-admin/admin-ajax.php?action=autosuggest&q={q}&moreItemsPageIndex={p}&__amp_source_origin=https%3A%2F%2Fwww.mtlnovel.com';
    returnObject.panination = true;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://www.mtlnovel.net/themes/mtlnovel/images/mtlnovel-32.ico';
    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.multiSelection = false;
    returnObject.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue('Action'),
            new labelValue('Adult'),
            new labelValue('Comedy'),
            new labelValue('Adventure'),
            new labelValue('Drama'),
            new labelValue('Ecchi'),
            new labelValue('Erciyuan'),
            new labelValue('Fan-Fiction'),
            new labelValue('Fantasy'),
            new labelValue('Game'),
            new labelValue('Gender Bender', "gender-bender"),
            new labelValue('Harem'),
            new labelValue('Historical'),
            new labelValue('Horror'),
            new labelValue('Josei'),
            new labelValue('Martial Arts', "martial-arts"),
            new labelValue('Mature'),
            new labelValue('Mecha'),
            new labelValue('Military'),
            new labelValue('Mystery'),
            new labelValue('Psychological'),
            new labelValue('Romance'),
            new labelValue('School Life', 'school-life'),
            new labelValue('Sci-fi'),
            new labelValue('Seinen'),
            new labelValue('Shoujo'),
            new labelValue('Shoujo Ai', "shoujo-ai"),
            new labelValue('Shounen'),
            new labelValue('Shounen Ai', "shounen-ai"),
            new labelValue('Slice of Life', "slice-of-life"),
            new labelValue('Smut'),
            new labelValue('Sports'),
            new labelValue('Supernatural'),
            new labelValue('Tragedy'),
            new labelValue('Two-dimensional', "two-dimensional-novel"),
            new labelValue('Urban Life', "urban-fiction"),
            new labelValue('Wuxia'),
            new labelValue('Xianxia'),
            new labelValue('Xuanhuan'),
            new labelValue('Yaoi'),
            new labelValue('Yuri'),

        ],
    };

    returnObject.parserSearchSettings.statuses = {
        multiSelection: false,
        values: [
            new labelValue('Completed'),
            new labelValue('Dropped'),
            new labelValue('Hiatus'),
            new labelValue('Incomplete'),
            new labelValue('Ongoing'),
        ],
    };

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, undefined, undefined, "completed")),
            new Section("ongoing", "Ongoing Novel", "Search", false, new Filter(undefined, undefined, undefined, "ongoing")),
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

    returnObject.getByGenres = async (filter, page) => {
        var result = [];
        try {
            var genreUrl = "genre/{g}/page/{p}/".uri(returnObject.url).replace("{p}", page.toString());
            var statusUrl = "status/{s}/page/{p}/".uri(returnObject.url).replace("{p}", page.toString());
            var q =
                filter.genres.length > 0 ?
                genreUrl.replace("{g}", filter.genres[0].toLowerCase()) :
                filter.active && filter.active != '' ?
                statusUrl.replace("{s}", filter.active.toLowerCase()) :
                undefined;
            var container = returnObject.parser.jq(await HttpClient.getHtml(q || ""));
            var data = container.find('.box');
            var result = [];
            data.forEach((x) => {
                var href = x.select(".list-a").attr("href").text()
                var title = container.find(".list-title").where(x => x.attr("href").text() == href).text();
                result.push(
                    new LightItem(x.select('.list-img').attr('src').url(), title,
                        '',
                        href.uri(returnObject.url), returnObject.name
                    ),
                );
            });


        } catch (e) {
            console.log(e);
        }
        return result;
    }

    returnObject.search = async (filter, page) => {

        if (filter.genres.length > 0 || (filter.active && filter.active != ""))
            return await returnObject.getByGenres(filter, page);

        if (!filter.title || filter.title.length <= 0)
            return [];
        var jsonData = await HttpClient.GetJson(returnObject.searchUrl.replace("{q}", filter.title || "").replace("{p}", page.toString()));
        var result = [];
        if (jsonData.items && jsonData.items.length > 0)
            jsonData.items.forEach(x => {
                if (x.results && x.results.length > 0) {
                    x.results.forEach(item => {
                        result.push(
                            new LightItem(item.thumbnail, item.title.htmlText(false), "", item.permalink.uri(returnObject.url) || "", returnObject.name)
                        )
                    })
                }
            })
        return result;
    }

    returnObject.getChapters = async (novelUrl) => {
        var url = "chapter-list/".uri(novelUrl);
        var container = returnObject.parser.jq(await HttpClient.getHtml(url));
        return container.find(".ch-list a").map(x => new Chapter(x.text(false), x.attr("href").url())).reverse();
    }

    returnObject.getNovel = async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapters = await returnObject.getChapters(novelUrl);
        var novelReviews = new NovelReviews();
        novelReviews.genres = container.find("#currentgen a").textArray();
        novelReviews.uvotes = container.select(".rating-info strong").text(false) + " / 5";
        novelReviews.completed = container.select("#currentstatus").text(false) === "Completed" ? "Status:Completed" : "Status:" + container.select("#currentstatus").text(false);
        var tr = container.select("#panelnovelinfo .info").find("tr");
        if (tr !== null && tr && tr.length() > 0)
            novelReviews.author = tr.eq(tr.length() - 1).select("a").textArray().join(",");
        return new DetaliItem(
            container.select('.main-tmb').attr('src').url(),
            container.select('.entry-title').text(false),
            container.select('.desc').cleanInnerHTML(),
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        );
    }

    returnObject.getChapter = async (url) => {
        var container = returnObject.parser.jq(await new client().getHtml(url));
        return container.select('.post-content .par').cleanInnerHTML();
    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl.replace('{p}', page.toString());
        var jsonData = await HttpClient.GetJson(url);
        var result = [];
        if (jsonData.items && jsonData.items.length > 0)
            jsonData.items.forEach(x => {
                var lnk = (x.novel_permalink || "").toHtml().querySelector("a");
                result.push(
                    new LightItem(x.tmb, (lnk.innerText || ""), "", lnk.getAttribute("href").uri(returnObject.url), returnObject.name)
                )
            })
        return result;
    }

    return returnObject;

};