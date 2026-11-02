# Design QA

**final result: passed**

## Target and scope

Selected option 1, with the user's explicit permission to improve colors, design, and other details. This is fidelity to the selected composition and learning outcome, with intentional product refinements, rather than pixel identity to illustrative sample data.

- Source visual truth: `docs/design/selected-reference.png` (original: `/workspace/generated_images/exec-2991190d-f7f2-4936-97d0-70b376b3ae89.png`).
- Implementation: `docs/design/results-desktop.png`; latest working captures under `.cache/screenshots/`.
- Browser: real headless Chromium at `/usr/bin/chromium`, driven by Playwright.
- State: Alex's completed personal-results view, with sample banner removed by editing the name and completing the plan. The source uses illustrative $3,300/$3,000 figures; implementation uses the actual seeded budget and tax calculation ($3,618/$3,364 rounded). These numeric differences are expected dynamic content.
- Source pixels: 1487 × 1058, normalized to 1440 × 1024 for comparison.
- Implementation CSS viewport: 1440 × 1024; `deviceScaleFactor: 1`. Full-page screenshot: 1440 × 1206. The combined first-viewport comparison crops to 1440 × 1024; the separate full-page capture documents the remaining source notes and navigation.
- Full-view comparison input: `.cache/qa/comparison-full.png`, showing source and implementation together.
- Focused comparison input: `.cache/qa/comparison-detail.png`, showing monthly-plan typography, chart, and legend labels together at readable scale.

## Findings and comparison history

1. **[P2, fixed] Initial desktop content was too narrow and secondary type too small.**
   - Evidence: `.cache/qa/iteration-1-full.png` and `iteration-1-detail.png` show the initial implementation beside the source. The content inset and small legend weakened the chosen hierarchy.
   - Fix: widened the shared header/results frame to 1376px including padding, refined header height, increased desktop heading/total/legend/comparison typography, and retained the source's two-column budget/comparison hierarchy.
   - Post-fix evidence: `.cache/qa/comparison-full.png` and `comparison-detail.png`. No remaining actionable issue in these regions.

2. **[P1, fixed] Choice buttons contained focusable native inputs.**
   - Evidence: the initial Axe housing scan flagged `nested-interactive` as serious. Negative tabindex and aria-hidden did not make the nested controls safe.
   - Fix: use one semantic button with `aria-pressed`, a visible selected/added text label, and a selected surface. Removed nested controls entirely. Native form fields remain separately labeled.
   - Post-fix evidence: `.cache/qa/accessibility.json` has no WCAG 2 A/AA or 2.1 AA violations on the five sampled screens. Coverage dialogs preserve native focus trapping and Escape behavior.

3. **[P2, fixed] Tablet comparison column became cramped.**
   - Evidence: `.cache/qa/results-tablet-iteration-2.png`, 834px viewport. The two-column panel wrapped its amount qualifier and gap label unnecessarily.
   - Fix: use the compact, stacked layout below 960px.
   - Post-fix evidence: `.cache/screenshots/results-tablet.png` (834 × 1194 CSS viewport, full-page capture 834 × 1536) and `docs/design/results-mobile.png` (390 × 844 CSS viewport, full-page capture 390 × 2072). No hidden controls or horizontal overflow in the tested mobile workflow.

## Required fidelity surfaces

- **Fonts and typography:** system-ui family throughout, strong compact display hierarchy, readable budget labels, tabular currency alignment, and native/inherited form fonts. The generated concept's exact raster font rendering is not a reproducible font specification; browser antialiasing differs naturally. Headings and amounts are intentionally smaller in the stacked layout.
- **Spacing and layout rhythm:** preserved open white page, restrained header, asymmetric budget/comparison columns, segmented spending bar, simple legend rules, trade-off row, and reflection/print section. Additional model disclosure and results navigation continue below the initial viewport. No nested dashboard cards or decorative feature inventory.
- **Colors and tokens:** retained blue/light-blue, green, navy, white, and dividers. Darkened amber to improve contrast. Semantic color is paired with explicit text, not used as the only indication of a gap or selection. Sampled screens pass automated contrast checks.
- **Image quality and assets:** the open-book mark was generated as an individual raster asset from the selected art direction, saved to `public/notebook-mark.png`, displayed with preserved aspect ratio, and embedded in the standalone artifact. No decorative assets remain as placeholders, CSS art, custom SVG, emoji, or text-glyph substitutes. Spending segments and legend swatches encode actual data. The print utility uses a text button rather than a decorative icon, consistent with the user-authorized simplification.
- **Copy and content:** retained the product's actual name rather than adopting the mockup's concept name as a new brand. Removed shame-based story language and unsupported career success claims. The salary comparison discloses its editable scenario and historical tax year. Local prices and wages remain explicitly unverified scenarios. Product screens do not expose development-tool failures; the README records the blocked fact-check.

## Browser and functional evidence

- 20 financial regression tests passed: marginal tax thresholds, payroll caps, salary inversion, savings, shared expenses, childcare scenarios, side income, loan amortization, and non-mutating alternatives.
- 6 browser tests passed: all 13 steps; coverage review and Escape; wage/career comparisons; mobile overflow and controls; print isolation and no browser storage; cancelling/confirming a personal-plan reset.
- No browser page errors in the capture workflow or standalone-artifact verification.
- Automated accessibility checks: welcome, overview, careers, paycheck, and housing; zero reported violations for selected WCAG tags. Evidence: `.cache/qa/accessibility.json`. This is not a complete WCAG conformance audit.
- Primary controls tested: both welcome CTAs, all required selections, loan input, roommate toggle, optional empty steps, side income, backward navigation, completed-step navigation, edit choices, restore/remove coverage, all result views, career wage transfer, annual/hourly input, family contribution, printing, and new-plan confirmation.
- Print: `.cache/screenshots/student-summary.pdf`, verified by `pdfinfo` as one A4 page for the tested plan. Actual printer/browser margins can vary.
- Standalone artifact: rendered from `dist/student-guide-artifact.jsx` without host CSS; embedded logo, mobile width, editable form, primary navigation, and console verified.

## Follow-up polish and limits

- No actionable P0/P1/P2 design findings remain in the tested scope.
- Screen-reader testing with students, 200% text zoom, and a full accessibility audit remain outside these automated checks.
- Current local prices, insurance quotes, childcare, and career wage examples still require independent verification. The historical model is not a verified current-year paycheck. This is a content validation limit, explicitly disclosed in the app, not a claim that live financial data was tested.
- Longer custom numeric values can increase text wrapping; the tested representative plans fit. The teacher should review final classroom examples before presenting them as facts.

## Implementation checklist

- [x] Source and implementation opened and compared in combined inputs.
- [x] Typography/layout and tablet findings corrected and recaptured.
- [x] Generated brand asset placed and artifact embedding checked.
- [x] Main student journey and result controls exercised in Chromium.
- [x] Accessibility finding corrected and checker rerun.
- [x] Build, standalone artifact, and one-page print verified.
- [x] Assumptions and remaining data-validation limits documented.
