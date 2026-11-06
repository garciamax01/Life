import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

const downloadPlan = async (page) => {
  const pending = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Save progress", exact: true })
    .click();
  const file = await pending;
  return {
    path: await file.path(),
    saved: JSON.parse(await readFile(await file.path(), "utf8")),
  };
};

test("the first plan and prediction survive revisions, reflection, printing and file restore", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/?example");
  await expect(page.getByText("Your first guess:")).toContainText("$40,000");
  const first = await downloadPlan(page);
  expect(first.saved.plan.originalPlan.housing).toBe("studio");
  await page.getByRole("button", { name: "Edit housing", exact: true }).click();
  await page.getByRole("button", { name: /Live with Family/ }).click();
  await page.getByLabel("Your monthly contribution at home").fill("300");
  await page.getByRole("button", { name: "Done editing, see results" }).click();
  const table = page.getByRole("table", {
    name: "Your original and current plans",
  });
  await expect(table.getByRole("row", { name: /Monthly plan/ })).toContainText(
    "$3,618",
  );
  await expect(table.getByRole("row", { name: /Monthly plan/ })).toContainText(
    "$2,431",
  );
  await page.getByRole("button", { name: "Write my next step" }).click();
  await page
    .getByLabel("The expense that surprised me most was…")
    .fill("Car costs include much more than the payment.");
  await page
    .getByLabel("The choice I would change is… because…")
    .fill("I would share housing to leave room for savings.");
  await page
    .getByLabel("One step I can take now is…")
    .fill("Ask about the requirements for a local apprenticeship.");
  await expect(page.getByRole("status")).toContainText(
    "3 of 3 reflections written",
  );
  const saved = await downloadPlan(page);
  expect(saved.saved.plan.originalPlan).toEqual(first.saved.plan.originalPlan);
  expect(saved.saved.plan.housing).toBe("family");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(
    page.getByRole("heading", { name: "Alex's next chapter" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("article")
      .getByText("Ask about the requirements for a local apprenticeship.", {
        exact: true,
      }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await page.goto("/");
  await page.locator('input[type="file"]').setInputFiles(saved.path);
  await expect(page.getByLabel("One step I can take now is…")).toHaveValue(
    "Ask about the requirements for a local apprenticeship.",
  );
  const reloaded = await downloadPlan(page);
  expect(reloaded.saved.plan.originalPlan).toEqual(
    first.saved.plan.originalPlan,
  );
  expect(errors).toEqual([]);
});

test("a real posting retains its source and uses the entered paid schedule", async ({
  page,
}) => {
  await page.goto("/?example");
  await page
    .getByRole("button", { name: "Use a real job posting", exact: true })
    .click();
  const panel = page.locator("details").filter({
    has: page.locator("summary", { hasText: "Use a real job posting" }),
  });
  await panel.locator("summary").click();
  const apply = page.getByRole("button", { name: "Test this posting" });
  await expect(apply).toBeDisabled();
  await page
    .getByLabel("Job title", { exact: true })
    .fill("Apprentice test fixture");
  await page
    .getByLabel("Employer or teacher-provided source")
    .fill("Teacher-provided test posting");
  await page
    .getByLabel("Posting link (optional)")
    .fill("https://example.com/test-posting");
  await page.getByLabel("Date you checked the posting").fill("2026-11-01");
  await page.getByLabel("Pay listed in the posting").fill("22.50");
  await page.getByLabel("Job's paid hours per week").fill("30");
  await page.getByLabel("Job's paid weeks per year").fill("50");
  await page
    .getByLabel("Where did this schedule come from?")
    .selectOption("stated");
  await page
    .getByLabel("Training or credential required (optional)")
    .fill("Check apprenticeship entry requirements.");
  await page
    .getByLabel("Benefits and eligibility (optional)")
    .fill("Ask when health coverage starts.");
  await expect(apply).toBeEnabled();
  await apply.click();
  await expect(page.getByLabel("Annual gross wages")).toHaveValue("33750");
  await expect(page.getByLabel("Paid hours per week")).toHaveValue("30");
  await expect(page.getByLabel("Paid weeks per year")).toHaveValue("50");
  const record = await downloadPlan(page);
  expect(record.saved.plan.jobSource).toBe("Teacher-provided test posting");
  expect(record.saved.plan.jobReviewed).toBe("2026-11-01");
  expect(record.saved.plan.jobBenefits).toBe(
    "Ask when health coverage starts.",
  );
});

test("starting cash and an hours challenge are separate from the monthly plan and wage", async ({
  page,
}) => {
  await page.goto("/?example");
  const panel = page.locator("details").filter({
    has: page.locator("summary", { hasText: "Cash needed to get started" }),
  });
  await expect(panel).not.toHaveAttribute("open");
  await panel.locator("summary").click();
  await expect(panel).toContainText("Fill all four setup amounts");
  await page.getByLabel("Housing deposit or home purchase cash").fill("1350");
  await page.getByLabel("Basic furnishings and household supplies").fill("500");
  await page.getByLabel("Moving and utility setup fees").fill("150");
  await page.getByLabel("Transportation purchase or down payment").fill("0");
  await page.getByLabel("Money already set aside (optional)").fill("1000");
  await expect(panel.getByText("First month + setup:")).toContainText("$5,618");
  await expect(panel.getByText("Still to set aside:")).toContainText("$4,618");
  const challenge = page.locator("details").filter({
    has: page.locator("summary", {
      hasText: "Try an hours-change challenge",
    }),
  });
  await expect(challenge).not.toHaveAttribute("open");
  await challenge.locator("summary").click();
  await expect(page.getByLabel("Challenge: paid hours per week")).toHaveValue(
    "30",
  );
  await expect(challenge).toContainText("$37,500");
  await page.getByLabel("Challenge: paid hours per week").fill("0");
  await expect(challenge).toContainText("$0");
  await expect(page.getByLabel("Annual wage to compare")).toHaveValue("50000");
  await expect(
    page.getByRole("region", { name: "Your monthly plan" }),
  ).toContainText("$3,618");
});

test("new learning screens and expanded panels fit a 320-pixel phone", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await page.goto("/?example");
  const checkWidth = async () =>
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(320);
  await checkWidth();
  await page
    .locator("summary", { hasText: "Cash needed to get started" })
    .click();
  await checkWidth();
  await page
    .locator("summary", { hasText: "Try an hours-change challenge" })
    .click();
  await checkWidth();
  await page.getByRole("button", { name: "Write my next step" }).click();
  await page
    .getByLabel("One step I can take now is…")
    .fill("Research local training.");
  await checkWidth();
  await page.getByRole("button", { name: "Careers", exact: true }).click();
  await page.locator("summary", { hasText: "Use a real job posting" }).click();
  await checkWidth();
});
