const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err));
    
    await page.goto('http://localhost:3000');
    
    await page.click('button[data-key="custom"]');
    await page.waitForSelector('.wizard-btn[data-teams="256"]');
    await page.click('.wizard-btn[data-teams="256"]');
    
    await page.waitForSelector('.wizard-btn[data-groups="3"]');
    await page.click('.wizard-btn[data-groups="3"]');

    await page.waitForSelector('.wizard-btn[data-players="1"]');
    await page.click('.wizard-btn[data-players="1"]');
    
    await page.waitForSelector('#randomFill');
    await page.click('#randomFill');
    
    await new Promise(r => setTimeout(r, 1000));
    await page.click('#startGroups');
    
    await new Promise(r => setTimeout(r, 1000));
    const title = await page.evaluate(() => document.querySelector('h2') ? document.querySelector('h2').innerText : '');
    console.log('FINAL TITLE:', title);

    await browser.close();
})();
