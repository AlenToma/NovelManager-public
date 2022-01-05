import nbrowser from 'puppeteer'
import Client from './http.js'

export class Bbrowser {
  constructor() {
    this.browsers = [];
    this.data = new Map();
    this.maxPages = 20;
    this.maxData = 1000000;
    this.maxBrowsers = 2;
    this.totalPages = 0;
    this.timer = undefined;
    this.working = false;
    this.selectingBrowser = false;
    this.started = false;
    this.processing = new Map();
    this.pageTimers = new Map();
    this.pageTimeout = 8000;
    this.refreshData = 3; // refresh data every 3 days.  
  }

  wait(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve.bind(this), ms);
    });
  }

  async freeResources(clearAll) {
    try {
      console.log("freeing resources");
      this.browsers.forEach(browser => {
        if (!browser.isConnected() || clearAll == true) {
          browser.closed = true;
          browser.close();
        }
      });


      this.browsers = this.browsers.filter(x => x.closed != true).sort((a,b)=> {
		a.totalPages - b.totalPages;
	});
      if (this.browsers === undefined)
        this.browsers = [];
      const en = [...this.data.entries()];
      if (this.data.size > this.maxData) {
        const sortedData = en.sort((a, b) => {
          return (a[1].date > b[1].date) - (a[1].date < b[1].date);
        });
        let index = 0;
        while (sortedData.length > 0 && (this.data.size > 0 && this.data.size > this.maxData)) {
          var item = sortedData[index];
          this.data.delete(item[0]);
          index++;
        }
      }
      // update data every 3 days 
      const date = new Date().setDate(-this.refreshData);
      en.forEach(x => {
        if (x[1].date < date) {
          this.data.delete(x[0]);
        }
      })
    } catch (e) {
      console.log(e);
      throw e;
    }
  }

  async newBrowser() {
    var item = await nbrowser.launch({
      headless: false,
      args: ["--disable-setuid-sandbox", "--disable-extensions"],
      ignoreHTTPSErrors: true
    });
    this.browsers.push(item);
    item.process().setMaxListeners(this.maxPages);
    item.totalPages = 0;
    return item;
  }

  async checkBrowser() {
    try {
      const brs = this.browsers.filter(x => x.isConnected());
        let fbr = undefined;
        for (var x of brs) {
          if (x.totalPages < this.maxPages) {
            return x; 
            break;s
          }
        }
 
          if (brs.length >= this.maxBrowsers) {
            await this.wait(100);
            return await this.checkBrowser();
          } else {
            return await this.newBrowser();
          }
        
    } catch (e) {
      console.log(e);
    }
  }

  async stop() {
    this.started = false;
    clearInterval(this.timer);
    await this.freeResources(true);
  }

  async start() {
    await this.stop(); // clear 
    this.timer = setInterval(this.freeResources.bind(this), 800000);
    await this.newBrowser();
    this.started = true;
    console.log("started")
  }

  saveData(url, content, isTest) {
    if (isTest !== true)
      this.data.set(url, { data: content, date: new Date() });
  }


  async getPageContent(url, isText, isTest) {

    while (this.started === false || this.processing.has(url) || this.selectingBrowser)
      await this.wait(100);

    this.processing.set(url, true);
    let page = undefined;
    let browser = undefined;
    try {
      if (this.data.has(url) && isTest !== true) {
        return this.data.get(url).data;
      while (this.selectingBrowser) {
        await this.wait(100);
      }
      this.selectingBrowser = true;
      browser=  await this.checkBrowser();

      if (this.data.has(url) && isTest !== true) {
          return this.data.get(url).data;
      }

      browser.totalPages++;
      this.totalPages++;
      this.selectingBrowser = false;
      console.log("startingPage", url);
      page = await browser.newPage({ waitUntil: 'networkidle2' });
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/61.0.3163.100 Safari/537.36');
      this.pageTimers.set(url, setTimeout(() => {
      // it took to long to load the page need to inc pagetimeout.
        console.log("Page timeout.");
        page.close();
      }, this.pageTimeout));
      page.lastCall = new Date();
      await page.goto(url);
      const content = await page.content();
      this.saveData(url, content, isTest);
      return content;
    } catch (e) {
      console.log(e);
    } finally {
      if (page != undefined) {
        await page.close();
        browser.totalPages--;
        this.totalPages--;
      }
      this.processing.delete(url);
      if (this.pageTimers.has(url)) {
        clearTimeout(this.pageTimers.get(url))
        this.pageTimers.delete(url);
      }
    }
  }
}

const br = new Bbrowser();
export default br;