const puppeteer = require('puppeteer');
(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.goto('http://localhost:3000');
    await page.click('button[data-key="custom"]');
    await page.waitForSelector('.wizard-btn[data-players="1"]');
    await page.click('.wizard-btn[data-players="1"]');
    await page.waitForSelector('.wizard-btn[data-teams="256"]');
    await page.click('.wizard-btn[data-teams="256"]');
    await page.waitForSelector('.wizard-btn[data-rounds="6"]');
    await page.click('.wizard-btn[data-rounds="6"]');
    await page.waitForSelector('#randomFill');
    await page.click('#randomFill');
    
    const poolSize = await page.evaluate(() => state.custom.pool.length);
    const selectedIdsSize = await page.evaluate(() => state.custom.selectedIds.size);
    const selectedTeamsSize = await page.evaluate(() => state.custom.pool.filter(t => state.custom.selectedIds.has(t.id)).length);
    console.log('POOL:', poolSize, 'IDS:', selectedIdsSize, 'TEAMS:', selectedTeamsSize);

    await browser.close();
})();
