import { describe, it, expect } from "vitest";
import {
  taxBreakdown,
  takeHome,
  salaryNeeded,
  loanPayment,
  budget,
  scenarioBudget,
  matchCareers,
  parseSavedPlan,
  serializePlan,
} from "../src/App.jsx";

const plan = (patch = {}) => ({
  name: "Sam",
  grade: "12th",
  plan: "work",
  pers: ["R", "R", "R", "R", "R", "R"],
  housing: "studio",
  roommate: false,
  homeContribution: 300,
  fireRisk: "std",
  rOut: false,
  hOut: false,
  utils: [],
  food: "home",
  trans: "used",
  ciOut: false,
  crOut: false,
  health: "employer",
  hlOut: false,
  hadd: [],
  leisure: [],
  cloth: null,
  care: null,
  misc: [],
  htype: "solo",
  kids: "none",
  savings: "none",
  loan: 0,
  hustle: 0,
  ...patch,
});

describe("2024 historical teaching tax model, before credits", () => {
  it("does not tax negative or zero income", () => {
    expect(takeHome(-100)).toBe(0);
    expect(Object.values(taxBreakdown(0)).every((n) => n === 0)).toBe(true);
    expect(salaryNeeded(0)).toBe(0);
  });
  it("applies the federal marginal brackets rather than one rate to all income", () => {
    expect(taxBreakdown(26200).federal).toBeCloseTo(1160, 8);
    expect(taxBreakdown(61750).federal).toBeCloseTo(5426, 8);
    expect(
      taxBreakdown(61751).federal - taxBreakdown(61750).federal,
    ).toBeCloseTo(0.22, 8);
  });
  it("uses the 2024 California deduction and marginal thresholds", () => {
    expect(taxBreakdown(5540).california).toBe(0);
    expect(taxBreakdown(31039).california).toBeCloseTo(402.42, 8);
    expect(
      taxBreakdown(31040).california - taxBreakdown(31039).california,
    ).toBeCloseTo(0.04, 8);
  });
  it("caps Social Security but leaves 2024 SDI uncapped", () => {
    expect(taxBreakdown(250000).socialSecurity).toBeCloseTo(10453.2, 8);
    expect(taxBreakdown(250000).sdi).toBeCloseTo(2750, 8);
    expect(taxBreakdown(250000).medicare).toBeCloseTo(4075, 8);
  });
  it.each([500, 2000, 5000, 15000, 50000, 1000000])(
    "solves wages that actually cover %s monthly take-home",
    (monthly) => {
      const wages = salaryNeeded(monthly);
      expect(takeHome(wages) / 12).toBeGreaterThanOrEqual(monthly);
      expect(takeHome(wages - 1) / 12).toBeLessThan(monthly);
    },
  );
});

