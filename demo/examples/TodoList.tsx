import { useRef, useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
const [todos, setTodos] = useState(INITIAL_TODOS);
const [listRef, startTransition] = useViewTransitionGroup<HTMLUListElement>();

// Done items go down, so toggling moves the item
const toggle = (id: number) => {
  startTransition(() => {
    setTodos((prev) => sortTodos(prev.map((todo) =>
      todo.id === id ? { ...todo, done: !todo.done } : todo,
    )));
  });
};

<ul ref={listRef} className="todos">
  {todos.map((todo) => (
    <li key={todo.id} className={todo.done ? 'done' : undefined}>…</li>
  ))}
</ul>
`;

interface Todo {
  id: number;
  text: string;
  done: boolean;
}

const INITIAL_TODOS: Todo[] = [
  { id: 1, text: 'Read the View Transitions spec', done: false },
  { id: 2, text: 'Try element-scoped transitions', done: false },
  { id: 3, text: 'Name children with match-element', done: false },
  { id: 4, text: 'Read the docs', done: true },
];

/** Open todos first, the order inside each part stays */
const sortTodos = (todos: Todo[]) => [
  ...todos.filter((todo) => !todo.done),
  ...todos.filter((todo) => todo.done),
];

export const TodoList = () => {
  const [todos, setTodos] = useState(INITIAL_TODOS);
  const [text, setText] = useState('');
  const nextIdRef = useRef(INITIAL_TODOS.length + 1);
  const respectReducedMotion = useRespectReducedMotion();
  const [listRef, startTransition] = useViewTransitionGroup<HTMLUListElement>({
    respectReducedMotion,
  });

  const add = (event: React.FormEvent) => {
    event.preventDefault();
    const value = text.trim();
    if (!value) {
      return;
    }
    const todo = { id: nextIdRef.current++, text: value, done: false };
    startTransition(() => {
      setTodos((prev) => [todo, ...prev]);
    });
    setText('');
  };
  const toggle = (id: number) => {
    startTransition(() => {
      setTodos((prev) =>
        sortTodos(prev.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo))),
      );
    });
  };
  const remove = (id: number) => {
    startTransition(() => {
      setTodos((prev) => prev.filter((todo) => todo.id !== id));
    });
  };
  const clearDone = () => {
    startTransition(() => {
      setTodos((prev) => prev.filter((todo) => !todo.done));
    });
  };

  const left = todos.filter((todo) => !todo.done).length;

  return (
    <Example
      id="todo-list"
      title="Todo list"
      tags={['hook', 'enter', 'exit', 'move', 'content']}
      description={
        <>
          The hook wraps your own state updates. A finished task changes its look and moves down in
          the same transition: <code>startTransition</code> captures the old list before the update,
          so a change of content is animated too.
        </>
      }
      code={CODE}
    >
      <form className="todo-form" onSubmit={add}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="What needs to be done?"
          aria-label="New task"
        />
        <button type="submit">Add</button>
      </form>
      <ul ref={listRef} className="todos">
        {todos.map((todo) => (
          <li key={todo.id} className={todo.done ? 'done' : undefined}>
            <label>
              <input type="checkbox" checked={todo.done} onChange={() => toggle(todo.id)} />
              <span>{todo.text}</span>
            </label>
            <button
              type="button"
              className="icon"
              onClick={() => remove(todo.id)}
              aria-label="Delete"
            >
              ×
            </button>
          </li>
        ))}
      </ul>
      <div className="todo-footer">
        <span>{left} left</span>
        <button type="button" className="link" onClick={clearDone}>
          Clear completed
        </button>
      </div>
    </Example>
  );
};
