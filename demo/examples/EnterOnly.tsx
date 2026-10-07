import { useRef, useState } from 'react';
import { ViewTransitionGroup } from '../../src';
import { Example, randomInt, shuffle, useRespectReducedMotion } from '../ui';

const CODE = `
<ViewTransitionGroup as="ul" className="chips" childVtClass="chip">
  {chips.map((chip) => (
    <li key={chip.id}>{chip.label}</li>
  ))}
</ViewTransitionGroup>
`;

const CSS = `
/* everything jumps to the new state at once */
.chips::view-transition-group(*),
.chips::view-transition-new(*) {
  animation: none;
}

/* old snapshots are hidden: removed chips disappear at once */
.chips::view-transition-old(*) {
  animation: none;
  opacity: 0;
}

/* only new chips animate */
.chips::view-transition-new(.chip):only-child {
  animation: pop-in 0.4s both;
}
`;

const LABELS = ['react', 'css', 'html', 'svg', 'canvas', 'webgl', 'node', 'deno', 'vite', 'rust'];

interface Chip {
  id: number;
  label: string;
}

const createChip = (id: number): Chip => ({ id, label: LABELS[(id - 1) % LABELS.length] });

const INITIAL_CHIPS = Array.from({ length: 5 }, (_, index) => createChip(index + 1));

export const EnterOnly = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [chips, setChips] = useState(INITIAL_CHIPS);
  const nextIdRef = useRef(INITIAL_CHIPS.length + 1);

  const add = () => {
    setChips((prev) => {
      const index = randomInt(0, prev.length);
      return [...prev.slice(0, index), createChip(nextIdRef.current++), ...prev.slice(index)];
    });
  };

  const remove = () => {
    setChips((prev) => {
      const index = randomInt(0, prev.length - 1);
      return prev.filter((_, other) => other !== index);
    });
  };

  return (
    <Example
      id="enter-only"
      title="Enter only"
      tags={['component', 'enter', 'custom animation']}
      description={
        <>
          Only new chips animate: moves, removals and resizes happen at once. CSS turns off every
          animation of the group and hides the old snapshots, then turns on the enter animation of
          the children.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div className="toolbar">
        <button type="button" onClick={add}>
          Add
        </button>
        <button type="button" onClick={remove} disabled={chips.length === 0}>
          Remove
        </button>
        <button type="button" onClick={() => setChips(shuffle)}>
          Shuffle
        </button>
      </div>
      <ViewTransitionGroup
        respectReducedMotion={respectReducedMotion}
        as="ul"
        className="chips"
        childVtClass="chip"
      >
        {chips.map((chip) => (
          <li key={chip.id}>{chip.label}</li>
        ))}
      </ViewTransitionGroup>
    </Example>
  );
};
