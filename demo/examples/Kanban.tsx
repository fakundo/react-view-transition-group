import { useRef, useState } from 'react';
import { ViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
<ViewTransitionGroup className="kanban" childVtClass="column">
  {columns.map((column) => (
    <section key={column.id}>
      <h4>{column.title}</h4>
      {/* a group inside a group: every column runs its own transitions */}
      <ViewTransitionGroup as="ul" childVtClass="task">
        {tasks
          .filter((task) => task.column === column.id)
          .map((task) => (
            <li key={task.id}>…</li>
          ))}
      </ViewTransitionGroup>
    </section>
  ))}
</ViewTransitionGroup>
`;

type ColumnId = 'todo' | 'doing' | 'done';

interface Task {
  id: number;
  text: string;
  column: ColumnId;
}

const COLUMNS: { id: ColumnId; title: string }[] = [
  { id: 'todo', title: 'To do' },
  { id: 'doing', title: 'In progress' },
  { id: 'done', title: 'Done' },
];

const COLUMN_IDS = COLUMNS.map((column) => column.id);

const TASK_TEXTS = ['Write tests', 'Fix the header', 'Review the PR', 'Update docs', 'Ship it'];

const INITIAL_TASKS: Task[] = [
  { id: 1, text: 'Design the API', column: 'done' },
  { id: 2, text: 'Build the demo', column: 'doing' },
  { id: 3, text: 'Write the README', column: 'todo' },
  { id: 4, text: 'Add e2e tests', column: 'todo' },
];

export const Kanban = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [showDone, setShowDone] = useState(true);
  const nextIdRef = useRef(INITIAL_TASKS.length + 1);

  const columns = COLUMNS.filter((column) => showDone || column.id !== 'done');

  const moveTask = (id: number, step: number) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, column: COLUMN_IDS[COLUMN_IDS.indexOf(task.column) + step] }
          : task,
      ),
    );
  };

  const addTask = () => {
    const id = nextIdRef.current++;
    setTasks((prev) => [...prev, { id, text: TASK_TEXTS[id % TASK_TEXTS.length], column: 'todo' }]);
  };

  return (
    <Example
      id="kanban"
      title="Kanban board"
      tags={['component', 'nested groups', 'enter', 'exit']}
      description={
        <>
          Every column is a group inside the board group, and every group runs its own transitions.
          Hide a column and the board animates it; move a card and both columns animate. A card does
          not fly between columns: it leaves one group and enters the other.
        </>
      }
      code={CODE}
    >
      <div className="toolbar">
        <button type="button" onClick={addTask}>
          Add task
        </button>
        <label className="switch">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(event) => setShowDone(event.currentTarget.checked)}
          />
          Show “Done”
        </label>
      </div>
      <ViewTransitionGroup
        respectReducedMotion={respectReducedMotion}
        className="kanban"
        childVtClass="column"
      >
        {columns.map((column) => (
          <section key={column.id}>
            <h4>{column.title}</h4>
            <ViewTransitionGroup
              respectReducedMotion={respectReducedMotion}
              as="ul"
              childVtClass="task"
            >
              {tasks
                .filter((task) => task.column === column.id)
                .map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      aria-label="Move left"
                      disabled={task.column === 'todo'}
                      onClick={() => moveTask(task.id, -1)}
                    >
                      ‹
                    </button>
                    <span>{task.text}</span>
                    <button
                      type="button"
                      aria-label="Move right"
                      disabled={task.column === 'done'}
                      onClick={() => moveTask(task.id, 1)}
                    >
                      ›
                    </button>
                  </li>
                ))}
            </ViewTransitionGroup>
          </section>
        ))}
      </ViewTransitionGroup>
    </Example>
  );
};
