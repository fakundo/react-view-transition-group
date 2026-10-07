import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Concurrent } from './examples/Concurrent';
import { LayoutSwitch } from './examples/LayoutSwitch';
import { Kanban } from './examples/Kanban';
import { Chat } from './examples/Chat';
import { Carousel } from './examples/Carousel';
import { CustomRoot } from './examples/CustomRoot';
import { BarChart } from './examples/BarChart';
import { SortableTable } from './examples/SortableTable';
import { EnterOnly } from './examples/EnterOnly';
import { Faq } from './examples/Faq';
import { Leaderboard } from './examples/Leaderboard';
import { ProductFilter } from './examples/ProductFilter';
import { QuickStart } from './examples/QuickStart';
import { ShuffleGrid } from './examples/ShuffleGrid';
import { Toasts } from './examples/Toasts';
import { TodoList } from './examples/TodoList';
import { Code, MotionContext } from './ui';
import './styles.css';

const COMPONENT_CODE = `
import { ViewTransitionGroup } from 'react-view-transition-group';

<ViewTransitionGroup as="ul">
  {items.map((item) => (
    <li key={item.id}>{item.text}</li>
  ))}
</ViewTransitionGroup>
`;

const HOOK_CODE = `
import { useViewTransitionGroup } from 'react-view-transition-group';

const [listRef, startTransition] = useViewTransitionGroup<HTMLUListElement>();

const remove = (id: string) => {
  startTransition(() => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  });
};

<ul ref={listRef}>
  {items.map((item) => (
    <li key={item.id}>{item.text}</li>
  ))}
</ul>
`;

const CSS_CODE = `
/* every child of a group: how it moves and resizes */
::view-transition-group(.vtg-child) {
  animation-duration: 0.4s;
  animation-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
}

/* a child that only exists in the new state: enter */
::view-transition-new(.vtg-child):only-child {
  animation: fade-in 0.3s both;
}

/* a child that only exists in the old state: exit */
::view-transition-old(.vtg-child):only-child {
  animation: fade-out 0.2s both;
}

/* the group root itself (its own background and borders) */
::view-transition-group(.vtg-root) {
  animation-duration: 0.4s;
}

/* keep wheel scrolling a group that is its own scroll container during a transition */
::view-transition {
  pointer-events: none;
}

/* the component sets the types add, remove and move: e.g. a slower reorder */
.list:active-view-transition-type(move)::view-transition-group(.vtg-child) {
  animation-duration: 0.6s;
}
`;

interface ApiRow {
  name: string;
  type?: string;
  defaultValue?: string;
  description: React.ReactNode;
}

const COMMON_OPTIONS: ApiRow[] = [
  {
    name: 'childVtClass',
    type: 'string',
    defaultValue: "'vtg-child'",
    description: (
      <>
        <code>view-transition-class</code> of every child.
      </>
    ),
  },
  {
    name: 'rootVtClass',
    type: 'string',
    defaultValue: "'vtg-root'",
    description: (
      <>
        <code>view-transition-class</code> of the root.
      </>
    ),
  },
  {
    name: 'disabled',
    type: 'boolean',
    defaultValue: 'false',
    description: 'Updates run without a transition.',
  },
  {
    name: 'respectReducedMotion',
    type: 'boolean',
    defaultValue: 'true',
    description: (
      <>
        Updates run without a transition when the user prefers reduced motion. Better than a
        transition with no animation: it would block clicks in the group.
      </>
    ),
  },
  {
    name: 'onTransitionStart',
    type: '(transition: ViewTransition) => void',
    description: 'A transition has started.',
  },
  {
    name: 'onTransitionEnd',
    type: '(transition: ViewTransition) => void',
    description: 'A transition has ended: finished, interrupted by a newer one or aborted.',
  },
];

const COMPONENT_PROPS: ApiRow[] = [
  {
    name: 'as',
    type: 'ElementType',
    defaultValue: "'div'",
    description: 'Root element or component. A component must forward ref to a DOM element.',
  },
  ...COMMON_OPTIONS,
  { name: '…', description: 'Other props and ref go to the root element.' },
];

const HOOK_RESULT: ApiRow[] = [
  { name: 'rootRef', description: 'Ref for the element whose direct children are animated.' },
  {
    name: 'startTransition(update, { types }?)',
    type: 'ViewTransition | null',
    description: (
      <>
        Runs <code>update</code> (your <code>setState</code> calls) inside a view transition of the
        root and returns it. A new call interrupts the running transition. <code>types</code> are
        matched by <code>:active-view-transition-type()</code>. Returns <code>null</code> when the
        update ran at once: no browser support, <code>disabled</code> or reduced motion.
      </>
    ),
  },
];

