import { mkdir, writeFile } from "node:fs/promises";

const rawCmsApiUrl = process.env.CMS_API_URL?.trim();
if (!rawCmsApiUrl) {
  throw new Error(
    "CMS_API_URL is not set. Add it to GitHub repository Actions secrets.",
  );
}

let parsedCmsApiUrl;
try {
  parsedCmsApiUrl = new URL(rawCmsApiUrl);
} catch {
  throw new Error(
    "CMS_API_URL is invalid. Use the CMS base URL without quotes or /api/v1.",
  );
}

if (parsedCmsApiUrl.protocol !== "https:") {
  throw new Error("CMS_API_URL must start with https:// in production.");
}

const cmsApiUrl = parsedCmsApiUrl.href.replace(/\/$/, "");

await mkdir("dist/api", { recursive: true });
await writeFile(
  "dist/api/config.php",
  `<?php\nreturn ['cms_api_url' => ${JSON.stringify(cmsApiUrl)}];\n`,
  { encoding: "utf8", mode: 0o600 },
);
