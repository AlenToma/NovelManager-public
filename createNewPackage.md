
# Create Parser Package

With NovelManager, developer will be able to create and develop their own parsers with their favorite novel sites.
Follow this guide to know how to develop and apply the package to novelmanager.

* 1- create your parsers for this please follow the template [parser template example](https://github.com/AlenToma/NovelManager-public/tree/master/parser%20template%20example)
* 2- When you are done, download and install [base64packagemaker](https://github.com/AlenToma/base64string-package-maker/releases/tag/1.0.6) 
* 3- with [base64packagemaker](https://github.com/AlenToma/base64string-package-maker/releases/tag/1.0.6) you be able to create a package.
* 4- Upload the package to your favorit server or your own github.
* 5- In novelManager go to settings and select `Parsers Package URL`
* 6- Fill the PackageUrl and the encrytion Key that you created the package with and press submit.
* 7- restart the app and you will be able to load your parsers.

## Classes and it properties propeties
Now if you look at the template you will find classes that are passed on to the parsers that you could use like `Section, Chapter, HttpClient, DetaliItem, LightItem, ParserSearchSettings, Filter, labelValue, DetaliItemType, NovelReviews`

note that `this.parser.jq` return [node-html-scraper](https://www.npmjs.com/package/node-html-scraper) 

## Section
`constructor(name: string, text:string, identifier: "Search" | "Latest", mandatory?: boolean, filter?: Filter)`

## Chapter
`constructor(name: string, chapterUrl: string)`

## HttpClient 
HttpClient is static so you could use its property
| method  | parameters |
| ------------- | ------------- |
| addHeader  | (key: string, value: string)  |
| getHtml  | (url: string, isImage?: boolean)  |
| GetText  | (url: string, waitonTimeOut?: boolean)  |
| GetJson  | (url: string)  |
| postEncodedForm  | (url: any, item?: any)  |
| postForm  | (url: any, item?: any)  |
| postJson   | (url: any, item?: any)  |
| escapeRegex   | (str: string)  |

## DetaliItem
```
  constructor(
    image: string,
    title: string,
    description: string,
    novel: string,
    chapters: chapter[],
    info: NovelReviews,
    parserName: string,
    commentView?: string,
    detaliItemType?: DetaliItemType
  )
```

## LightItem
```
constructor(
    image: string | ImageHandler ,
    title: string,
    description: string,
    novel: string,
    parserName: string,
    detaliItemType?: DetaliItemType
  )
```
## labelValue
` constructor(name: string, value?: any | undefined | null)`

## labelValueCollection
| property  | parameters |
| ------------- | ------------- |
| values  | labelValue  |
| multiSelection  | boolean  |


## parserSearchSettings
| property  | parameters |
| ------------- | ------------- |
| genres  | labelValueCollection  |
| languages  | labelValueCollection  |
| sortTypes  | labelValueCollection  |
| statuses  | labelValueCollection  |
| multiSelection  | boolean  |

## Filter 
`constructor(genres?: any[], sortType?: any, language?: string, active?: any, count?: number)`


## DetaliItemType
`DetaliItemType.Novel | DetaliItemType.Managa`

## NovelReviews
| property  | parameters | its uses |
| ------------- | ------------- |-------------|
| genres?  | string[]  | uses in parser and information.js  |
| description?  | string  |uses in parser and information.js  |
| alternativeNames?  | string  |uses in parser and information.js  |
| uvotes?  | string  |uses in parser and information.js  |
| author?  | string  |uses in parser and information.js  |
| lang?  | string  |uses in parser and information.js  |
| completed?  | string  |uses in parser and information.js  |
| authorUrl?  | string  | information.js only |
| url?  | string  |information.js only |
| recummendations?  | LightItem[]  | information.js only |
| authorData?  | LightItem[]  | information.js only |

## parseHtml
a function to parser html string to selector
`parseHtml("<div></div>")`

`parseHtml` will return [node-html-scraper](https://www.npmjs.com/package/node-html-scraper)


## ImageHandler
`constructor(parserURI: string, url: string, selector: string, attr?: string)`





