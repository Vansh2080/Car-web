const puppeteer = require("puppeteer");
(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  await page.goto("http://localhost:8080");
  await new Promise(r => setTimeout(r, 2000));
  
  const selectable = await page.evaluate(() => {
     return typeof selectableMeshes !== 'undefined' ? selectableMeshes.length : -1;
  });
  console.log("selectableMeshes count:", selectable);
  
  const compMeshes = await page.evaluate(() => {
     if(typeof phantomComponents === 'undefined') return {};
     const counts = {};
     for(let key in phantomComponents) {
         counts[key] = phantomComponents[key].meshes ? phantomComponents[key].meshes.length : 0;
     }
     return counts;
  });
  console.log("Component mesh counts:", compMeshes);

  await browser.close();
})();
