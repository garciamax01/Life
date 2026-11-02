import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
await mkdir(".cache/screenshots", { recursive: true });
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1440, height: 1024 },
  deviceScaleFactor: 1,
});
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4173");
await page.screenshot({
  path: ".cache/screenshots/welcome-desktop.png",
  fullPage: true,
});
await page
  .getByRole("button", { name: "Explore an example", exact: true })
  .click();
// Match the chosen visual's personal-results state rather than its sample banner.
await page
  .getByRole("button", { name: "Edit my choices", exact: true })
  .click();
await page.getByLabel(/What should we call you/).fill("Alex ");
await page.getByLabel(/What should we call you/).fill("Alex");
await page.getByRole("button", { name: "13 Savings", exact: true }).click();
await page.getByRole("button", { name: "See my results", exact: true }).click();
await page.screenshot({
  path: ".cache/screenshots/results-desktop.png",
  fullPage: true,
});
await page
  .getByRole("button", { name: "Print my summary", exact: true })
  .evaluate((el) => (el.style.outline = ""));
await page.emulateMedia({ media: "print" });
await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
await page.pdf({
  path: ".cache/screenshots/student-summary.pdf",
  format: "A4",
  printBackground: true,
});
await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
await page.emulateMedia({ media: "screen" });
await page.setViewportSize({ width: 390, height: 844 });
await page.waitForFunction(
  () => getComputedStyle(document.querySelector("h1")).fontSize === "38px",
);
await page.screenshot({
  path: ".cache/screenshots/results-mobile.png",
  fullPage: true,
});
await page
  .getByRole("button", { name: "Explore career paths", exact: true })
  .click();
await page.screenshot({
  path: ".cache/screenshots/careers-mobile.png",
  fullPage: true,
});
await page.setViewportSize({ width: 834, height: 1194 });
await page.getByRole("button", { name: "Overview", exact: true }).click();
await page.screenshot({
  path: ".cache/screenshots/results-tablet.png",
  fullPage: true,
});
await page
  .getByRole("button", { name: "Edit my choices", exact: true })
  .click();
await page.setViewportSize({ width: 1440, height: 1024 });
await page.getByRole("button", { name: "03 Housing", exact: true }).click();
await page.screenshot({
  path: ".cache/screenshots/housing-desktop.png",
  fullPage: true,
});
console.log(JSON.stringify({ errors }));
await browser.close();
