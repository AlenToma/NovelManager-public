function parserDetali() {
    var item = {};
    item.defaultFiter = new Filter();
    item.sections = [
        new Section("latest", "Latest Update", "Latest", true),
        new Section("horror", "Horror&Thriller", "Search", false, new Filter([47])),
        new Section("romance", "Romance", "Search", false, new Filter([3])),
        new Section("fantasy", "Fantasy", "Search", false, new Filter([2])),
    ]

    item.id = "1.tapread";
    item.detaliItemType = DetaliItemType.Novel;
    item.parserLanguage = "en";
    item.name = 'TapRead';
    item.latestUrl = 'https://www.tapread.com/ajax/book/lastupdatelist';
    item.url = 'https://www.tapread.com/';
    item.searchUrl = 'https://www.tapread.com/ajax/search/story';
    item.panination = true;
    item.searchPagination = false;
    item.icon = 'https://static.tapread.com/pc/images/favicon.ico';
    item.parserSearchSettings = new ParserSearchSettings();

    item.parserSearchSettings.genres = {
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
    return item;
}

async function getGenre(filter, page) {
    var url = "https://www.tapread.com/ajax/category/detail";
    var result = [];
    var data = await HttpClient.postForm(url, { cateId: filter.genres[0], pageNo: page });
    if (data && data.result && data.result.bookList) {
        data.result.bookList.forEach(item => {
            result.push(new LightItem(async () => {
                return (await getNovel(item.bookId, true)).image
            }, item.bookName, item.description, item.bookId, parser.name))
        });
    }

    return result;

}

async function search(filter, page) {
    if (filter.genres.length > 0)
        return await getGenre(filter, page);

    var result = [];
    var data = await HttpClient.postForm(parser.searchUrl, { searchText: filter.title, storyType: 1, pageNo: page });
    if (data && data.result && data.result.storyList) {
        data.result.storyList.forEach(item => {
            result.push(new LightItem(async () => {
                return (await getNovel(item.storyId.toString(), true)).image
            }, item.storyName, "", item.storyId.toString(), parser.name))
        });
    }

    return result;
}

async function getChapters(bookId) {
    var data = await HttpClient.postForm("https://www.tapread.com/ajax/book/contents", { bookId: bookId });
    var result = [];
    if (data && data.result && data.result.chapterList)
        data.result.chapterList.forEach(item => {
            result.push(new Chapter(item.chapterName, (item.bookId.toString() + "/" + item.chapterId.toString()).uri("https://www.tapread.com/ajax/book/chapter")))
        });

    return result;

}

async function getNovel(novelUrl, ignorechapters) {
    novelUrl = parseInt(novelUrl).toString();
    var container = parser.jq(await HttpClient.getHtml(novelUrl.toString().uri("https://www.tapread.com/book/detail/")));
    var chapters = !ignorechapters ? await getChapters(novelUrl) : [];
    var novelReviews = new NovelReviews();
    novelReviews.genres = container.find(".base-info .book-catalog .txt").textArray();
    novelReviews.author = container.select(".author .name").text(false);
    novelReviews.uvotes = container.select(".score").text() + " / 5";
    novelReviews.completed = container.select(".base-info .book-state .txt").text(false) === "Completed" ? "Status:Completed" : "Status:Ongoing";
    return new DetaliItem(
        container.select('.book-img img').attr("src").url(),
        container.select('.book-name').text(false),
        container.select('.desc').innerHTML(),
        novelUrl,
        chapters,
        novelReviews,
        parser.name,
        undefined,
    );
}

async function getChapter(url) {
    var urlContent = url.split("/");
    var bookId = urlContent[urlContent.length - 2];
    var chapterId = urlContent[urlContent.length - 1];
    console.log("bookId:" + bookId)
    console.log("chapterId:" + chapterId)
    var data = await HttpClient.postForm("https://www.tapread.com/ajax/book/chapter", { bookId: bookId, chapterId: chapterId })
    if (data && data.result)
        return data.result.content;
    return "Something went wrong";

}

async function latest(page) {
    var url = parser.latestUrl;
    var data = await HttpClient.postForm(url, { amoumt: 0, pageNo: page });
    var result = [];
    if (data && data.result && data.result) {
        data.result.forEach(item => {
            result.push(new LightItem(async () => {
                return (await getNovel(item.bookId, true)).image
            }, item.title, "", item.bookId, parser.name))
        });
    }

    return result;
}