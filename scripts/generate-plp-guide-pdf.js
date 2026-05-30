/**
 * Generates PLP technical guide PDF from HTML using Puppeteer.
 * Run: node scripts/generate-plp-guide-pdf.js
 */
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const HTML = path.join(ROOT, 'docs', 'PLP_Chatbot_LiveClass_Auth_Guide.html');
const PDF = path.join(ROOT, 'docs', 'PLP_Chatbot_LiveClass_Auth_Guide.pdf');

async function main() {
  if (!fs.existsSync(HTML)) {
    console.error('Missing HTML:', HTML);
    process.exit(1);
  }

  let puppeteer;
  try {
    puppeteer = require('puppeteer');
  } catch {
    console.error('Install puppeteer first: npm install --no-save puppeteer');
    process.exit(1);
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    const fileUrl = `file:///${HTML.replace(/\\/g, '/')}`;
    await page.goto(fileUrl, { waitUntil: 'networkidle0' });
    await page.pdf({
      path: PDF,
      format: 'A4',
      printBackground: true,
      margin: { top: '12mm', right: '12mm', bottom: '14mm', left: '12mm' },
    });
    console.log('PDF created:', PDF);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