describe("one consistent monthly budget", () => {
  it("includes insurance, fuel, registration, and repairs beyond the car payment", () => {
    expect(budget(plan()).expenses).toBe(2656);
  });
  it("saves a percentage of take-home, not a percentage of expenses", () => {
    const b = budget(plan({ savings: "s10" }));
    expect(b.total).toBeCloseTo(2656 / 0.9, 8);
    expect(b.savings / b.total).toBeCloseTo(0.1, 8);
    expect(b.lines.reduce((n, l) => n + l.amount, 0)).toBeCloseTo(b.total, 8);
    expect(b.groups.reduce((n, g) => n + g, 0)).toBeCloseTo(b.total, 8);
  });
  it("splits only shared housing and utility costs, without double-splitting", () => {
    const utils = ["internet", "mobile", "water_gas", "electric", "stream"];
    const original = budget(plan({ utils }));
    const shared = budget(plan({ utils, roommate: true }));
    expect(original.total).toBe(3106);
    expect(shared.total).toBe(2258.5);
    expect(
      shared.lines.find((l) => l.label === "Mobile Phone Plan").amount,
    ).toBe(60);
    expect(
      budget(plan({ utils, roommate: true, htype: "partner_work" })).total,
    ).toBe(shared.total);
  });
  it("does not carry old insurance removals into an unrelated housing or vehicle choice", () => {
    expect(
      budget(plan({ housing: "family", homeContribution: 300, rOut: false }))
        .total,
    ).toBe(
      budget(plan({ housing: "family", homeContribution: 300, rOut: true }))
        .total,
    );
    expect(
      budget(plan({ trans: "transit", ciOut: true, crOut: true })).total,
    ).toBe(budget(plan({ trans: "transit" })).total);
  });
  it("includes a non-earning partner's food, vehicle and healthcare, and removes daycare", () => {
    const working = budget(plan({ kids: "one" }));
    const atHome = budget(plan({ kids: "one", htype: "partner_home" }));
    expect(atHome.expenses - working.expenses).toBe(350 + 818 + 120 - 900);
    expect(
      atHome.lines.find((l) => l.label === "Other adult: transportation")
        .amount,
    ).toBe(818);
    expect(
      atHome.lines.some((l) => l.label === "Childcare (modeled share)"),
    ).toBe(false);
  });
  it("keeps side income out of the expense total and offsets required wage income once", () => {
    const original = budget(plan({ savings: "s10" }));
    const side = budget(plan({ savings: "s10", hustle: 1000 }));
    expect(side.total).toBe(original.total);
    expect(side.sideNet).toBe(1000);
    expect(side.mainNet).toBeCloseTo(original.total - 1000, 8);
    expect(takeHome(side.salary) / 12 + 1000).toBeGreaterThanOrEqual(
      side.total,
    );
  });
  it("does not charge a student loan after switching to a non-borrowing plan", () => {
    expect(budget(plan({ loan: 30000 })).total).toBe(budget(plan()).total);
    expect(
      budget(plan({ loan: 30000, plan: "4year" })).total - budget(plan()).total,
    ).toBeCloseTo(loanPayment(30000), 8);
  });
  it("models family contributions and alternative housing without mutating the original", () => {
    const a = plan();
    expect(scenarioBudget(a, "family", 300).total).toBe(budget(a).total - 1068);
    expect(scenarioBudget(a, "roommate").lines[0].amount).toBe(1050);
    expect(a.housing).toBe("studio");
    expect(a.roommate).toBe(false);
  });
  it("preserves the selected zero-childcare assumption when testing a roommate", () => {
    expect(
      scenarioBudget(
        plan({ kids: "one", htype: "partner_home" }),
        "roommate",
      ).lines.some((l) => l.label === "Childcare (modeled share)"),
    ).toBe(false);
  });
});

describe("student loan planning payment", () => {
  it("handles no loan and a zero-interest loan", () => {
    expect(loanPayment(0)).toBe(0);
    expect(loanPayment(1200, 0, 12)).toBe(100);
  });
  it("amortizes a $30,000, 6.5%, ten-year loan", () => {
    expect(loanPayment(30000)).toBeCloseTo(340.6439, 3);
  });
});

