import { useEffect, useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion, shuffle } from '../ui';

const CODE = `
// Every group is the root of its own transition:
// they run at the same time and never cancel each other
const Lane = (props: { items: string[]; interval: number }) => {
  const [items, setItems] = useState(props.items);
  const [laneRef, startTransition] = useViewTransitionGroup<HTMLUListElement>();

  useEffect(() => {
    const timer = setInterval(() => {
      startTransition(() => setItems((prev) => shuffle(prev)));
    }, props.interval);
    return () => clearInterval(timer);
  }, [props.interval, startTransition]);

  return <ul ref={laneRef}>{items.map((item) => <li key={item}>{item}</li>)}</ul>;
};
`;

const LANES = [
  { title: 'Every 0.9 s', interval: 900, items: ['🍋', '🍊', '🍉', '🍇', '🥝'] },
  { title: 'Every 1.3 s', interval: 1300, items: ['🚗', '🚕', '🚙', '🚌', '🚎'] },
  { title: 'Every 1.7 s', interval: 1700, items: ['🌑', '🌒', '🌓', '🌔', '🌕'] },
];

const Lane = (props: { title: string; items: string[]; interval: number; running: boolean }) => {
  const { interval, running } = props;
  const [items, setItems] = useState(props.items);
  const respectReducedMotion = useRespectReducedMotion();
  const [laneRef, startTransition] = useViewTransitionGroup<HTMLUListElement>({
    respectReducedMotion,
    childVtClass: 'lane-item',
  });

  useEffect(() => {
    if (!running) {
      return;
    }
    const timer = setInterval(() => {
      startTransition(() => {
        setItems(shuffle);
      });
    }, interval);
    return () => {
      clearInterval(timer);
    };
  }, [interval, running, startTransition]);

  return (
    <div className="lane">
      <h4>{props.title}</h4>
      <ul ref={laneRef}>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export const Concurrent = () => {
  const [running, setRunning] = useState(false);

  return (
    <Example
      id="concurrent"
      title="Independent groups"
      tags={['hook', 'concurrent']}
      description={
        <>
          With document-wide view transitions only one transition can run at a time. Element-scoped
          transitions belong to their root, so these three lists animate at the same time without
          interrupting each other.
        </>
      }
      code={CODE}
    >
      <div className="toolbar">
        <button type="button" onClick={() => setRunning((prev) => !prev)}>
          {running ? 'Pause' : 'Start'}
        </button>
      </div>
      <div className="lanes">
        {LANES.map((lane) => (
          <Lane key={lane.title} {...lane} running={running} />
        ))}
      </div>
    </Example>
  );
};
