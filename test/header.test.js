const TestPage = require('../test/helpers/TestPage');

describe('Header behavior', () => {
  let page;

  beforeEach(async () => {
    page = await TestPage.build();
    await page.goto('http://localhost:3000');
  });

  afterEach(async () => {
    await page.close();
  });


  it('Should have correct text in Header', async () => {
    const text = await page.getContentsOf('a.brand-logo');
    expect(text).toEqual('Blogster');
  });

  it('Clicking to login starts OAuth flow', async () => {
    await page.click('ul.right a[href="/auth/google"]', { button: 'left' });
    const url = await page.url();

    expect(url).toMatch(/accounts\.google\.com/);
  });

  it('Should show Logout button when signed in', async () => {

    await page.createAndLoginUser();

    const text = await page.getContentsOf('ul.right a[href="/auth/logout"]');
    expect(text).toEqual('Logout');
  })

});
