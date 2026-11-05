import { defineConfig } from "astro/config";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import {
  remarkQiitaCodeBlocks,
  remarkQiitaNotes,
} from "./src/lib/qiita-markdown.ts";

export default defineConfig({
  site: process.env.SITE_URL || "https://ryebourbon.xsrv.jp",
  output: "static",
  markdown: {
    remarkPlugins: [
      remarkGfm,
      remarkMath,
      remarkQiitaNotes,
      remarkQiitaCodeBlocks,
    ],
    rehypePlugins: [rehypeKatex],
    shikiConfig: { theme: "github-dark" },
  },
});
