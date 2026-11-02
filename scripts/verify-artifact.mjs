import { chromium } from "@playwright/test";
import { readFile, writeFile } from "node:fs/promises";

const source = await readFile("dist/student-guide-artifact.jsx", "utf8");
if (source.includes('"notebook-mark.png"'))
  throw new Error("Logo was not embedded.");
if (!source.includes("data:image/png;base64,"))
  throw new Error("Missing embedded logo.");
await writeFile(
  ".cache/artifact-host.html",
  `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Artifact verification</title></head><body><div id="root"></div><script type="module">import {createRoot} from 'react-dom/client';import App from '/dist/student-guide-artifact.jsx';createRoot(document.getElementById('root')).render(<App/>);</script></body></html>`
    .replace("render(<App/>)", "render(React.createElement(App))")
    .replace(
      "import {createRoot}",
      "import React from 'react';import {createRoot}",
    ),
);
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://127.0.0.1:4173/.cache/artifact-host.html");
await page
  .getByRole("button", { name: "Explore an example", exact: true })
  .click();
await page
  .getByRole("heading", { name: "Your lifestyle, at a glance." })
  .waitFor();
if (
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
)
  throw new Error("Standalone artifact overflows the mobile viewport.");
if (
  !(await page
    .locator("header img")
    .evaluate(
      (img) =>
        img.complete && img.naturalWidth > 0 && img.src.startsWith("data:"),
    ))
)
  throw new Error("Embedded logo failed to load.");
await page
  .getByRole("button", { name: "Edit my choices", exact: true })
  .click();
await page.getByLabel(/What should we call you/).fill("Taylor");
if (
  await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)
)
  throw new Error("Standalone form overflows.");
if (errors.length) throw new Error(errors.join("\n"));
console.log(
  "Standalone artifact: embedded image, mobile layout, primary controls, and console verified without host CSS.",
);
await browser.close();
