import { test, expect } from "@playwright/test";

test("a student can complete all 13 steps and reach a coherent personal budget", async ({
  page,
}) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Build my plan", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Continue", exact: true }),
  ).toBeDisabled();
  await page.getByLabel(/What should we call you/).fill("Jordan");
  await page.getByLabel("Your first guess: annual salary needed").fill("42000");
  await page.getByLabel("Your grade").selectOption("12th");
  await page
    .getByRole("button", {
      name: "Trade school or apprenticeship",
      exact: true,
    })
    .click();
  await page.getByLabel(/How much might you borrow/).selectOption("30000");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  for (let i = 1; i <= 6; i++) {
    await expect(
      page.getByText(`Question ${i} of 6`, { exact: true }),
    ).toBeVisible();
    await page.locator("button[aria-pressed]").first().click();
  }
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Studio Apartment/ }).click();
  await page.getByRole("button", { name: /Share with one roommate/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click(); // no separate utility bill is valid
  await page.getByRole("button", { name: /Cook at Home/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Used Car.*3 to 5/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Employer Health Insurance/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click(); // optional leisure
  await page.getByRole("button", { name: /Basics Only/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Basics Only/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click(); // optional extras
  await page
    .getByRole("button", { name: /On my own or with roommates/ })
    .click();
  await page.getByRole("button", { name: /No children/ }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: /Save 10% of take-home/ }).click();
  await page.getByLabel(/Optional side income/).fill("500");
  await page
    .getByRole("button", { name: "See my results", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Your lifestyle, at a glance." }),
  ).toBeVisible();
  await expect(page.getByText(/Jordan, these are choices/)).toBeVisible();
  await expect(
    page.getByRole("group", { name: "Prediction and first result" }),
  ).toContainText("$42,000");
  await page.getByRole("button", { name: "Your budget", exact: true }).click();
  await expect(
    page.getByText("Student loan payment", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("General savings target (10% at required income)", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText(/Assumed net side income/)).toBeVisible();
  await page
    .getByRole("button", { name: "Edit my choices", exact: true })
    .click();
  await expect(page.getByLabel(/What should we call you/)).toHaveValue(
    "Jordan",
  );
  expect(errors).toEqual([]);
});

test("removing coverage requires a consequence review, and Escape preserves coverage", async ({
  page,
}) => {
  await page.goto("/?example");
  await page
    .getByRole("button", { name: "Edit my choices", exact: true })
    .click();
  await page.getByRole("button", { name: "03 Housing", exact: true }).click();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(
    "not a general California legal requirement",
  );
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(
    page.getByRole("button", { name: "Remove", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await page
    .getByRole("button", { name: "Remove for scenario", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Restore", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "13 Savings", exact: true }).click();
  await page
    .getByRole("button", { name: "See my results", exact: true })
    .click();
  await page.getByRole("button", { name: "Your budget", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Costs you left out" }),
  ).toBeVisible();
});

test("salary and career comparisons respond to inputs and keep the original budget", async ({
  page,
}) => {
  await page.goto("/?example");
  await page
    .getByRole("button", { name: "Explore career paths", exact: true })
    .click();
  await expect(page.getByRole("article")).toHaveCount(6);
  await page
    .getByRole("button", { name: "Test this wage", exact: true })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "What could your paycheck cover?" }),
  ).toBeVisible();
  await page.getByLabel("Annual gross wages").fill("0");
  await expect(
    page.getByRole("region", { name: "Simplified monthly paystub" }),
  ).toContainText("$0");
  await page.getByLabel("Annual gross wages").fill("100000");
  await expect(
    page.getByText("Left after living expenses and your savings target.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(
    page.getByText("left after your plan", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Compare living with family", exact: true })
    .click();
  await page.getByLabel("Monthly contribution at home").fill("1000");
  await expect(
    page.getByText(
      "less needed each month, including the adjusted savings goal.",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByRole("button", { name: "Overview", exact: true }).click();
  await expect(
    page.getByRole("region", { name: "Your monthly plan" }),
  ).toContainText("$3,618");
});

test("mobile flow fits the viewport and all primary controls remain usable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("button", { name: "Explore an example", exact: true })
    .click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("button", { name: "Try a roommate", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "Change one choice. See the difference.",
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page.getByRole("button", { name: "Paycheck", exact: true }).click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
  await page
    .getByRole("button", { name: "Edit my choices", exact: true })
    .click();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth),
  ).toBeLessThanOrEqual(390);
});

test("print summary is isolated, and answers never enter browser storage", async ({
  page,
}) => {
  await page.goto("/?example");
  await page.evaluate(() => window.dispatchEvent(new Event("beforeprint")));
  await expect(
    page.getByRole("heading", { name: "Alex's next chapter" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Your lifestyle, at a glance." }),
  ).not.toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event("afterprint")));
  await expect(
    page.getByRole("heading", { name: "Your lifestyle, at a glance." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => ({
      local: localStorage.length,
      session: sessionStorage.length,
    })),
  ).toEqual({ local: 0, session: 0 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Build my plan", exact: true })
    .click();
  await expect(page.getByLabel(/What should we call you/)).toHaveValue("");
});

test("a personal plan is preserved when a reset is cancelled", async ({
  page,
}) => {
  await page.goto("/?example");
  await page
    .getByRole("button", { name: "Edit my choices", exact: true })
    .click();
  await page.getByLabel(/What should we call you/).fill("Taylor");
  await page.getByRole("button", { name: "13 Savings", exact: true }).click();
  await page
    .getByRole("button", { name: "See my results", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Start a new plan", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Keep my plan", exact: true }).click();
  await expect(page.getByText(/Taylor, these are choices/)).toBeVisible();
  await page
    .getByRole("button", { name: "Start a new plan", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Continue", exact: true })
    .click();
  await expect(page.getByLabel(/What should we call you/)).toHaveValue("");
});
