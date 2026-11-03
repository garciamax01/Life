import { execFileSync } from "node:child_process";
import { readFile, readdir, mkdir, mkdtemp, rm } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const dist = join(root, "dist");
const git = (args, options = {}) =>
  execFileSync("git", args, { cwd: root, encoding: "utf8", ...options }).trim();
const origin = git(["remote", "get-url", "origin"]);
if (!/^https:\/\/github\.com\/garciamax01\/Life(?:\.git)?\/?$/i.test(origin)) {
  throw new Error("Publish only from the authorized garciamax01/Life origin.");
}
// Untracked local review evidence is not a build input or a public deliverable.
// Every tracked change and every other untracked file must be committed first.
const trackedChanges = git(["status", "--porcelain", "--untracked-files=no"]);
const untrackedInputs = git([
  "ls-files",
  "--others",
  "--exclude-standard",
  "-z",
])
  .split("\0")
  .filter((path) => path && !path.startsWith("docs/reviews/"));
if (trackedChanges || untrackedInputs.length) {
  throw new Error(
    "Commit the source changes before publishing so the release records an exact source revision.",
  );
}
await readFile(join(dist, "index.html"));
const remote = git(["ls-remote", "--heads", "origin", "refs/heads/gh-pages"]);
let parent;
if (remote) {
  git(["fetch", "origin", "refs/heads/gh-pages"]);
  parent = git(["rev-parse", "FETCH_HEAD"]);
  const marker = JSON.parse(
    git(["show", `${parent}:.student-guide-release.json`]),
  );
  if (marker.app !== "what-will-your-life-cost")
    throw new Error(
      "The Pages branch belongs to another site. Refusing to overwrite it.",
    );
}
const source = git(["rev-parse", "HEAD"]);
await mkdir(join(root, ".cache"), { recursive: true });
const temporary = await mkdtemp(join(root, ".cache", "pages-publish-"));
const env = { ...process.env, GIT_INDEX_FILE: join(temporary, "index") };
try {
  git(["read-tree", "--empty"], { env });
  const add = (path, contents) => {
    const blob = git(["hash-object", "-w", "--stdin"], { input: contents });
    git(["update-index", "--add", "--cacheinfo", `100644,${blob},${path}`], {
      env,
    });
  };
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile())
        add(relative(dist, path).replaceAll("\\", "/"), await readFile(path));
      else throw new Error("Unexpected non-file in build output.");
    }
  };
  await walk(dist);
  add(".nojekyll", "");
  add(
    ".student-guide-release.json",
    JSON.stringify({ app: "what-will-your-life-cost", source }, null, 2) + "\n",
  );
  const tree = git(["write-tree"], { env });
  const args = ["commit-tree", tree];
  if (parent) args.push("-p", parent);
  args.push("-m", `Publish student guide from ${source.slice(0, 12)}`);
  const commit = git(args);
  git(["push", "origin", `${commit}:refs/heads/gh-pages`], {
    stdio: ["ignore", "pipe", "inherit"],
  });
  console.log(
    `Uploaded prebuilt Pages site at commit ${commit}. Pages must be enabled in repository settings before the website is live.`,
  );
} finally {
  await rm(temporary, { recursive: true, force: true });
}
