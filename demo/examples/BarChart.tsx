import { useRef, useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, randomInt, useRespectReducedMotion } from '../ui';

const CODE = `
const [chartRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
  childVtClass: 'bar',
});

// every child is an <svg>: SVG elements animate like HTML ones
<div ref={chartRef} className="chart">
  {bars.map((bar) => (
    <svg key={bar.id} width={40} height={bar.value * 1.5}>
      <rect width="100%" height="100%" rx={6} fill={bar.color} />
    </svg>
  ))}
</div>
`;

const CSS = `
/* the bar grows: stretch the snapshots to the size of the bar */
::view-transition-old(.bar),
::view-transition-new(.bar) {
  height: 100%;
}
`;

interface Bar {
  id: number;
  value: number;
  color: string;
}

const MAX_BARS = 10;
const HEIGHT_PER_VALUE = 1.5;

const createBar = (id: number): Bar => ({
  id,
  value: randomInt(10, 100),
  color: `oklch(0.7 0.14 ${(id * 53) % 360})`,
});

const INITIAL_BARS = Array.from({ length: 6 }, (_, index) => createBar(index + 1));

export const BarChart = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [bars, setBars] = useState(INITIAL_BARS);
  const nextIdRef = useRef(INITIAL_BARS.length + 1);
  const [chartRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
    respectReducedMotion,
    childVtClass: 'bar',
  });

  const update = (change: (prev: Bar[]) => Bar[]) => {
    startTransition(() => {
      setBars(change);
    });
  };

  return (
    <Example
      id="bar-chart"
      title="SVG bar chart"
      tags={['hook', 'svg', 'size', 'move']}
      description={
        <>
          Every bar is an <code>&lt;svg&gt;</code> element: SVG children animate like HTML ones. New
          values change the height of the bars, sorting moves them.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div className="toolbar">
        <button
          type="button"
          onClick={() =>
            update((prev) => prev.map((bar) => ({ ...bar, value: randomInt(10, 100) })))
          }
        >
          New values
        </button>
        <button
          type="button"
          onClick={() => update((prev) => [...prev].sort((a, b) => b.value - a.value))}
        >
          Sort
        </button>
        <button
          type="button"
          disabled={bars.length === MAX_BARS}
          onClick={() => update((prev) => [...prev, createBar(nextIdRef.current++)])}
        >
          Add
        </button>
        <button
          type="button"
          disabled={bars.length === 0}
          onClick={() => update((prev) => prev.slice(0, -1))}
        >
          Remove
        </button>
      </div>
      <div ref={chartRef} className="chart">
        {bars.map((bar) => (
          <svg
            key={bar.id}
            width={40}
            height={bar.value * HEIGHT_PER_VALUE}
            role="img"
            aria-label={String(bar.value)}
          >
            <rect width="100%" height="100%" rx={6} fill={bar.color} />
            <text x="50%" y={18} textAnchor="middle">
              {bar.value}
            </text>
          </svg>
        ))}
      </div>
    </Example>
  );
};
