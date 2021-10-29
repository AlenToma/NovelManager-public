export default `(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client) => {
	const returnObject = {};
	returnObject.id = "1.readnovelfull";
	returnObject.parserLanguage = "en";
	returnObject.name = 'ReadNovelFull';
	returnObject.detaliItemType = DetaliItemType.Novel;
	returnObject.latestUrl = 'https://readnovelfull.com/latest-release-novel?page={p}';
	returnObject.url = 'https://readnovelfull.com/';
	returnObject.searchUrl = 'https://readnovelfull.com/search?keyword={q}&page={p}';
	returnObject.chaptersUrl = 'https://readnovelfull.com/ajax/chapter-option?novelId={id}&currentChapterId=1';
	returnObject.panination = true;
	returnObject.searchPagination = true;
	returnObject.icon = 'https://readnovelfull.com/img/favicon.ico';
	returnObject.parserSearchSettings = new ParserSearchSettings();
	returnObject.parserSearchSettings.genres = {
		multiSelection: false,
		values: [
			new labelValue('Shounen'),
			new labelValue('Harem'),
			new labelValue('Comedy'),
			new labelValue('Martial Arts', 'Martial+Arts'),
			new labelValue('School Life', 'School+Life'),
			new labelValue('Mystery'),
			new labelValue('Shoujo'),
			new labelValue('Romance'),
			new labelValue('Sci-fi'),
			new labelValue('Gender Bender', 'Gender+Bender'),
			new labelValue('Mature'),
			new labelValue('Fantasy'),
			new labelValue('Horror'),
			new labelValue('Drama'),
			new labelValue('Tragedy'),
			new labelValue('Supernatural'),
			new labelValue('Ecchi'),
			new labelValue('Xuanhuan'),
			new labelValue('Adventure'),
			new labelValue('Psychological'),
			new labelValue('Xianxia'),
			new labelValue('Wuxia'),
			new labelValue('Historical'),
			new labelValue('Slice of Life', 'Slice+of+Life'),
			new labelValue('Lolicon'),
			new labelValue('Adult'),
			new labelValue('Josei'),
			new labelValue('Sports'),
			new labelValue('Smut'),
			new labelValue('Mecha'),
			new labelValue('Yaoi'),
			new labelValue('Shounen Ai', 'Shounen+Ai'),
		],
	};
	returnObject.parserSearchSettings.sortTypes = {
		multiSelection: false,
		values: [
			new labelValue('Latest Release Novel', 'latest-release-novel'),
			new labelValue('Hot Novel', 'hot-novel'),
			new labelValue('Completed Novel', 'completed-novel'),
			new labelValue('Most Popular', 'most-popular-novel'),
		],
	};
	returnObject.getSections = (keys) => {
		var sections = [
			new Section("latest", "Latest Update", "Latest", true),
			new Section("hot", "Hot Novel", "Search", false, new Filter(undefined, "hot-novel")),
			new Section("completed", "Completed Novel", "Search", false, new Filter(undefined, "completed-novel")),
			new Section("popular", "Most Popular", "Search", false, new Filter(undefined, "most-popular-novel"))
		]
		return sections.filter(x => !keys || keys.includes(x.name));
	}
	returnObject.translateSection = async (section, page) => {
		if (section.identifier == "Latest") return await returnObject.latest(page);
		else return await returnObject.search(section.filter || returnObject.defaultFilter(), page);
	}
	returnObject.defaultFilter = () => {
		var filter = new Filter();
		return filter;
	};
	returnObject.search = async (filter, page) => {
		var genreUrl = "genre/{g}?page={p}".uri(returnObject.url).replace("{p}", page.toString());
		var sortTypeUrl = "{s}?page={p}".uri(returnObject.url).replace("{p}", page.toString());
		var q = filter.genres.length > 0 ? genreUrl.replace("{g}", filter.genres[0]) : (filter.sortType && filter.sortType != '' ? sortTypeUrl.replace("{s}", filter.sortType) : undefined);
		var query = q || returnObject.searchUrl.replace('{q}', filter.title || "").replace('{p}', page.toString());
		var container = returnObject.parser.jq(await HttpClient.getHtml(query));
		var result = [];
		container.find('.list-novel .row').forEach((x) => {
			if (x.select('img').attr("src").hasValue()) result.push(new LightItem(x.select('img').attr("src").url().replace(/[0-9]+x[0-9]+/gi, "150x170"), x.select('.novel-title a').text(false), '', x.select('.novel-title a').attr("href").url(), returnObject.name), );
		});
		return result;
	}
	returnObject.getChapters = async (novelUrl, htmlContainer) => {
		var chapters = [];
		var url = returnObject.chaptersUrl.replace('{id}', (htmlContainer.select('#rating').attr("data-novel-id").hasValue() ? htmlContainer.select('#rating').attr("data-novel-id").text() : htmlContainer.select('[data-novel-id]').attr("data-novel-id").text()));
		var container = returnObject.parser.jq(await HttpClient.getHtml(url));
		container.find('option').forEach(x => {
			if (x.attr("value").hasValue()) chapters.push(new Chapter(x.text(false), x.attr("value").url()));
		});
		return chapters;
	}
	returnObject.getNovel = async (novelUrl) => {
		var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
		var chapters = await returnObject.getChapters(novelUrl, container);
		var item = new NovelReviews();
		var info = container.find('.info li');
		item.genres = info.where(x => x.innerHTML().toLowerCase().indexOf("genre") != -1).find("a").textArray();
		item.author = info.where(x => x.innerHTML().toLowerCase().indexOf("author") != -1).find("a").text(false)
		item.completed = info.where(x => x.innerHTML().toLowerCase().indexOf("status") != -1).text(false);
		item.alternativeNames = info.where(x => x.innerHTML().toLowerCase().indexOf("alternative names") != -1).text();
		return new DetaliItem(container.select('.book img').attr("src").url(), container.select('.title').text(false), container.select('.desc-text').cleanInnerHTML(), novelUrl, chapters, item, returnObject.name, undefined);
	}
	returnObject.getChapter = async (url) => {
		return returnObject.parser.jq(await new client().getHtml(url)).select('#chr-content').cleanInnerHTML();
	}
	returnObject.latest = async (page) => {
		var url = returnObject.latestUrl.replace('{p}', page.toString());
		var container = returnObject.parser.jq(await HttpClient.getHtml(url));
		var result = [];
		container.find('.list-novel .row').forEach((x) => {
			if (x.select('img').attr("src").hasValue()) result.push(new LightItem(x.select('img').attr("src").url().replace(/[0-9]+x[0-9]+/gi, "150x170"), x.select('.novel-title a').text(), '', x.select('.novel-title a').attr("href").url(), returnObject.name), );
		});
		return result;
	}
	return returnObject;
};`