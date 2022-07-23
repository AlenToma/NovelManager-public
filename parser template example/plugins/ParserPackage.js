export default (Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler, parseHtml) => {
	// this plug in I personly use, is app to you use it on your parsers 
    function Plugin() {
        this.type = "--plugin--";
        this.name = "Cleaner";
        this.client = {};
    }

    Plugin.prototype = {
		// if you are not able to find the image in your result then you could use this 
		// parserURI = sitebase url
		// the desire image url
		// selector= css selector to exctract the image from the desire site
		// attr = could be src or "data-src|src" as mulltiable attr selector.
        image: function(parserURI, url, selector, attr){
            return new ImageHandler(parserURI, url, selector, attr);
        },
		
        getNovelId:(parserName, method, args, property)=> {
            return {parserName, method, args, property}
        },
		
        cleanChapter: function (selector, name) {
            try {
                var chars = [
                    "If you find any errors ( broken links, non-standard content, etc.. ), Please let us know  report chapter > so we can fix it as soon as possible.",
                    "If you find any errors ( broken links, non-standard content, etc.. ), Please let us know < report chapter > so we can fix it as soon as possible.",
                    "Prev Chapter",
                    "Next Chapter"
                ]
                const classesToRemove = ["input", "script", "style"];

                switch (name) {
                    case "LightNovelPub":
                        classesToRemove.push(".chapter-content >p[class]:not([class=''])");
                        break;
                    case "AllNovel":
                        classesToRemove.push(".ad-container");
                        break;
                    default:
                        break;
                }

                var html = selector.remove(classesToRemove.join(",")).outerHTML().replace(/(?=&)(.*?)(;)/g, "");
                const rChars = chars.map(x => HttpClient.escapeRegex(x));
                if (name)
                    rChars.push(HttpClient.escapeRegex(name));

                var expression = "(" + rChars.join("|") + ")";
                var regexp = new RegExp(expression, "gmi");
                return html.replace(regexp, "");
            } catch (error) {
                console.log("CleaningChapter Error", error);
                return selector.cleanInnerHTML();
            }
        },

        getClient: function (parserId) {
            switch (parserId) {
                case "1.parser.2":
                    if (this.client[parserId] != undefined)
                        return this.client[parserId];
                    return (this.client[parserId] = new client(["script", "style"]))
                default:
                    if (this.client["default"] != undefined)
                        return this.client["default"];
                    return (this.client["default"] = new client());
            }
        }
    }

    return new Plugin();
};