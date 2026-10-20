import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:3000';

function timeout(ms) { return new Promise(r => setTimeout(r, ms)); }

async function run() {
  console.log('Launching browser for E2E...');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox','--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE:', msg.text()));

  try {
    await page.goto(BASE + '/products', { waitUntil: 'networkidle2', timeout: 15000 });
    await page.waitForSelector('.add-to-cart', { timeout: 7000 });

    // Add two different items: first .add-to-cart, then second
    const addButtons = await page.$$('.add-to-cart');
    if (addButtons.length < 2) throw new Error('Not enough add-to-cart buttons');
    await addButtons[0].click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('shoplite_cart_v1') || '[]').length >= 1, { timeout: 3000 });
    await addButtons[1].click();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('shoplite_cart_v1') || '[]').length >= 2, { timeout: 3000 });

    // Go to cart
    await page.goto(BASE + '/cart', { waitUntil: 'networkidle2', timeout: 10000 });
    await page.waitForSelector('#cart-table-wrap tbody tr', { timeout: 7000 });

    // Increase qty of first item to 3
    const firstQtyInput = await page.$('[data-qty-input]');
    if (!firstQtyInput) throw new Error('Qty input not found');
    await firstQtyInput.click({ clickCount: 3 });
  await firstQtyInput.type('3');
  await timeout(300);

    // Remove second item (if present)
    const removeBtns = await page.$$('[data-remove-item]');
    if (removeBtns.length > 1) {
  await removeBtns[1].click();
  await timeout(300);
    }

    // Check cart rows and total
    const rows = await page.$$eval('#cart-table-wrap tbody tr', trs => trs.length);
    const totalText = await page.$eval('#checkout-btn', el => el.textContent);
    console.log('Rows after operations:', rows);
    console.log('Checkout button text:', totalText.trim());

    const outDir = path.join(process.cwd(), 'tools');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    await page.screenshot({ path: path.join(outDir, 'e2e-final.png'), fullPage: true });

    await browser.close();
    // Basic assertions
    if (rows >= 1 && /Checkout/.test(totalText)) {
      console.log('E2E passed');
      process.exit(0);
    } else {
      console.error('E2E failed: rows', rows, 'totalText', totalText);
      process.exit(2);
    }
  } catch (err) {
    console.error('E2E error:', err && err.message ? err.message : err);
    try { await browser.close(); } catch (e) {}
    process.exit(3);
  }
}

run();
