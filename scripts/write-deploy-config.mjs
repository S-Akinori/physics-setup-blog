import { mkdir, writeFile } from "node:fs/promises";

const cmsApiUrl = process.env.CMS_API_URL?.replace(/\/$/, "");
if (!cmsApiUrl || !cmsApiUrl.startsWith("https://")) {
  throw new Error("CMS_API_URL must be an HTTPS URL.");
}

await mkdir("dist/api", { recursive: true });
await writeFile(
  "dist/api/config.php",
  `<?php\nreturn ['cms_api_url' => ${JSON.stringify(cmsApiUrl)}];\n`,
  { encoding: "utf8", mode: 0o600 },
);
