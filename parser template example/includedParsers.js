export default (Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews, client, ImageHandler, parseHtml, plugins) => {
	// this file should containe and return all included parsers. file could be displayname or name of the parser
    return {
        name: "includedParsers",
        data: [
            {
                "file": "R-Novel-Fully",
            },
            {
                "file": "parser 2",
            }
        ]
    }
}