import { createHighlighterCore } from 'shiki/core';
import type { ThemedToken } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

export type CodeLang = 'tsx' | 'css' | 'bash';

// Only the languages and themes of the docs: the full Shiki bundle is a few MB
const highlighterPromise = createHighlighterCore({
  langs: [
    import('shiki/langs/tsx.mjs'),
    import('shiki/langs/css.mjs'),
    import('shiki/langs/bash.mjs'),
  ],
  themes: [import('shiki/themes/github-light.mjs'), import('shiki/themes/github-dark.mjs')],
  engine: createJavaScriptRegexEngine(),
});

/**
 * Lines of tokens. Every token has `--shiki-light` and `--shiki-dark` colors in `htmlStyle`,
 * the theme is picked in CSS by `prefers-color-scheme`
 */
export const highlight = async (code: string, lang: CodeLang): Promise<ThemedToken[][]> => {
  const highlighter = await highlighterPromise;
  return highlighter.codeToTokens(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  }).tokens;
};