describe("clear household scope and realistic cost options", () => {
  it("counts shared bills once in a household and includes both adults' editable costs", () => {
    const b = budget(
      plan({
        budgetMode: "household",
        htype: "partner_work",
        partnerSalary: 40000,
        utils: ["internet", "mobile"],
        partnerFood: 400,
        partnerTransport: 0,
        partnerHealth: 200,
        partnerPersonal: 100,
        kids: "one",
      }),
    );
    const own = budget(plan({ utils: ["internet", "mobile"], kids: "one" }));
    expect(b.total - own.total).toBe(700);
    expect(b.partnerNet).toBeCloseTo(takeHome(40000) / 12, 8);
    expect(takeHome(b.salary) / 12 + b.partnerNet).toBeGreaterThanOrEqual(
      b.total,
    );
    expect(b.lines.find((l) => l.label === "Internet").amount).toBe(65);
  });
  it("supports custom shares without dividing family contributions again", () => {
    const b = budget(
      plan({
        personalHomeShare: 25,
        htype: "partner_work",
        kids: "one",
        childSharePercent: 75,
        childcareBudget: 400,
        childSuppliesBudget: 200,
      }),
    );
    expect(b.lines[0].amount).toBe(1350 * 0.25);
    expect(
      b.lines.find((l) => l.label === "Childcare (modeled share)").amount,
    ).toBe(300);
    expect(
      b.lines.find(
        (l) => l.label === "Children: food & supplies (modeled share)",
      ).amount,
    ).toBe(150);
    expect(
      budget(
        plan({
          housing: "family",
          homeContribution: 1200,
          personalHomeShare: 25,
        }),
      ).lines[0].amount,
    ).toBe(1200);
  });
  it("does not manufacture savings when an existing family arrangement is unchanged", () => {
    const a = plan({
      housing: "family",
      homeContribution: 1200,
      htype: "partner_work",
      kids: "one",
      personalHomeShare: 25,
    });
    expect(scenarioBudget(a, "family").total).toBe(budget(a).total);
    const b = scenarioBudget(a, "roommate");
    expect(
      b.lines.find((l) => l.label === "Childcare (modeled share)").amount,
    ).toBe(450);
  });
  it("supports covered meals and a paid-off car while retaining running costs", () => {
    expect(budget(plan({ food: "included" })).expenses).toBe(
      budget(plan()).expenses - 350,
    );
    const b = budget(plan({ trans: "paid" }));
    expect(b.lines.some((l) => l.label === "Gas")).toBe(true);
    expect(b.lines.some((l) => l.label === "Car insurance")).toBe(true);
    expect(b.lines.some((l) => /Maintenance/.test(l.label))).toBe(true);
    expect(b.expenses).toBeLessThan(budget(plan()).expenses);
  });
  it("counts a gym only once and distinguishes net from gross side income", () => {
    const once = budget(plan({ care: "full", leisure: [] }));
    const twice = budget(plan({ care: "full", leisure: ["gym"] }));
    expect(twice.total).toBe(once.total);
    expect(budget(plan({ hustle: 1000, hustleMode: "gross" })).sideNet).toBe(
      750,
    );
  });
  it("only calls positively connected careers matches, with all paths separately available", () => {
    const matches = matchCareers(["R", "R", "R", "R", "R", "R"]);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((c) => c.score > 0)).toBe(true);
    expect(matchCareers([], true).length).toBeGreaterThan(matches.length);
    expect(matchCareers([])).toEqual([]);
  });
});

describe("portable progress files", () => {
  it("round trips comparison and household inputs, including explicit zero and an unfinished quiz", () => {
    const source = parseSavedPlan(
      JSON.stringify({
        format: "life-student-guide",
        version: 1,
        plan: {
          name: "Sam",
          grade: "12th",
          plan: "work",
          pers: ["R", "A"],
          quizIndex: 1,
          comparisonSalary: 35880,
          comparisonHours: 30,
          whatIfContribution: 0,
          partnerFood: 0,
        },
      }),
    ).plan;
    const restored = parseSavedPlan(serializePlan(source, 1, "wizard"));
    expect(restored.plan).toEqual(source);
    expect(restored.step).toBe(1);
    expect(restored.screen).toBe("wizard");
  });
  it("rejects malformed, unsupported, oversized and out-of-range files", () => {
    expect(() => parseSavedPlan("bad JSON")).toThrow();
    expect(() => parseSavedPlan("x".repeat(500001))).toThrow();
    expect(() =>
      parseSavedPlan(JSON.stringify({ format: "other", version: 1, plan: {} })),
    ).toThrow();
    expect(() =>
      parseSavedPlan(
        JSON.stringify({
          format: "life-student-guide",
          version: 1,
          plan: { comparisonHours: 0 },
        }),
      ),
    ).toThrow();
  });
  it("keeps incomplete plans in the wizard instead of allowing incomplete results", () => {
    const restored = parseSavedPlan(
      JSON.stringify({
        format: "life-student-guide",
        version: 1,
        screen: "results",
        step: 12,
        plan: { name: "Sam" },
      }),
    );
    expect(restored.step).toBe(0);
    expect(restored.screen).toBe("wizard");
  });
});
