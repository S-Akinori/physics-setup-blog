import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import {
  normalizeQiitaMarkdown,
  remarkQiitaCodeBlocks,
  remarkQiitaNotes,
} from "./qiita-markdown.ts";

const processor = await createMarkdownProcessor({
  remarkPlugins: [
    remarkGfm,
    remarkMath,
    remarkQiitaNotes,
    remarkQiitaCodeBlocks,
  ],
  rehypePlugins: [rehypeKatex],
  syntaxHighlight: "shiki",
});

export async function renderMarkdown(markdown: string) {
  return processor.render(normalizeQiitaMarkdown(markdown));
}
