/* Screenshot harness: node scripts/shot.mjs <url> <out.png> [waitMs] [--full] */
import puppeteer from "puppeteer-core";

const url = process.argv[2] ?? "http://localhost:3000/";
const out = process.argv[3] ?? "/tmp/shot.png";
const wait = Number(process.argv[4] ?? 4000);
const fullPage = process.argv.includes("--full");
const mobile = process.argv.includes("--mobile");

const browser = await puppeteer.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  headless: true,
  args: ["--hide-scrollbars"],
  defaultViewport: mobile
    ? { width: 390, height: 844, deviceScaleFactor: 2 }
    : {
        width: 1680,
        height: 1050,
        deviceScaleFactor: process.argv.includes("--retina") ? 2 : 1,
      },
});

const page = await browser.newPage();
page.on("console", (m) => {
  const type = m.type();
  if (type === "error" || type === "warn") console.log(`[console.${type}]`, m.text());
});
page.on("pageerror", (e) => console.log("[pageerror]", e.message));

const scrollArg = process.argv.find((a) => a.startsWith("--scroll="));
const clickArg = process.argv.find((a) => a.startsWith("--click="));

await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
await new Promise((r) => setTimeout(r, wait));
if (clickArg) {
  await page.click(clickArg.split("=").slice(1).join("="));
  await new Promise((r) => setTimeout(r, 600));
}
if (scrollArg) {
  const px = Number(scrollArg.split("=")[1]);
  await page.evaluate((y) => window.scrollTo({ top: y }), px);
  await new Promise((r) => setTimeout(r, 900));
}
await page.screenshot({ path: out, fullPage });
await browser.close();
console.log("saved", out);
