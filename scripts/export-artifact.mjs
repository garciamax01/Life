import { readFile, writeFile } from "node:fs/promises";

const image = await readFile(
  new URL("../public/notebook-mark.png", import.meta.url),
);
const app = await readFile(new URL("../src/App.jsx", import.meta.url), "utf8");
await writeFile(
  new URL("../dist/student-guide-artifact.jsx", import.meta.url),
  app.replace(
    '"notebook-mark.png"',
    JSON.stringify(`data:image/png;base64,${image.toString("base64")}`),
  ),
);
console.log("Single-file React artifact: dist/student-guide-artifact.jsx");

// A plain browser-openable file for teachers and students, with no server,
// package installation, CDN, or JSX transpiler required.
const indexUrl = new URL("../dist/index.html", import.meta.url);
const html = await readFile(indexUrl, "utf8");
const script = html.match(
  /<script type="module" crossorigin src="([^"]+)"><\/script>/,
);
if (!script) throw new Error("Could not locate the built application script.");
let bundled = await readFile(
  new URL(`../dist/${script[1].replace(/^(\.\/|\/)/, "")}`, import.meta.url),
  "utf8",
);
if (!bundled.includes('"notebook-mark.png"'))
  throw new Error("Could not locate the logo in the built app.");
bundled = bundled.replace(
  '"notebook-mark.png"',
  JSON.stringify(`data:image/png;base64,${image.toString("base64")}`),
);
const portable = html.replace(
  script[0],
  () =>
    `<script type="module">${bundled.replace(/<\/script/gi, "<\\/script")}</script>`,
);
await writeFile(
  new URL("../dist/Student-Guide.html", import.meta.url),
  portable,
);
console.log("Open directly in a browser: dist/Student-Guide.html");
