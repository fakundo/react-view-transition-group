import { createContext, useContext, useEffect, useState } from 'react';
import { highlight } from './highlight';
import type { CodeLang } from './highlight';

/** `respectReducedMotion` of every example: false when the visitor asked to play the animations */
export const MotionContext = createContext(true);

export const useRespectReducedMotion = () => useContext(MotionContext);

export interface ExampleProps {
  id: string;
  title: string;
  /** What the example shows */
  description: React.ReactNode;
  /** Tags under the title: component, hook, what is animated */
  tags: string[];
  code: string;
  /** CSS of the example, shown after the code */
  css?: string;
  children: React.ReactNode;
}

/** A demo card: title, description, live preview and the source */
export const Example = (props: ExampleProps) => (
  <section className="example" id={props.id}>
    <header className="example-header">
      <h3>
        <a href={`#${props.id}`}>{props.title}</a>
      </h3>
      <ul className="tags">
        {props.tags.map((tag) => (
          <li key={tag}>{tag}</li>
        ))}
      </ul>
    </header>
    <p className="example-description">{props.description}</p>
    <div className="preview">{props.children}</div>
    <details className="source">
      <summary>Source</summary>
      <Code>{props.code}</Code>
      {props.css && <Code lang="css">{props.css}</Code>}
    </details>
  </section>
);

type Tokens = Awaited<ReturnType<typeof highlight>>;

/** A code block: plain text first, highlighted when Shiki is loaded */
export const Code = (props: { children: string; lang?: CodeLang }) => {
  const { lang = 'tsx' } = props;
  const code = props.children.trim();
  const [tokens, setTokens] = useState<Tokens | null>(null);

  useEffect(() => {
    let active = true;
    highlight(code, lang).then((result) => {
      if (active) {
        setTokens(result);
      }
    });
    return () => {
      active = false;
    };
  }, [code, lang]);

  return (
    <pre className="code">
      <code>
        {tokens
          ? tokens.map((line, lineIndex) => (
              <span key={lineIndex} className="line">
                {line.map((token, tokenIndex) => (
                  <span key={tokenIndex} style={token.htmlStyle as React.CSSProperties}>
                    {token.content}
                  </span>
                ))}
                {lineIndex < tokens.length - 1 && '\n'}
              </span>
            ))
          : code}
      </code>
    </pre>
  );
};

/** A random integer in [min, max] */
export const randomInt = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

/** A shuffled copy (Fisher–Yates) */
export const shuffle = <T,>(items: T[]) => {
  const result = [...items];
  for (let index = result.length - 1; index > 0; index--) {
    const other = randomInt(0, index);
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
};
