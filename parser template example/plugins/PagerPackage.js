export default (Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler, parseHtml) => {
    function Plugin() {
        this.type = "--plugin--";
        this.name = "Pager";
        this.client = {};
    }

    Plugin.prototype = {
        renderCounterCalls: async function (url, selector, htmlOnly) {
            var maxPage = selector(await (!htmlOnly ? HttpClient.getHtml(url.replace("{page}", 1)) : HttpClient.GetText(url.replace("{page}", 1))));
            var promises = []
            for (var i = 1; i <= maxPage; i++) {
                var uurl = url.replace("{page}", i.toString());
                promises.push(!htmlOnly ? HttpClient.getHtml(uurl) : HttpClient.GetText(uurl));
                await HttpClient.wait(200);
            }
            return { promises };
        }
    }

    return new Plugin();
}