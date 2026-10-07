import { useRef, useState } from 'react';
import { ViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion, randomInt } from '../ui';

const CODE = `
import { ViewTransitionGroup } from 'react-view-transition-group';

const Numbers = () => {
  const [numbers, setNumbers] = useState([1, 2, 3, 4, 5]);

  return (
    <ViewTransitionGroup as="ul" className="numbers">
      {numbers.map((number) => (
        <li key={number}>{number}</li>
      ))}
    </ViewTransitionGroup>
  );
};
`;

const INITIAL_NUMBERS = [1, 2, 3, 4, 5];

export const QuickStart = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [numbers, setNumbers] = useState(INITIAL_NUMBERS);
  const nextRef = useRef(INITIAL_NUMBERS.length + 1);

  const insert = () => {
    const number = nextRef.current++;
    setNumbers((prev) => {
      const index = randomInt(0, prev.length);
      return [...prev.slice(0, index), number, ...prev.slice(index)];
    });
  };
  const remove = (number: number) => {
    setNumbers((prev) => prev.filter((other) => other !== number));
  };
  const sort = () => {
    setNumbers((prev) => [...prev].sort((a, b) => a - b));
  };

  return (
    <Example
      id="quick-start"
      title="Quick start"
      tags={['component', 'enter', 'exit', 'move']}
      description={
        <>
          Wrap a keyed list in <code>ViewTransitionGroup</code> and update it as usual. Insert a
          number at a random place, click a number to remove it.
        </>
      }
      code={CODE}
    >
      <div className="toolbar">
        <button type="button" onClick={insert}>
          Insert
        </button>
        <button type="button" onClick={sort}>
          Sort
        </button>
      </div>
      <ViewTransitionGroup respectReducedMotion={respectReducedMotion} as="ul" className="numbers">
        {numbers.map((number) => (
          <li key={number}>
            <button type="button" onClick={() => remove(number)} aria-label={`Remove ${number}`}>
              {number}
            </button>
          </li>
        ))}
      </ViewTransitionGroup>
    </Example>
  );
};
