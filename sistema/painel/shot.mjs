import { chromium } from "playwright-core";

const BASE = process.env.BASE || "http://localhost:3000";
const OUT = process.env.OUT || "atendimentos.png";
const PATH = process.env.PATH_ || "/preview/atendimentos";

const browser = await chromium.launch({ channel: "chrome", headless: true });
const ctx = await browser.newContext({ viewport: { width: 1500, height: 820 }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(BASE + PATH, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
console.log("URL:", page.url());
await page.screenshot({ path: OUT, fullPage: false });
console.log("OK ->", OUT);
await browser.close();
