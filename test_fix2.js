const puppeteer = require('puppeteer-core');
(async () => {
    try {
        const browser = await puppeteer.launch({ executablePath: 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe' });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('LOG:', msg.text()));
        page.on('pageerror', err => console.log('ERR:', err));
        
        await page.goto('http://localhost:3000');
        
        await page.waitForSelector('button[data-key="custom"]');
        await page.click('button[data-key="custom"]');
        
        // Wait for player selection
        await page.waitForSelector('.wizard-btn[data-players="1"]');
        await page.click('.wizard-btn[data-players="1"]');
        
        // Let's print the HTML of the second screen
        await new Promise(r => setTimeout(r, 1000));
        const html = await page.evaluate(() => document.querySelector('.card').innerHTML);
        console.log('SCREEN 2:', html);
        
        await browser.close();
    } catch(e) { console.error(e); }
})();