const ApiTable = (props: { rows: ApiRow[] }) => (
  <div className="table-scroll">
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Type</th>
          <th>Default</th>
          <th>Description</th>
        </tr>
      </thead>
      <tbody>
        {props.rows.map((row) => (
          <tr key={row.name}>
            <td>
              <code>{row.name}</code>
            </td>
            <td>{row.type && <code>{row.type}</code>}</td>
            <td>{row.defaultValue && <code>{row.defaultValue}</code>}</td>
            <td>{row.description}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const INSTALL_CODE = 'npm install react-view-transition-group';

const SECTIONS = [
  { id: 'start', title: 'Getting started' },
  { id: 'examples', title: 'Examples' },
  { id: 'how', title: 'How it works' },
  { id: 'api', title: 'API' },
  { id: 'styling', title: 'Styling' },
  { id: 'support', title: 'Browser support' },
  { id: 'limitations', title: 'Limitations' },
];

const COMPAT_URL =
  'https://developer.mozilla.org/en-US/docs/Web/API/Element/startViewTransition#browser_compatibility';

const isSupported = typeof Element !== 'undefined' && 'startViewTransition' in Element.prototype;

const SupportBadge = () =>
  isSupported ? (
    <p className="badge ok">✓ Your browser supports element-scoped view transitions</p>
  ) : (
    <p className="badge warn">
      Your browser does not support element-scoped view transitions: the examples update without
      animation. See <a href="#support">Browser support</a>.
    </p>
  );

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/** The choice "Play animations anyway" is kept between visits */
const FORCED_MOTION_KEY = 'play-animations-anyway';

/** Storage can be unavailable, e.g. blocked by the browser */
const readForcedMotion = () => {
  try {
    return localStorage.getItem(FORCED_MOTION_KEY) === 'true';
  } catch {
    return false;
  }
};

const saveForcedMotion = (forced: boolean) => {
  try {
    if (forced) {
      localStorage.setItem(FORCED_MOTION_KEY, 'true');
    } else {
      localStorage.removeItem(FORCED_MOTION_KEY);
    }
  } catch {
    // The choice lasts until the page is reloaded
  }
};

/** The examples respect reduced motion, but the visitor can play the animations anyway */
const MotionNotice = (props: { forced: boolean; onForcedChange: (forced: boolean) => void }) => {
  const [reduced, setReduced] = useState(() => window.matchMedia(REDUCED_MOTION_QUERY).matches);

  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION_QUERY);
    const onChange = () => {
      setReduced(query.matches);
    };
    query.addEventListener('change', onChange);
    return () => {
      query.removeEventListener('change', onChange);
    };
  }, []);

  if (!reduced) {
    return null;
  }

  return (
    <p className="badge warn motion-notice">
      Reduced motion is on in your system settings (on Windows: “Show animations in Windows”), so
      the examples update without animation.
      <label className="switch">
        <input
          type="checkbox"
          checked={props.forced}
          onChange={(event) => {
            props.onForcedChange(event.target.checked);
          }}
        />
        Play animations anyway
      </label>
    </p>
  );
};

const Page = () => {
  const [forcedMotion, setForcedMotion] = useState(readForcedMotion);

  const changeForcedMotion = (forced: boolean) => {
    setForcedMotion(forced);
    saveForcedMotion(forced);
  };
  return (
    <MotionContext value={!forcedMotion}>
      <header className="hero">
        <p className="eyebrow">react-view-transition-group</p>
        <h1>ViewTransitionGroup</h1>
        <p className="lead">
          Animate React children as they are added, removed, moved and resized — with native,
          element-scoped View Transitions. No measuring, no animation library, a few lines of CSS.
        </p>
        <SupportBadge />
        <MotionNotice forced={forcedMotion} onForcedChange={changeForcedMotion} />
        <nav className="toc" aria-label="Contents">
          {SECTIONS.map((section) => (
            <a key={section.id} href={`#${section.id}`}>
              {section.title}
            </a>
          ))}
        </nav>
      </header>

      <main>
        <section id="start">
          <h2>Getting started</h2>
          <Code lang="bash">{INSTALL_CODE}</Code>
          <p>
            There are two ways to use it. <strong>The component</strong> is the simplest: put your
            list inside it and change the children as usual.
          </p>
          <Code>{COMPONENT_CODE}</Code>
          <p>
            <strong>The hook</strong> gives full control: wrap the state update that changes the
            list in <code>startTransition</code>, and attach the ref to the list element.
          </p>
          <Code>{HOOK_CODE}</Code>
        </section>

        <section id="examples">
          <h2>Examples</h2>
          <p>
            Every example is live. Open <em>Source</em> under an example to see how it is built.
          </p>
          <div className="examples">
            <QuickStart />
            <TodoList />
            <ShuffleGrid />
            <Leaderboard />
            <Faq />
            <Toasts />
            <EnterOnly />
            <ProductFilter />
            <LayoutSwitch />
            <Kanban />
            <Chat />
            <Carousel />
            <CustomRoot />
            <BarChart />
            <SortableTable />
            <Concurrent />
          </div>
        </section>

        <section id="how">
          <h2>How it works</h2>
          <ol className="steps">
            <li>
              <strong>Name the children.</strong> Every direct child of the root gets{' '}
              <code>view-transition-name: match-element</code> and your{' '}
              <code>view-transition-class</code>. The name follows the DOM node, so a child that
              React keeps is the same group in both snapshots.
            </li>
            <li>
              <strong>Start the transition.</strong> <code>root.startViewTransition()</code> takes a
              snapshot of the root and of every child, as they are now.
            </li>
            <li>
              <strong>Update.</strong> In the transition callback your update runs with{' '}
              <code>flushSync</code>, so React commits the new list right away.
            </li>
            <li>
              <strong>Animate.</strong> The browser compares the snapshots: children in both move
              and resize, new ones enter, missing ones exit. Names are removed when the transition
              ends.
            </li>
          </ol>
          <div className="compare">
            <div>
              <h3>Component</h3>
              <ul>
                <li>No changes in your state code</li>
                <li>Animates changes of keys and order</li>
                <li>New children appear one frame later</li>
                <li>Same keys, new content: updates at once</li>
              </ul>
            </div>
            <div>
              <h3>Hook</h3>
              <ul>
                <li>
                  Wrap updates in <code>startTransition</code>
                </li>
                <li>Animates any change: keys, order, size, content</li>
                <li>The old snapshot is the real old DOM</li>
                <li>Every child renders once per update</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="api">
          <h2>API</h2>
          <h3>
            <code>&lt;ViewTransitionGroup&gt;</code>
          </h3>
          <ApiTable rows={COMPONENT_PROPS} />
          <p>
            Every transition of the component gets types from the change of keys: <code>add</code>{' '}
            (new keys), <code>remove</code> (keys are gone) and <code>move</code> (the kept keys
            changed their order). Match them in CSS with <code>:active-view-transition-type()</code>{' '}
            on the root.
          </p>

          <h3>
            <code>useViewTransitionGroup(options?)</code>
          </h3>
          <p>
            Returns <code>[rootRef, startTransition]</code>. Options are the same as the component
            props, without <code>as</code>.
          </p>
          <ApiTable rows={HOOK_RESULT} />
        </section>

        <section id="styling">
          <h2>Styling</h2>
          <p>
            The library has no CSS of its own: animations are set with the view transition
            pseudo-elements and the classes from <code>childVtClass</code> and{' '}
            <code>rootVtClass</code>. A good starting point:
          </p>
          <Code lang="css">{CSS_CODE}</Code>
        </section>

        <section id="support">
          <h2>Browser support</h2>
          <p>
            The library is built on element-scoped View Transitions (
            <code>element.startViewTransition()</code>). Browsers without them run the same update
            at once, without animation: nothing breaks, the React code stays the same.
          </p>
          <p>
            Which browsers support them: see the{' '}
            <a href={COMPAT_URL}>browser compatibility table on MDN</a>.
          </p>
        </section>

        <section id="limitations">
          <h2>Limitations</h2>
          <ul className="notes">
            <li>
              Every child must render <strong>exactly one element</strong>: no fragments, text or{' '}
              <code>null</code>. Use stable <code>key</code>s.
            </li>
            <li>
              Children of different groups do not animate between groups: each group is its own
              transition.
            </li>
            <li>
              <strong>No clicks during a transition:</strong> the browser leaves the group and all
              of its children out of hit testing until the transition ends, so a quick second click
              inside the group is lost. Keep the animations short. A group that is its own scroll
              container also ignores the wheel, unless <code>::view-transition</code> has{' '}
              <code>pointer-events: none</code> (see Styling).
            </li>
            <li>
              Nested groups and groups in scroll containers work: transitions run independently and
              are clipped by the scroll container.
            </li>
            <li>
              The root can not be a table row group: the browser does not run a transition on a{' '}
              <code>&lt;tbody&gt;</code> with the table layout. Lay the table out with CSS grid
              instead (see Sortable table).
            </li>
          </ul>
        </section>
      </main>

      <footer className="footer">react-view-transition-group · MIT</footer>
    </MotionContext>
  );
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
