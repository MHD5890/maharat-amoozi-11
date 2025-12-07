import puppeteer from 'puppeteer';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const nationalId = searchParams.get('nationalId');

  if (!nationalId || !/^\d{10}$/.test(nationalId)) {
    return new Response('کد ملی نامعتبر', { status: 400, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    await page.goto('https://azmoon.portaltvto.com/estelam/estelam', { waitUntil: 'networkidle2' });

    // Fill the form
    await page.type('input[name="st_nid"]', nationalId);
    await page.type('input[name="st_iid"]', nationalId);
    await page.select('select[name="st_nationality"]', '1');
    // Check PDF download checkbox if exists
    const pdfCheckbox = await page.$('input[name="pdf"]');
    if (pdfCheckbox) {
      await pdfCheckbox.click();
    }

    // Find and click the submit button
    const submitButton = await page.$('input[type="submit"], button[type="submit"], input[type="button"], button');
    if (submitButton) {
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2' }),
        submitButton.click()
      ]);
    } else {
      // If no button found, try submitting the form directly
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.submit();
      });
      await page.waitForTimeout(5000);
    }

    const content = await page.content();

    await browser.close();

    return new Response(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  } catch (error) {
    console.error('Error fetching certificate:', error);
    return new Response(`خطا در دریافت مدرک: ${error.message}`, { status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  }
}
