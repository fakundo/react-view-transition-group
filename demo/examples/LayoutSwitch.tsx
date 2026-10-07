import { useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
const [layout, setLayout] = useState<Layout>('grid');
const [cardsRef, startTransition] = useViewTransitionGroup<HTMLUListElement>({
  childVtClass: 'card',
});

// the keys stay the same: the hook animates any change made inside startTransition
const switchLayout = (next: Layout) => {
  startTransition(() => setLayout(next));
};

<ul ref={cardsRef} className={\`cards \${layout}\`}>
  {CARDS.map((card) => (
    <li key={card.id}>…</li>
  ))}
</ul>
`;

const CSS = `
/* the card changes its shape: show the snapshots at their size, do not stretch them */
::view-transition-old(.card),
::view-transition-new(.card) {
  height: 100%;
  object-fit: none;
  object-position: left top;
}
`;

type Layout = 'grid' | 'list';

const LAYOUTS: Layout[] = ['grid', 'list'];

const CARDS = [
  { id: 1, emoji: '🏔️', title: 'Mountains', text: 'Trails, lakes and cold mornings.' },
  { id: 2, emoji: '🏝️', title: 'Islands', text: 'Warm water and slow days.' },
  { id: 3, emoji: '🏙️', title: 'Cities', text: 'Museums, food and night walks.' },
  { id: 4, emoji: '🏜️', title: 'Deserts', text: 'Dunes, stars and silence.' },
  { id: 5, emoji: '🌲', title: 'Forests', text: 'Moss, mushrooms and fresh air.' },
  { id: 6, emoji: '🧊', title: 'Glaciers', text: 'Blue ice and long views.' },
];

export const LayoutSwitch = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [layout, setLayout] = useState<Layout>('grid');
  const [cardsRef, startTransition] = useViewTransitionGroup<HTMLUListElement>({
    respectReducedMotion,
    childVtClass: 'card',
  });

  const switchLayout = (next: Layout) => {
    startTransition(() => {
      setLayout(next);
    });
  };

  return (
    <Example
      id="layout-switch"
      title="Grid and list"
      tags={['hook', 'move', 'size']}
      description={
        <>
          The keys stay the same, only the class of the root changes: the cards move and change
          their shape. The component animates changes of keys only, the hook animates any change
          made inside <code>startTransition</code>.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div className="toolbar">
        {LAYOUTS.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={layout === option}
            onClick={() => switchLayout(option)}
          >
            {option === 'grid' ? 'Grid' : 'List'}
          </button>
        ))}
      </div>
      <ul ref={cardsRef} className={`cards ${layout}`}>
        {CARDS.map((card) => (
          <li key={card.id}>
            <span className="emoji">{card.emoji}</span>
            <div>
              <strong>{card.title}</strong>
              <p>{card.text}</p>
            </div>
          </li>
        ))}
      </ul>
    </Example>
  );
};
