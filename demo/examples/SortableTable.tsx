import { useState } from 'react';
import { ViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
// the rows are grids, not the table layout: a table row group can not be the root of a transition
<table className="planets">
  <thead>…</thead>
  <ViewTransitionGroup as="tbody" childVtClass="table-row">
    {sorted.map((planet) => (
      <tr key={planet.name}>…</tr>
    ))}
  </ViewTransitionGroup>
</table>
`;

interface Planet {
  name: string;
  moons: number;
  /** Diameter in thousands of km */
  diameter: number;
  /** Distance from the Sun in AU */
  distance: number;
}

type SortKey = keyof Planet;

const PLANETS: Planet[] = [
  { name: 'Mercury', moons: 0, diameter: 4.9, distance: 0.39 },
  { name: 'Venus', moons: 0, diameter: 12.1, distance: 0.72 },
  { name: 'Earth', moons: 1, diameter: 12.7, distance: 1 },
  { name: 'Mars', moons: 2, diameter: 6.8, distance: 1.52 },
  { name: 'Jupiter', moons: 95, diameter: 139.8, distance: 5.2 },
  { name: 'Saturn', moons: 146, diameter: 116.5, distance: 9.5 },
];

const COLUMNS: { key: SortKey; title: string }[] = [
  { key: 'name', title: 'Planet' },
  { key: 'moons', title: 'Moons' },
  { key: 'diameter', title: 'Diameter' },
  { key: 'distance', title: 'From the Sun' },
];

const compare = (a: Planet, b: Planet, key: SortKey) => {
  const first = a[key];
  const second = b[key];
  return typeof first === 'string' && typeof second === 'string'
    ? first.localeCompare(second)
    : Number(first) - Number(second);
};

export const SortableTable = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [sortKey, setSortKey] = useState<SortKey>('distance');
  const [ascending, setAscending] = useState(true);

  const sorted = [...PLANETS].sort((a, b) => compare(a, b, sortKey) * (ascending ? 1 : -1));

  const sortBy = (key: SortKey) => {
    setAscending(key === sortKey ? !ascending : true);
    setSortKey(key);
  };

  return (
    <Example
      id="sortable-table"
      title="Sortable table"
      tags={['component', 'move', 'table']}
      description={
        <>
          The group is the <code>&lt;tbody&gt;</code> of a table, the rows are its children. The
          browser does not run a transition on a table row group, so the table is laid out with CSS
          grid. Click a column header to sort, click it again to reverse.
        </>
      }
      code={CODE}
    >
      <table className="planets">
        <thead>
          <tr>
            {COLUMNS.map((column) => (
              <th
                key={column.key}
                aria-sort={
                  column.key === sortKey ? (ascending ? 'ascending' : 'descending') : undefined
                }
              >
                <button type="button" onClick={() => sortBy(column.key)}>
                  {column.title}
                  <span aria-hidden="true">
                    {column.key === sortKey ? (ascending ? ' ↑' : ' ↓') : ''}
                  </span>
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <ViewTransitionGroup
          respectReducedMotion={respectReducedMotion}
          as="tbody"
          childVtClass="table-row"
        >
          {sorted.map((planet) => (
            <tr key={planet.name}>
              <td>{planet.name}</td>
              <td>{planet.moons}</td>
              <td>{planet.diameter}k km</td>
              <td>{planet.distance} AU</td>
            </tr>
          ))}
        </ViewTransitionGroup>
      </table>
    </Example>
  );
};
