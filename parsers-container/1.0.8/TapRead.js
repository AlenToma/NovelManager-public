(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.tapread";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'TapRead';
    returnObject.latestUrl = 'https://www.tapread.com/ajax/book/lastupdatelist';
    returnObject.url = 'https://www.tapread.com/';
    returnObject.searchUrl = 'https://www.tapread.com/ajax/search/story';
    returnObject.panination = true;
    returnObject.searchPagination = false;
    returnObject.icon = 'https://static.tapread.com/pc/images/favicon.ico';
    returnObject.parserSearchSettings = new ParserSearchSettings();

    returnObject.parserSearchSettings.genres = {
        multiSelection: false,
        values: [
            new labelValue("All", 0),
            new labelValue("Wuxia&Xianxia", 1),
            new labelValue("Fantasy", 2),
            new labelValue("Romance", 3),
            new labelValue("LGBT+", 43),
            new labelValue("Urban", 44),
            new labelValue("Games", 45),
            new labelValue("Eastern", 46),
            new labelValue("Horror&Thriller", 47),
            new labelValue("Historical", 75),
            new labelValue("Sci-Fi", 76),

        ]
    }

    returnObject.getSections = (keys) => {
        var sections = [
            new Section("latest", "Latest Update", "Latest", true),
            new Section("horror", "Horror&Thriller", "Search", false, new Filter([47])),
            new Section("romance", "Romance", "Search", false, new Filter([3])),
            new Section("fantasy", "Fantasy", "Search", false, new Filter([2])),
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

    returnObject.getGenre = async (filter, page) => {
        var url = "https://www.tapread.com/ajax/category/detail";
        var result = [];
        var data = await HttpClient.postForm(url, { cateId: filter.genres[0], pageNo: page });
        if (data && data.result && data.result.bookList) {
            data.result.bookList.forEach((item) => {
                result.push(new LightItem(async () => {
                    return (await returnObject.getNovel(item.bookId, true)).image
                }, item.bookName, item.description, item.bookId, returnObject.name))
            });
        }

        return result;

    }

    returnObject.search = async (filter, page) => {
        if (filter.genres.length > 0)
            return await returnObject.getGenre(filter, page);

        var result = [];
        var data = await HttpClient.postForm(returnObject.searchUrl, { searchText: filter.title || "", storyType: 1, pageNo: page });
        if (data && data.result && data.result.storyList) {
            data.result.storyList.forEach((item) => {
                result.push(new LightItem(async () => {
                    return (await returnObject.getNovel(item.storyId, true)).image
                }, item.storyName, "", item.storyId, returnObject.name))
            });
        }

        return result;
    }

    returnObject.getChapters = async (bookId) => {
        var data = await HttpClient.postForm("https://www.tapread.com/ajax/book/contents", { bookId: bookId });
        var result = [];
        if (data && data.result && data.result.chapterList)
            data.result.chapterList.forEach(item => {
                result.push(new Chapter(item.chapterName, (item.bookId + "/" + item.chapterId).uri("https://www.tapread.com/ajax/book/chapter")))
            });

        return result;

    }

    returnObject.getNovel = async (novelUrl, ignorechapters) => {
        novelUrl = parseInt(novelUrl).toString();
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl.toString().uri("https://www.tapread.com/book/detail/"), ignorechapters));
        var chapters = !ignorechapters ? await returnObject.getChapters(novelUrl) : [];
        var novelReviews = new NovelReviews();
        novelReviews.genres = container.find(".base-info .book-catalog .txt").textArray();
        novelReviews.author = container.select(".author .name").text(false);
        novelReviews.uvotes = container.select(".score").text() + " / 5";
        novelReviews.completed = container.select(".base-info .book-state .txt").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";
        return new DetaliItem(
            container.select('.book-img img').attr("src").url(),
            container.select('.book-name').text(false),
            container.select('.desc').cleanInnerHTML(),
            novelUrl,
            chapters,
            novelReviews,
            returnObject.name,
            undefined,
        );
    }

    returnObject.getChapter = async (url) => {
        var urlContent = url.split("/");
        var bookId = urlContent[urlContent.length - 2];
        var chapterId = urlContent[urlContent.length - 1];
        console.log("bookId:" + bookId)
        console.log("chapterId:" + chapterId)
        var data = await new client().postForm("https://www.tapread.com/ajax/book/chapter", { bookId: bookId, chapterId: chapterId })
        if (data && data.result)
            return data.result.content;
        return "Something went wrong";

    }

    returnObject.latest = async (page) => {
        var url = returnObject.latestUrl;
        var data = await HttpClient.postForm(url, { amoumt: 0, pageNo: page });
        var result = [];
        if (data && data.result && data.result) {
            data.result.forEach(item => {
                result.push(new LightItem(async () => {
                    return (await returnObject.getNovel(item.bookId, true)).image
                }, item.title, "", item.bookId, returnObject.name))
            });
        }

        return result;
    }

    return returnObject;
};