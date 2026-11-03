# What Will Your Life Cost?

A financial literacy activity for Max's high-school students in Perris, California. Students build a possible lifestyle across 13 steps, explore the required take-home pay, connect interests with careers, and compare alternatives.

## Run locally

Node 22.12+ is required; development was verified with Node 24.19.0 and npm 11.9.0.

```sh
npm ci
npm run dev -- --host 0.0.0.0 --port 4173 --strictPort
```

The welcome screen includes an example plan. `?example` also opens that clearly labeled sample directly. Answers live in React state only. Refreshing or closing the tab clears them. Save progress downloads a JSON file, and Open progress restores it without an account, browser storage or upload of student answers. The file contains the student’s name or nickname, choices and comparison inputs; keep it appropriately on shared devices.

## Build and use as a React artifact

```sh
npm run build
```

For the simplest way to open the app, download **`dist/Student-Guide.html`** and open it in Chrome, Edge, Firefox, or Safari. This is a complete browser app in one file, with React and the logo embedded. It does not need npm, a server, or an internet connection to run the activity. The research links still need internet access. An HTML download is not a public website link; hosting is a separate step.

`dist/` contains the static website. The same build writes **`dist/student-guide-artifact.jsx`**, a self-contained React file with a default `App` export, embedded logo, inline component styles, and imports from React only. The Vite, browser-test, formatting, and accessibility packages are development tools, not artifact dependencies. Do not paste a full replacement into chat when making changes: edit the relevant function in `src/App.jsx`, verify it, and regenerate the artifact.

The browser version has global keyboard-focus and page-reset styles in `index.html`; the artifact relies on native focus outlines and its inline styles. The print summary uses print lifecycle events to switch inline visibility, without a print stylesheet.

## Website publication

The prebuilt site is published to the `gh-pages` branch. Vite uses relative asset paths, supporting a project subdirectory such as `/Life/`. The Pages branch contains static files and a `.nojekyll` marker; a Node installation is not needed to serve the app.

One-time GitHub setup: in repository **Settings → Pages**, choose **Deploy from a branch**, select **gh-pages** and **/(root)**, and save. GitHub will build/deploy that branch. Uploading files does not enable Pages by itself, and publication is confirmed only after the site responds successfully.

Future releases should test and commit the source, then run `npm run publish:pages`. This builds the app and makes a fast-forward update of the `gh-pages` branch with the contents of `dist/`. The publisher refuses an unrecognized existing Pages branch and never force-pushes. Cloud environment publication and website publication are separate operations.

## Validation

```sh
npm test                 # 30 calculation/regression tests
npm run build            # Production bundle and standalone artifact
```

With the dev server running on port 4173 and Chromium installed at `/usr/bin/chromium`:

```sh
npm run test:e2e         # Complete journey, mobile, dialogs, wage edits, printing
npm run test:a11y        # Axe checks on five representative screens
node scripts/capture.mjs
```

Browser tests use local Chromium; change the executable path in the test configuration/scripts if the machine installs it elsewhere. Screenshots, accessibility evidence, and a one-page example PDF are generated under ignored `.cache/`. `design-qa.md` records the visual comparison against the selected concept. Automated checks do not replace testing with students or a complete accessibility audit.

## What changed from the pasted version

- Retained the 13-step journey and original choice data, with a new welcome screen, responsive layout, calmer language, and accessible button selections.
- Centralized expense line items so the breakdown, charts, required salary, paycheck comparison, and what-if scenarios use the same budget.
- Corrected savings to a percentage of required take-home, rather than a percentage of expenses.
- Added a default personal-share budget and an optional household plan with editable bill shares, other adult costs and wages, child cost shares, a contribution at home, paid-off vehicles, covered meals, medical reserves and student loan planning. Side income can be entered net or with an explicitly simplified gross reserve.
- Added a monthly paystub, editable wage comparison, interest-based career exploration, non-destructive alternatives, and a one-page printable reflection summary.
- Removed unsupported career success probabilities and salary-based bias from interest matching. Pay examples are labeled scenarios, with annual income examples and a practical next step.
- Corrected insurance wording: renter's insurance can be required by a lease; it is not a general legal requirement. Standard policies generally exclude floods. Health coverage penalties and eligibility are not calculated.

## Financial model and outstanding fact-check

**The cost presets support a Perris / Inland Empire classroom discussion and reflect local ballpark amounts supplied for the activity.** They are not a live database or personalized quotes. This release has not independently rechecked each price or career pay example. A BLS occupation link does not validate a displayed wage.

The historical **2024 single-filer** model uses federal deduction $14,600, California deduction $5,540, progressive brackets, Social Security at 6.2% up to $168,600, Medicare at 1.45% plus 0.9% over $200,000, and CA SDI at 1.1% without a wage cap. CA's additional 1% tax applies to taxable income above $1 million. The model excludes credits, payroll benefits, filing-status changes, and eligibility calculations. It is intentionally labeled 2024 throughout, rather than implying that it produces a current 2026 paycheck.

Savings: `required take-home = living expenses / (1 - savings rate)`. Student loans: a 6.5%, ten-year amortization scenario. Side income defaults to money already after expenses and taxes; an optional gross scenario reserves 25%, not an actual self-employment tax calculation. Personal mode includes the student’s assigned bills and excludes a working partner’s personal expenses and income. A non-earning partner adds editable personal costs. Household mode includes both adults and any other adult wage entered; each wage is estimated as a separate single filer. Childcare and supplies are editable, with an assigned share in personal mode. Dependent medical coverage must be included explicitly in medical reserves or the other adult healthcare amount. Read the in-app assumptions before using results in class.

An attempted read of the official FTB tax reference was denied by the cloud network proxy. Current local data and the historical tax parameters have **not been independently verified against live official sources in this task**. Follow-up work should verify the model and replace scenario prices/pay with dated evidence from IRS, FTB, EDD, BLS, actual listings, and quotes. Those destinations require access through environment network settings. No blocked destinations were bypassed.

## Boundaries preserved

No debt scenarios, local resource directory, retirement growth preview, parent mode, inflation section, or class-wide student data collection was added. Save/resume uses portable JSON files without browser storage. Printing provides a discussion summary. The monthly total and required annual wage are shown together; wage, schedule and alternative inputs survive edits and file restores.
