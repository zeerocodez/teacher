const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  page.on('console', msg => {
    console.log(`[BROWSER CONSOLE] ${msg.type()}: ${msg.text()}`);
  });
  
  page.on('pageerror', error => {
    console.log(`[BROWSER ERROR] ${error.message}`);
  });

  page.on('requestfailed', request => {
    console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  });

  console.log('Navigating to http://localhost:4173/ ...');
  try {
    await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0', timeout: 10000 });
  } catch (e) {
    console.log('[NAVIGATION ERROR]', e.message);
  }
  
  console.log('Done.');
  await browser.close();
})();
