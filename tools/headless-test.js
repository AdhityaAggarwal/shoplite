import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

async function run() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  try {
    console.log('Opening products page...');
    await page.goto(BASE + '/products', { waitUntil: 'networkidle2', timeout: 15000 });

    // Wait for add-to-cart to be available
    await page.waitForSelector('.add-to-cart', { timeout: 7000 });
    console.log('Found add-to-cart button; clicking first one');
    await page.click('.add-to-cart');

    // Wait until localStorage 'shoplite_cart_v1' shows at least one item
    await page.waitForFunction(() => {
      try {
        const c = JSON.parse(localStorage.getItem('shoplite_cart_v1') || '[]');
        return Array.isArray(c) && c.length > 0;
      } catch (e) {
        return false;
      }
    }, { timeout: 3000 });
    // Read localStorage cart
    const cart = await page.evaluate(() => JSON.parse(localStorage.getItem('shoplite_cart_v1') || '[]'));
    console.log('LocalStorage cart after add:', cart);

    console.log('Navigating to /cart');
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle2', timeout: 10000 });

    // Wait for cart rendering
    await page.waitForSelector('#cart-table-wrap, #cart-empty', { timeout: 7000 });
    const rowCount = await page.evaluate(() => {
      const tbody = document.querySelector('#cart-table-wrap tbody');
      if (!tbody) return 0;
      return tbody.querySelectorAll('tr').length;
    });
    console.log('Cart table rows:', rowCount);

    // Save screenshot
    const outDir = path.join(process.cwd(), 'tools');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const outFile = path.join(outDir, 'headless-cart.png');
    await page.screenshot({ path: outFile, fullPage: true });
    console.log('Saved screenshot to', outFile);

    await browser.close();
    if (rowCount > 0) {
      console.log('Headless test passed');
      process.exit(0);
    } else {
      console.error('Headless test failed: no rows in cart');
      process.exit(2);
    }
  } catch (err) {
    console.error('Headless test error:', err && err.message ? err.message : err);
    try { await browser.close(); } catch (e) {}
    process.exit(3);
  }
}

run();
