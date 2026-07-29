import { chromium } from "playwright-core";

const OUT = process.env.OUT || "cupom.png";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto("http://localhost:3000/", { waitUntil: "networkidle" });
await page.waitForTimeout(800);
await page.getByText("Ver cupom").first().click();
await page.waitForTimeout(900);
await page.screenshot({ path: OUT, fullPage: false });
console.log("OK ->", OUT);
await browser.close();
