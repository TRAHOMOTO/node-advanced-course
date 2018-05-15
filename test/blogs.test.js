const TestPage = require('../test/helpers/TestPage');
let page;
beforeEach(async () => {
  page = await TestPage.build();
  await page.goto('http://localhost:3000')
});

afterEach(async () => await page.close());


describe('When logged in', () => {

  beforeEach(async () => {
    await page.createAndLoginUser();
    await page.click('div.fixed-action-btn a[href="/blogs/new"]');
  });

  it('should show button for blog creation', async () => {
    const labelText = await page.getContentsOf('form label');

    expect(labelText).toEqual('Blog Title');
  });


  describe('And using invalid inputs', () => {

    beforeEach(async () => await page.click('form button[type="submit"]') );

    it('should show form errors', async () => {
      const titileErrorMsg = await page.getContentsOf('form .title .red-text');
      const contentErrorMsg = await page.getContentsOf('form .content .red-text');

      expect(titileErrorMsg).toEqual('You must provide a value');
      expect(contentErrorMsg).toEqual('You must provide a value');
    })

  });

  describe('And using valid inputs', () => {

    beforeEach(async () => {
      await page.type('input[name="title"]', 'Test title');
      await page.type('input[name="content"]', 'Test content');
      await page.click('form button[type="submit"]')
    });

    it('should after submitting takes user to the review screen', async () => {
      const pageTitle = await page.getContentsOf('h5');
      expect(pageTitle).toEqual('Please confirm your entries');
    });

    it('should after submitting and saving add blog to index page', async () => {
      await page.click('button.green');

      await page.waitFor('.card');

      const createdBlogTitle = await page.getContentsOf('.card-title');
      const createdBlogContent = await page.getContentsOf('p');

      expect(createdBlogTitle).toEqual('Test title');
      expect(createdBlogContent).toEqual('Test content');
    });

  });
});

describe('When user is not login', () => {

  const actions = [
    { method: 'get', path: '/api/blogs' },
    { method: 'post', path: '/api/blogs', data: { title: 'T', content: 'C'} },
  ];


  test('Blog related actions are prohibited', async () => {

    const expected = { error: 'You must log in!' };

    for(const result of (await page.execRequests(actions)) ){
      expect(result).toEqual(expected);
    }
  })

});