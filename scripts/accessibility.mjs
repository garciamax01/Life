import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFile, mkdir } from "node:fs/promises";

const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1024 },
});
const page = await context.newPage();
await mkdir(".cache/qa", { recursive: true });
const reports = [];
for (const screen of [
  "welcome",
  "overview",
  "careers",
  "paycheck",
  "housing",
]) {
  if (screen === "welcome") await page.goto("http://127.0.0.1:4173");
  if (screen === "overview")
    await page
      .getByRole("button", { name: "Explore an example", exact: true })
      .click();
  if (screen === "careers")
    await page
      .getByRole("button", { name: "Explore career paths", exact: true })
      .click();
  if (screen === "paycheck")
    await page
      .getByRole("button", { name: "Test this wage", exact: true })
      .first()
      .click();
  if (screen === "housing") {
    await page
      .getByRole("button", { name: "Edit my choices", exact: true })
      .click();
    await page.getByRole("button", { name: "03 Housing", exact: true }).click();
  }
  const { violations, incomplete } = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  reports.push({ screen, violations, incomplete });
  console.log(
    screen,
    JSON.stringify(
      violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ),
  );
}
await writeFile(
  ".cache/qa/accessibility.json",
  JSON.stringify(reports, null, 2),
);
await browser.close();
if (reports.some((r) => r.violations.length)) process.exitCode = 1;
