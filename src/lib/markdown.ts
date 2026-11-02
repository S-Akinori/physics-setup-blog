import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

const processor = await createMarkdownProcessor({
  remarkPlugins: [remarkMath],
  rehypePlugins: [rehypeKatex],
  syntaxHighlight: "shiki",
});

export async function renderMarkdown(markdown: string) {
  return processor.render(markdown);
}
