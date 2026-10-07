// Test app for the e2e tests: groups with buttons and a log of transitions.
// URL params: `duration` — animation duration in ms, `respect=0` — respectReducedMotion: false
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ViewTransitionGroup, useViewTransitionGroup } from '../../src';

declare global {
  interface Window {
    /** Transition events of the groups, in order */
    vtLog: string[];
  }
}

window.vtLog = [];

const params = new URLSearchParams(window.location.search);
const duration = Number(params.get('duration') ?? 300);
const respectReducedMotion = params.get('respect') !== '0';

const range = (count: number) => Array.from({ length: count }, (_, index) => index + 1);
const rotate = (items: number[]) => [...items.slice(1), items[0]];

const log = (message: string) => {
  window.vtLog.push(message);
};

const HookList = () => {
  const [rootRef, startTransition] = useViewTransitionGroup<HTMLUListElement>({
    respectReducedMotion,
    onTransitionStart: () => {
      log('hook: start');
    },
    onTransitionEnd: () => {
      log('hook: end');
    },
  });
  const [items, setItems] = useState(range(6));
  const run = (next: (prev: number[]) => number[], types?: string[]) => {
    startTransition(
      () => {
        setItems(next);
      },
      { types },
    );
  };
  return (
    <section>
      <button id="hook-rotate" onClick={() => run(rotate, ['rotate'])}>
        rotate
      </button>
      <button id="hook-add" onClick={() => run((prev) => [...prev, Math.max(0, ...prev) + 1])}>
        add
      </button>
      <button id="hook-remove" onClick={() => run((prev) => prev.slice(1))}>
        remove
      </button>
      <ul ref={rootRef} id="hook-root" className="row">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
};

const ComponentList = () => {
  const [items, setItems] = useState(range(4));
  return (
    <section>
      <button
        id="component-add"
        onClick={() => setItems((prev) => [...prev, Math.max(0, ...prev) + 1])}
      >
        add
      </button>
      <button id="component-rotate" onClick={() => setItems(rotate)}>
        rotate
      </button>
      <ViewTransitionGroup
        as="ul"
        id="component-root"
        className="row"
        respectReducedMotion={respectReducedMotion}
      >
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ViewTransitionGroup>
    </section>
  );
};

const Inner = (props: { id: string }) => {
  const [rootRef, startTransition] = useViewTransitionGroup<HTMLUListElement>({
    respectReducedMotion,
  });
  const [items, setItems] = useState(range(3));
  return (
    <div className="card">
      <button id={`${props.id}-rotate`} onClick={() => startTransition(() => setItems(rotate))}>
        rotate {props.id}
      </button>
      <ul ref={rootRef} id={`${props.id}-root`} className="row">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

const Nested = () => {
  const [rootRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
    respectReducedMotion,
  });
  const [cards, setCards] = useState(['a', 'b']);
  return (
    <section>
      <button
        id="outer-rotate"
        onClick={() => startTransition(() => setCards((prev) => [...prev].reverse()))}
      >
        rotate cards
      </button>
      <div ref={rootRef} id="outer-root" className="row">
        {cards.map((card) => (
          <Inner key={card} id={card} />
        ))}
      </div>
    </section>
  );
};

const style = `
body { font: 14px system-ui; margin: 20px; }
section { margin-bottom: 24px; }
.row { display: flex; gap: 6px; margin: 8px 0; padding: 0; list-style: none; }
.row li { padding: 6px 10px; background: #cde; }
.card { padding: 8px; border: 1px solid #999; }
::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*) {
  animation-duration: ${duration}ms;
}
`;

createRoot(document.getElementById('root')!).render(
  <>
    <style>{style}</style>
    <HookList />
    <ComponentList />
    <Nested />
  </>,
);
