import { act, useLayoutEffect, useState } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useViewTransitionGroup } from './useViewTransitionGroup';
import type { GroupStartTransition, UseViewTransitionGroupOptions } from './useViewTransitionGroup';
import {
  DEFAULT_CHILD_VT_CLASS,
  DEFAULT_ROOT_VT_CLASS,
  VT_NAME_MATCH_ELEMENT,
  WARNING_HOOK_ROOT_NOT_FOUND,
  WARNING_TEXT_CHILD,
} from './constants';
import {
  mockConsoleWarn,
  mockReducedMotion,
  mockStartViewTransition,
  resetTestEnvironment,
  vtClass,
  vtName,
} from './testUtils';

const renders: string[] = [];
const Item = (props: { label: string }) => {
  renders.push(props.label);
  return <li>{props.label}</li>;
};

let setItems: (items: string[]) => void;
let start: GroupStartTransition;

const List = (props: {
  initial: string[];
  attached?: boolean;
  text?: string;
  options?: UseViewTransitionGroupOptions;
}) => {
  const [items, setState] = useState(props.initial);
  const [rootRef, startTransition] = useViewTransitionGroup<HTMLUListElement>(props.options);
  useLayoutEffect(() => {
    setItems = setState;
    start = startTransition;
  }, [startTransition]);
  return (
    <ul ref={props.attached === false ? undefined : rootRef} data-testid="root">
      {props.text}
      {items.map((item) => (
        <Item key={item} label={item} />
      ))}
    </ul>
  );
};

const update = (items: string[], types?: string[]) => {
  let transition: ViewTransition | null = null;
  act(() => {
    transition = start(
      () => {
        setItems(items);
      },
      { types },
    );
  });
  return transition;
};

const item = (text: string) => screen.getByText(text);
const root = () => screen.getByTestId('root');
const texts = () => [...root().children].map((child) => child.textContent).join('');

afterEach(() => {
  resetTestEnvironment();
  renders.length = 0;
});

describe('useViewTransitionGroup', () => {
  it('updates without animation when the browser has no element-scoped transitions', () => {
    render(<List initial={['a', 'b']} />);
    update(['b', 'c']);
    expect(texts()).toBe('bc');
    expect(vtName(item('b'))).toBe('');
  });

  it('warns and updates when the ref is not attached', () => {
    const warn = mockConsoleWarn();
    mockStartViewTransition();
    render(<List initial={['a']} attached={false} />);
    update(['b']);
    expect(texts()).toBe('b');
    expect(warn).toHaveBeenCalledWith(WARNING_HOOK_ROOT_NOT_FOUND);
  });

  it('names all children for the old snapshot and runs the update inside the transition', async () => {
    const { startViewTransition, oldNames, updatesDone } = mockStartViewTransition();
    render(<List initial={['a', 'b']} />);
    const a = item('a');
    update(['b', 'a']);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    // The update waits for the old snapshot
    expect(texts()).toBe('ab');
    expect(oldNames[0]).toEqual({ a: VT_NAME_MATCH_ELEMENT, b: VT_NAME_MATCH_ELEMENT });
    expect(vtClass(a)).toBe(DEFAULT_CHILD_VT_CLASS);
    expect(vtClass(root())).toBe(DEFAULT_ROOT_VT_CLASS);

    await updatesDone();
    expect(texts()).toBe('ba');
    // A moved child keeps its node and name
    expect(item('a')).toBe(a);
    expect(vtName(a)).toBe(VT_NAME_MATCH_ELEMENT);
    expect(vtName(item('b'))).toBe(VT_NAME_MATCH_ELEMENT);
  });

  it('names added children and removes the names when the transition ends', async () => {
    const { oldNames, updatesDone, finishTransitions } = mockStartViewTransition();
    render(<List initial={['a', 'b', 'c']} />);
    update(['a', 'c', 'd']);
    await updatesDone();

    expect(texts()).toBe('acd');
    expect(oldNames[0].d).toBeUndefined();
    expect(vtName(item('d'))).toBe(VT_NAME_MATCH_ELEMENT);
    expect(vtClass(item('d'))).toBe(DEFAULT_CHILD_VT_CLASS);

    await finishTransitions();
    ['a', 'c', 'd'].forEach((text) => {
      expect(vtName(item(text))).toBe('');
    });
    expect(root().getAttribute('style')).toBe('');
  });

  it('renders every child once per update', async () => {
    const { updatesDone } = mockStartViewTransition();
    render(<List initial={['a', 'b']} />);
    renders.length = 0;
    update(['a', 'b', 'c']);
    await updatesDone();
    expect(renders).toEqual(['a', 'b', 'c']);
  });

  it('keeps the names of a newer transition when an older one ends', async () => {
    const { finishTransition, updatesDone } = mockStartViewTransition();
    render(<List initial={['a', 'b']} />);
    update(['b', 'a']);
    await updatesDone();
    update(['a', 'b']);

    // The first transition ends while the second runs
    await finishTransition(0);
    expect(vtName(item('a'))).toBe(VT_NAME_MATCH_ELEMENT);
    expect(vtName(item('b'))).toBe(VT_NAME_MATCH_ELEMENT);

    await updatesDone();
    await finishTransition(1);
    expect(vtName(item('a'))).toBe('');
    expect(vtName(item('b'))).toBe('');
  });

  it('returns the transition and calls onTransitionStart and onTransitionEnd', async () => {
    const { finishTransitions, updatesDone } = mockStartViewTransition();
    const onTransitionStart = vi.fn<(transition: ViewTransition) => void>();
    const onTransitionEnd = vi.fn<(transition: ViewTransition) => void>();
    render(<List initial={['a']} options={{ onTransitionStart, onTransitionEnd }} />);
    const transition = update(['b']);

    expect(transition).not.toBeNull();
    expect(onTransitionStart).toHaveBeenCalledWith(transition);
    expect(onTransitionEnd).not.toHaveBeenCalled();
    await updatesDone();
    await finishTransitions();
    expect(onTransitionEnd).toHaveBeenCalledWith(transition);
  });

  it('passes the transition types', () => {
    const { types } = mockStartViewTransition();
    render(<List initial={['a']} />);
    update(['b'], ['remove']);
    update(['c']);
    expect(types).toEqual([['remove'], undefined]);
  });

  it('updates without a transition when disabled', () => {
    const { startViewTransition } = mockStartViewTransition();
    render(<List initial={['a']} options={{ disabled: true }} />);
    expect(update(['b'])).toBeNull();
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(texts()).toBe('b');
  });

  it('updates without a transition when the user prefers reduced motion', () => {
    const { startViewTransition } = mockStartViewTransition();
    mockReducedMotion(true);
    render(<List initial={['a']} />);
    expect(update(['b'])).toBeNull();
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(texts()).toBe('b');
  });

  it('animates with reduced motion when respectReducedMotion is false', () => {
    const { startViewTransition } = mockStartViewTransition();
    mockReducedMotion(true);
    render(<List initial={['a']} options={{ respectReducedMotion: false }} />);
    update(['b']);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
  });

  it('warns once about text children', () => {
    const warn = mockConsoleWarn();
    mockStartViewTransition();
    render(<List initial={['a']} text="text" />);
    update(['b']);
    update(['c']);
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(WARNING_TEXT_CHILD);
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = mockConsoleWarn();
    mockStartViewTransition();
    render(<List initial={['a']} text="text" />);
    update(['b']);
    render(<List initial={['a']} attached={false} />);
    update(['c']);
    expect(warn).not.toHaveBeenCalled();
  });
});
