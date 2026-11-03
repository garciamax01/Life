import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("a wage, work schedule and what-if contribution survive edits and a progress-file round trip", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?example");
  await page.getByRole("button", { name: "Paycheck", exact: true }).click();
  const hourly = page.getByLabel("Or enter an hourly wage");
  await hourly.fill("17.25");
  await expect(page.getByLabel("Annual gross wages")).toHaveValue("35880");
  expect(await hourly.evaluate((input) => input.checkValidity())).toBe(true);
  await page.getByLabel("Paid hours per week").fill("30");
  await expect(page.getByLabel("Annual gross wages")).toHaveValue("26910");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "Edit housing", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Where will you call home?" }),
  ).toBeVisible();
  await page
    .getByLabel("Housing and shared utilities assigned to this plan (%)")
    .fill("75");
  await page.getByRole("button", { name: "Done editing, see results" }).click();
  await expect(page.getByLabel("Annual wage to compare")).toHaveValue("26910");
  await page
    .getByRole("button", { name: "Compare living with family" })
    .click();
  await page.getByLabel("Monthly contribution at home").fill("950");
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await page.getByRole("button", { name: "What-if", exact: true }).click();
  await expect(page.getByLabel("Monthly contribution at home")).toHaveValue(
    "950",
  );
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save progress", exact: true })
    .click();
  const download = await downloading;
  const path = await download.path();
  const saved = JSON.parse(await readFile(path, "utf8"));
  expect(saved.plan.comparisonSalary).toBe(26910);
  expect(saved.plan.personalHomeShare).toBe(75);
  expect(saved.plan.whatIfContribution).toBe(950);
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(path);
  await expect(page.getByLabel("Monthly contribution at home")).toHaveValue(
    "950",
  );
  await page.getByRole("button", { name: "Paycheck", exact: true }).click();
  await expect(page.getByLabel("Annual gross wages")).toHaveValue("26910");
  await expect(page.getByLabel("Paid hours per week")).toHaveValue("30");
  await page
    .locator('input[type="file"]')
    .setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from('{"format":"something-else"}'),
    });
  await expect(page.getByRole("alert")).toContainText(
    "Your current plan has been kept",
  );
  await expect(page.getByLabel("Annual gross wages")).toHaveValue("26910");
  expect(errors).toEqual([]);
});

test("mobile students can directly edit a household and long names fit the paycheck", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/?example");
  await page
    .getByRole("button", { name: "Edit my choices", exact: true })
    .click();
  await page.getByLabel(/What should we call you/).fill("W".repeat(32));
  await page.getByLabel("What are you planning for?").selectOption("household");
  await page.getByLabel("Jump to a section").selectOption("11");
  await page
    .getByRole("button", { name: /Partner who works full-time/ })
    .click();
  await page.getByLabel("Other adult's annual gross wages").fill("40000");
  await page.getByLabel("Other adult: Transportation per month").fill("0");
  await page.getByRole("button", { name: "1 child", exact: false }).click();
  await page.getByLabel("Children's total childcare per month").fill("0");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  await page.getByRole("button", { name: "Done editing, see results" }).click();
  await expect(
    page.getByRole("heading", { name: "Household monthly plan" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Paycheck", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Simplified monthly paystub" }),
  ).toContainText("W".repeat(32));
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(320);
  expect(page.url()).not.toContain("example");
});

test("coverage dialogs restore focus and exclusions remain visible on the overview", async ({
  page,
}) => {
  await page.goto("/?example");
  await page.getByRole("button", { name: "Edit housing", exact: true }).click();
  const remove = page.getByRole("button", { name: "Remove", exact: true });
  await remove.click();
  await page.keyboard.press("Escape");
  await expect(remove).toBeFocused();
  await remove.click();
  await page.getByRole("button", { name: "Remove for scenario" }).click();
  await expect(
    page.getByRole("button", { name: "Restore", exact: true }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Done editing, see results" }).click();
  await page.getByLabel("Annual wage to compare").fill("100000");
  await expect(
    page.getByText("left after your plan", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Costs you left out" }),
  ).toBeVisible();
  await expect(
    page.getByText(/Removing a payment from a scenario/),
  ).toBeVisible();
});

test("unchanged family arrangements show zero difference and remain editable", async ({
  page,
}) => {
  await page.goto("/?example");
  await page.getByRole("button", { name: "Edit housing", exact: true }).click();
  await page.getByRole("button", { name: /Live with Family/ }).click();
  await page.getByLabel("Your monthly contribution at home").fill("1200");
  await page.getByRole("button", { name: "Done editing, see results" }).click();
  await page
    .getByRole("button", { name: "Compare living with family" })
    .click();
  await expect(page.getByLabel("Monthly contribution at home")).toHaveValue(
    "1200",
  );
  await expect(
    page.getByText(
      "This alternative has the same monthly cost as your current plan.",
    ),
  ).toBeVisible();
});

test("interest questions move keyboard focus to the newly rendered question", async ({
  page,
}) => {
  await page.goto("/?example");
  await page
    .getByRole("button", { name: "Edit my choices", exact: true })
    .click();
  await page.getByLabel("Jump to a section").selectOption("1");
  await page.locator("button[aria-pressed]").first().click();
  await expect(
    page.getByRole("heading", { name: "Best work environment for you?" }),
  ).toBeFocused();
  await page.getByLabel("Automatically move to the next question").uncheck();
  await page.locator("button[aria-pressed]").first().click();
  await expect(
    page.getByText("Question 2 of 6", { exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Next question" }).click();
  await expect(
    page.getByText("Question 3 of 6", { exact: true }),
  ).toBeVisible();
});
