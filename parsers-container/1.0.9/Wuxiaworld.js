(Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler) => {
    const returnObject = {};
    returnObject.id = "1.wuxiaworld";
    returnObject.detaliItemType = DetaliItemType.Novel;
    returnObject.parserLanguage = "en";
    returnObject.name = 'Wuxiaworld';
    returnObject.latestUrl = 'https://www.wuxiaworld.com/updates';
    returnObject.url = 'https://www.wuxiaworld.com';
    returnObject.searchUrl = 'https://www.wuxiaworld.com/api/novels/search';
    returnObject.panination = false;
    returnObject.searchPagination = true;
    returnObject.icon = 'https://www.wuxiaworld.com/favicon-32x32.png?v=jwEkKXw8PY';

    returnObject.parserSearchSettings = new ParserSearchSettings();
    returnObject.parserSearchSettings.multiSelection = true;
    returnObject.parserSearchSettings.genres =
    {
      multiSelection: true,
      values: [
        new labelValue('Action'),
        new labelValue('Cheat Systems'),
        new labelValue('Cooking'),
        new labelValue('Alchemy'),
        new labelValue('Crafting'),
        new labelValue('Comedy'),
        new labelValue('Fantasy'),
        new labelValue('Harem'),
        new labelValue('Mature'),
        new labelValue('Kingdom Building'),
        new labelValue('Modern Setting'),
        new labelValue('Mystery'),
        new labelValue('Political Intrigue'),
        new labelValue('Pets'),
        new labelValue('Post-apocalyptic'),
        new labelValue('Romance'),
        new labelValue('Female Protagonist'),
        new labelValue('Sci-fi'),
        new labelValue('Thriller'),
        new labelValue('Superpowers'),
        new labelValue('Tragedy'),
        new labelValue('Virtual Reality'),
        new labelValue('Xianxia'),
        new labelValue('Wuxia'),
        new labelValue('Xuanhuan'),
        new labelValue('Esports'),
        new labelValue('Cultivation'),
      ],
    };

    returnObject.parserSearchSettings.languages =
    {
      multiSelection: false,
      values: [
        new labelValue('Any'),
        new labelValue('Chinese'),
        new labelValue('English'),
        new labelValue('Korean'),
      ],
    };

    returnObject.parserSearchSettings.statuses =
    {
      multiSelection: false,
      values: [
        new labelValue('Any', null),
        new labelValue('Ongoing', true),
        new labelValue('Completed', false),
      ],
    };

    returnObject.parserSearchSettings.sortTypes =
    {
      multiSelection: false,
      values: [
        new labelValue('Name'),
        new labelValue('Popular'),
        new labelValue('Chapters'),
        new labelValue('New'),
        new labelValue('Rating'),
      ],
    };


    returnObject.getSections = (keys) => {
        var sections = [
          new Section("latest", "Latest Update", "Latest", true),
          new Section("new", "New Novel", "Search", false, HttpClient.cloneItem(returnObject.defaultFilter(), { sortType: "New" })),
          new Section("popular", "Popular Novel", "Search", false, HttpClient.cloneItem(returnObject.defaultFilter(), { sortType: "Popular" })),
          new Section("completed", "Completed Novel", "Search", false, HttpClient.cloneItem(returnObject.defaultFilter(), { active: false }))
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
        filter.language = returnObject.parserSearchSettings.languages.values.findAt(0).value;
        filter.sortType = returnObject.parserSearchSettings.sortTypes.values.findAt(0).value;
        filter.active = returnObject.parserSearchSettings.statuses.values.findAt(0).value;
        return filter;
      }
    
      returnObject.search = async (filter, page)=> {
        var data = await HttpClient.postJson(returnObject.searchUrl, filter);
        return data && data.items
          ? data.items.filter((x) => !x.sneakPeek).map(
            (x) =>
              new LightItem(
                x.coverUrl,
                x.name,
                x.synopsis,
                x.slug.uri('https://www.wuxiaworld.com/novel/'), returnObject.name
              ),
          )
          : [];
      }
    
      returnObject.getNovel= async (novelUrl) => {
        var container = returnObject.parser.jq(await HttpClient.getHtml(novelUrl));
        var chapters = [];
        container.find('.novel-content .chapter-item a').forEach((x) => {
          chapters.push(
            new Chapter(
              x.text(false),
              x.attr("href").url()
            ),
          );
        });
    
        var novelReviews = new NovelReviews();
    
        var node = container.select(".novel-body");
    
        novelReviews.genres = container.find('.genres a').textArray();
        var author = node.select("dt:contains(Author)")
        novelReviews.author = author.closest("div").find("dd").text(false);
        return new DetaliItem(
          container.select('.img-thumbnail').attr("src").url(),
          container.select('.novel-body h2').text(false),
          container.find('.novel-bottom >div').eq(1).cleanInnerHTML(),
          novelUrl,
          chapters,
          novelReviews,
          returnObject.name,
        );
      }
    
      returnObject.getChapter= async (url) => {
        return returnObject.parser.jq(await new client().getHtml(url)).select('#chapter-content').cleanInnerHTML();
      }
    
      returnObject.latest= async (page) =>{
        var container = returnObject.parser.jq(await HttpClient.getHtml(returnObject.latestUrl));
        return container.find('.section-content .title a').map((x) => {
          return new LightItem(async () => {
            var elem = returnObject.parser.jq(await HttpClient.getHtml(x.attr('href').url(), true))
            return elem.select(".img-thumbnail").attr("src").url();
          }, x.text(false), '', x.attr('href').url(), returnObject.name);
        });
      }

    return returnObject;
};