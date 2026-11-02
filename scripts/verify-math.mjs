import assert from 'node:assert/strict';
import { renderMarkdown } from '../src/lib/markdown.ts';

const fixtures = [
  String.raw`$\vec{v}_0$`,
  String.raw`$$
\begin{aligned}
\vec{v}_0 &= \vec{u} \\
\vec{x}_0 &= \vec{x}
\end{aligned}
$$`,
];

for (const markdown of fixtures) {
  const { code } = await renderMarkdown(markdown);

  assert.match(code, /class="katex"/, `KaTeX output missing for: ${markdown}`);
  assert.doesNotMatch(code, /katex-error/, `KaTeX error for: ${markdown}`);
  assert.match(code, /<mover/, `Vector accent missing for: ${markdown}`);
  assert.match(code, /<msub>/, `Subscript missing for: ${markdown}`);
}

const multiline = await renderMarkdown(fixtures[1]);
assert.match(multiline.code, /<mtable/, 'Multiline aligned output is missing');

console.log('KaTeX verification passed: vector, subscript, and multiline equations.');
