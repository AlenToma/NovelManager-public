export default (Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler, parseHtml, plugins) => {
    // this class will extract the novelinformation from novelupdates if found.
	// this class is manditory and must be included in the package.
	// you could use other site then novelupdates if you so desire
	function Parser() {
        this.root = "https://www.novelupdates.com";
        this.cleaner = plugins.find(x => x.name == "Cleaner");
        this.clientName = "information";
    }
	
    Parser.prototype = {
        search: async function (name) {
            try {
                if (!name)
                    return undefined
                var html = await this.cleaner.getClient(this.clientName).postForm("https://www.novelupdates.com/wp-admin/admin-ajax.php", { action: "nd_ajaxsearchmain", strType: "desktop", strOne: name, strSearchType: "series" });
                var container = parseHtml(html, this.root).find("a");
                return container.where(x => name.trim().length >= (x.select(".search_hl").hasElement() ? x.select(".search_hl") : x.select("span")).text(false).trim().length && ((x.select(".search_hl").hasElement() ? x.select(".search_hl") : x.select("span")).text(false).toLowerCase().indexOf(name.toLowerCase()) != -1)).attr("href").url();
            } catch (error) {
                console.log(error)
                return undefined;
            }
        },
        getByAuthor: async function (url) {
            var container = parseHtml((await this.cleaner.getClient(this.clientName).getHtml(url)), this.root);
            var result = [];
            container.find(".search_main_box_nu").forEach(x => {
                result.push(
                    new LightItem(x.select(".search_img_nu img").attr("src").url(), x.select(".search_title a").text(false), "", x.select(".search_title a").attr("href").url(), "")
                )
            });
            return result;
        },

        getDetaliItem: async function (novelName) {
            var url = await this.search(novelName);
            if (!url)
                return undefined;
            try {
                var container = parseHtml(await this.cleaner.getClient(this.clientName).getHtml(url), this.root);
                var titem = new NovelReviews();

                titem.genres = container.find("#seriesgenre a").textArray();
                titem.description = container.select("#editdescription").text(true);
                titem.uvotes = container.select(".uvotes").text(false);
                titem.alternativeNames = container.select("#editassociated").text(false).replace(/<br>/, ",");
                titem.author = container.find("div#showauthors > a").text(false);
                titem.lang = container.select("#showlang > a").text(false)
                titem.completed = container.select("#showtranslated > a").text(false) === "Yes" ? "Status: Completed" : "Status: Ongoing";
                titem.authorUrl = container.select("div#showauthors > a").attr("href").text(false);
                titem.recummendations = container.find(".wpb_wrapper .genre").where(x => (x.attr("title").text(false)).indexOf("Recommended") > -1).map(x => {
                    return new LightItem(this.cleaner.image(this.root, x.attr("href").text(false).uri(this.root), ".seriesimg img", "src"), x.text(false), "", x.attr("href").text().uri(this.root), "")
                });

                if (!titem.genres || titem.genres.length <= 0)
                    return undefined;
                titem.url = url;
                return titem;
            } catch (error) {
                console.log(error)
                return undefined;
            }
        }
    }

    return new Parser();
}
