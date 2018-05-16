const puppeteer = require('puppeteer');

const sessionFactory = require('../factories/sessionFactory');
const userFactory = require('../factories/userFactory');

class TestPage {

  static async build() {
    const browser = await puppeteer.launch({
      headless: true,
      args: [ '--no-sandbox' ]
    });
    const page = await browser.newPage();

    return TestPage.wrap(browser, page)
  }

  static wrap(browser, page) {

    const testPageInstance = new TestPage(page);

    return new Proxy(testPageInstance, {
      get: function (target, property) {
        return browser[property] || page[property] || target[property];
      }
    })
  }

  constructor(page) {
    this._page = page;
  }

  async createAndLoginUser() {
    const user = await userFactory();
    const {sig, session} = sessionFactory(user);

    await this._page.setCookie({
      name: 'session',
      value: session,
      url: 'http://localhost:3000'
    });

    await this._page.setCookie({
      name: 'session.sig',
      value: sig,
      url: 'http://localhost:3000'
    });

    await this._page.goto('http://localhost:3000/blogs');
    await this._page.waitForSelector('ul.right a[href="/auth/logout"]');

    return user;
  }

  async getContentsOf(selector) {
    return await this._page.$eval(selector, el => el.innerHTML);
  }

  get(path) {
    return this._page.evaluate(uri => {
      return fetch(uri, {
        method: 'GET',
        credentials: "same-origin",
        headers: {
          'Content-Type': 'application/json'
        }
      }).then(res => res.json())
    }, path)
  }

  post(path, data) {
    return this._page.evaluate((uri, body) => {
      return fetch(uri, {
        method: 'POST',
        credentials: "same-origin",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }).then(res => res.json())
    }, path, data)
  }

  execRequests(actions) {
    return Promise.all(actions.map(({method, path, data}) => this[method](path, data)));
  }
}

module.exports = TestPage;
