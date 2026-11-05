type MarkdownNode = {
  type?: string;
  value?: string;
  lang?: string | null;
  children?: MarkdownNode[];
  data?: {
    hProperties?: Record<string, unknown>;
  };
};

const noteMarker = /^\[!QIITA-NOTE:(info|warn|alert)\]$/;
type NoteKind = "info" | "warn" | "alert";

function walk(node: MarkdownNode, visitor: (node: MarkdownNode) => void) {
  visitor(node);
  node.children?.forEach((child) => walk(child, visitor));
}

function toggleFence(line: string, fence: string | null) {
  const match = line.match(/^\s*(`{3,}|~{3,})/);
  if (!match) return fence;
  if (!fence) return match[1][0];
  return match[1][0] === fence ? null : fence;
}

/** Qiitaの:::noteをCommonMarkの引用へ正規化し、ASTプラグインで装飾する。 */
export function normalizeQiitaMarkdown(markdown: string) {
  const output: string[] = [];
  let fence: string | null = null;
  let noteKind: NoteKind | null = null;
  let noteFence: string | null = null;

  for (const line of markdown.replace(/\r\n?/g, "\n").split("\n")) {
    if (noteKind) {
      if (!noteFence && /^\s*:::\s*$/.test(line)) {
        noteKind = null;
        output.push("");
        continue;
      }

      output.push(line ? `> ${line}` : ">");
      noteFence = toggleFence(line, noteFence);
      continue;
    }

    if (!fence) {
      const note = line.match(/^\s*:::note(?:\s+(info|warn|alert))?\s*$/i);
      if (note) {
        noteKind = (note[1]?.toLowerCase() || "info") as NoteKind;
        output.push(`> [!QIITA-NOTE:${noteKind}]`, ">");
        continue;
      }
    }

    output.push(line);
    fence = toggleFence(line, fence);
  }

  return output.join("\n");
}

export function remarkQiitaNotes() {
  return (tree: MarkdownNode) => {
    walk(tree, (node) => {
      if (node.type !== "blockquote" || !node.children?.length) return;
      const markerParagraph = node.children[0];
      const markerText = markerParagraph.children?.[0]?.value?.trim() || "";
      const match = markerText.match(noteMarker);
      if (!match) return;

      node.children.shift();
      node.data = node.data || {};
      node.data.hProperties = {
        ...(node.data.hProperties || {}),
        className: ["qiita-note", `qiita-note-${match[1]}`],
        role: "note",
      };
    });
  };
}

export function remarkQiitaCodeBlocks() {
  return (tree: MarkdownNode) => {
    const transform = (parent: MarkdownNode) => {
      if (!parent.children) return;

      parent.children = parent.children.flatMap((node) => {
        transform(node);
        if (node.type !== "code" || !node.lang) return [node];

        const [language, ...titleParts] = node.lang.split(":");
        const title = titleParts.join(":").trim();
        node.lang = language.trim();
        if (!title) return [node];

        const titleNode: MarkdownNode = {
          type: "paragraph",
          children: [{ type: "text", value: title }],
          data: {
            hProperties: {
              className: ["qiita-code-title"],
            },
          },
        };
        return [titleNode, node];
      });
    };

    transform(tree);
  };
}
