const puppeteer = require("puppeteer-core");
const fs = require('fs');

(async () => {
  try {
      const browser = await puppeteer.launch({
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: "new"
      });
      const page = await browser.newPage();
      await page.goto("http://localhost:8080");
      await new Promise(r => setTimeout(r, 2000));
      await page.screenshot({ path: "screenshot.png" });
      await browser.close();
      console.log("Screenshot saved.");
  } catch(e) {
      console.error(e);
  }
})();
