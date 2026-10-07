import { useRef, useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion, randomInt, shuffle } from '../ui';

const CODE = `
const [tiles, setTiles] = useState(INITIAL_TILES);
const [gridRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
  childVtClass: 'tile',
});

const shuffleTiles = () => {
  // the type is matched in CSS: a shuffle gets a springy move
  startTransition(() => setTiles((prev) => shuffle(prev)), { types: ['shuffle'] });
};

<div ref={gridRef} className="tiles">
  {tiles.map((tile) => (
    <div key={tile.id} className="tile" style={{ background: tile.color }}>
      {tile.id}
    </div>
  ))}
</div>
`;

const CSS = `
/* only during a shuffle */
.tiles:active-view-transition-type(shuffle)::view-transition-group(.tile) {
  animation-duration: 0.7s;
  animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* tiles pop in and out */
::view-transition-new(.tile):only-child { animation: pop-in 0.4s; }
::view-transition-old(.tile):only-child { animation: pop-out 0.3s; }
`;

interface Tile {
  id: number;
  color: string;
}

const createTile = (id: number): Tile => ({
  id,
  color: `oklch(0.72 0.14 ${(id * 47) % 360})`,
});

const INITIAL_TILES = Array.from({ length: 12 }, (_, index) => createTile(index + 1));

export const ShuffleGrid = () => {
  const [tiles, setTiles] = useState(INITIAL_TILES);
  const nextIdRef = useRef(INITIAL_TILES.length + 1);
  const respectReducedMotion = useRespectReducedMotion();
  const [gridRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
    respectReducedMotion,
    childVtClass: 'tile',
  });

  const update = (change: (prev: Tile[]) => Tile[], types?: string[]) => {
    startTransition(
      () => {
        setTiles(change);
      },
      { types },
    );
  };

  return (
    <Example
      id="shuffle-grid"
      title="Shuffle grid"
      tags={['hook', 'move', 'custom animation', 'transition types']}
      description={
        <>
          Any layout works: here it is a CSS grid. Every tile moves to its new cell, new tiles pop
          in. The <code>childVtClass</code> option gives the tiles their own enter and exit
          animation, and the <code>shuffle</code> transition type makes a shuffle springy.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div className="toolbar">
        <button type="button" onClick={() => update(shuffle, ['shuffle'])}>
          Shuffle
        </button>
        <button
          type="button"
          onClick={() => update((prev) => [...prev].sort((a, b) => a.id - b.id))}
        >
          Sort
        </button>
        <button type="button" onClick={() => update((prev) => [...prev].reverse())}>
          Reverse
        </button>
        <button
          type="button"
          onClick={() =>
            update((prev) => {
              const index = randomInt(0, prev.length);
              return [
                ...prev.slice(0, index),
                createTile(nextIdRef.current++),
                ...prev.slice(index),
              ];
            })
          }
        >
          Add
        </button>
        <button
          type="button"
          onClick={() =>
            update((prev) => {
              const index = randomInt(0, prev.length - 1);
              return prev.filter((_, other) => other !== index);
            })
          }
        >
          Remove
        </button>
      </div>
      <div ref={gridRef} className="tiles">
        {tiles.map((tile) => (
          <div key={tile.id} className="tile" style={{ background: tile.color }}>
            {tile.id}
          </div>
        ))}
      </div>
    </Example>
  );
};
