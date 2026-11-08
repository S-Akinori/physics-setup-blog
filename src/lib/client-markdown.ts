import DOMPurify from "dompurify";
import { Marked } from "marked";
import markedFootnote from "marked-footnote";
import markedKatex from "marked-katex-extension";
import { normalizeQiitaMarkdown } from "./qiita-markdown";

const markdown = new Marked().use(
  { gfm: true },
  markedFootnote({ description: "注釈", refMarkers: true }),
  markedKatex({ throwOnError: false, nonStandard: true }),
);

function prepareQiitaMarkup(container: HTMLElement) {
  container.querySelectorAll("blockquote").forEach((quote) => {
    const marker = quote.firstElementChild?.textContent
      ?.trim()
      .match(/^\[!QIITA-NOTE:(info|warn|alert)\]$/);
    if (!marker) return;
    quote.firstElementChild?.remove();
    quote.classList.add("qiita-note", `qiita-note-${marker[1]}`);
    quote.setAttribute("role", "note");
  });

  container.querySelectorAll("pre > code").forEach((code) => {
    const languageClass = [...code.classList].find((className) =>
      className.startsWith("language-"),
    );
    if (!languageClass) return;
    const languageInfo = languageClass.slice("language-".length);
    const [language, ...titleParts] = languageInfo.split(":");
    const title = titleParts.join(":").trim();
    code.classList.remove(languageClass);
    code.classList.add(`language-${language}`);
    if (title) code.parentElement?.setAttribute("data-code-title", title);
    if (language.toLowerCase() === "mermaid") {
      code.parentElement?.setAttribute("data-mermaid", "true");
    }
  });
}

async function renderMermaidBlocks(container: HTMLElement) {
  const blocks = [
    ...container.querySelectorAll<HTMLElement>(
      'pre[data-mermaid="true"], pre[data-language="mermaid"]',
    ),
  ];
  if (!blocks.length) return;

  const { default: mermaid } = await import("mermaid");
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: "strict",
    theme: "neutral",
  });

  for (const [index, block] of blocks.entries()) {
    const source = block.textContent || "";
    const wrapper = document.createElement("div");
    wrapper.className = "mermaid-diagram";
    try {
      const id = `mermaid-${Date.now()}-${index}`;
      const { svg, bindFunctions } = await mermaid.render(id, source);
      wrapper.innerHTML = DOMPurify.sanitize(svg, {
        USE_PROFILES: { svg: true, svgFilters: true },
      });
      block.replaceWith(wrapper);
      bindFunctions?.(wrapper);
    } catch {
      block.classList.add("mermaid-error");
    }
  }
}

export async function enhanceRenderedMarkdown(container: HTMLElement) {
  prepareQiitaMarkup(container);
  await renderMermaidBlocks(container);
}

export async function renderMarkdownInto(
  source: string,
  container: HTMLElement,
) {
  const rendered = await markdown.parse(normalizeQiitaMarkdown(source));
  container.innerHTML = DOMPurify.sanitize(rendered, {
    USE_PROFILES: { html: true },
  });
  await enhanceRenderedMarkdown(container);
}
