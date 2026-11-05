import assert from "node:assert/strict";
import { renderMarkdown } from "../src/lib/markdown.ts";

const fixture = `
## Qiita互換

:::note warn
重要な補足です。
:::

\`\`\`js:sample.js
const answer = 42;
\`\`\`

| 左 | 右 |
| :-- | --: |
| A | B |

- [x] 完了
- [ ] 未完了

脚注です[^1]。

[^1]: 注釈内容

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
`;

const { code } = await renderMarkdown(fixture);

assert.match(code, /qiita-note qiita-note-warn/);
assert.match(code, /class="qiita-code-title">sample\.js<\/p>/);
assert.match(code, /<table>/);
assert.match(code, /contains-task-list/);
assert.match(code, /data-footnotes/);
assert.match(code, /data-language="mermaid"/);

console.log("Qiita-compatible Markdown rendering verified.");
