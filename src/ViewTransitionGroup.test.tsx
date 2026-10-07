import { createRef } from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ViewTransitionGroup } from './ViewTransitionGroup';
import {
  VT_NAME_MATCH_ELEMENT,
  WARNING_CHILDREN_MISMATCH,
  WARNING_HOOK_ROOT_NOT_FOUND,
} from './constants';
import {
  mockConsoleWarn,
  mockStartViewTransition,
  resetTestEnvironment,
  vtClass,
  vtName,
} from './testUtils';

const renders: string[] = [];
const Item = (props: { label: string }) => {
  renders.push(props.label);
  return <div>{props.label}</div>;
};

const NoRef = (props: { children?: React.ReactNode }) => <section>{props.children}</section>;

const Group = (props: { items: string[]; childVtClass?: string; rootVtClass?: string }) => (
  <ViewTransitionGroup
    childVtClass={props.childVtClass}
    rootVtClass={props.rootVtClass}
    data-testid="root"
  >
    {props.items.map((label) => (
      <Item key={label} label={label} />
    ))}
  </ViewTransitionGroup>
);

const texts = () =>
  [...screen.getByTestId('root').children].map((child) => child.textContent).join('');

afterEach(() => {
  resetTestEnvironment();
  renders.length = 0;
});

describe('ViewTransitionGroup', () => {
  it('renders a div by default', () => {
    const { container } = render(<ViewTransitionGroup />);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('renders the `as` element and passes its props', () => {
    render(<ViewTransitionGroup as="ul" className="list" aria-label="items" childVtClass="x" />);
    const root = screen.getByRole('list', { name: 'items' });
    expect(root.tagName).toBe('UL');
    expect(root.className).toBe('list');
    expect(root.hasAttribute('childVtClass')).toBe(false);
  });

  it('forwards ref to the root element', () => {
    const ref = createRef<HTMLUListElement>();
    render(<ViewTransitionGroup as="ul" ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLUListElement);
  });

  it('supports callback refs', () => {
    const ref = vi.fn<(node: HTMLElement | null) => void>();
    render(<ViewTransitionGroup ref={ref} />);
    expect(ref).toHaveBeenCalledWith(expect.any(HTMLDivElement));
  });

  it('updates children at once when View Transitions are not supported', () => {
    const { rerender } = render(<Group items={['a']} />);
    rerender(<Group items={['a', 'b']} />);
    expect(texts()).toBe('ab');
  });

  it('warns and updates children when the root element is not found', () => {
    const warn = mockConsoleWarn();
    mockStartViewTransition();
    const { rerender } = render(
      <ViewTransitionGroup as={NoRef}>
        <p key="a">a</p>
      </ViewTransitionGroup>,
    );
    rerender(
      <ViewTransitionGroup as={NoRef}>
        <p key="b">b</p>
      </ViewTransitionGroup>,
    );
    expect(warn).toHaveBeenCalledWith(WARNING_HOOK_ROOT_NOT_FOUND);
    expect(screen.getByText('b')).toBeTruthy();
  });

  it('does not animate the first render', () => {
    const { startViewTransition } = mockStartViewTransition();
    render(<Group items={['a', 'b']} />);
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(texts()).toBe('ab');
  });

  it('keeps the old children for the old snapshot and shows the new ones in the update', async () => {
    const { startViewTransition, oldNames, updatesDone, finishTransitions } =
      mockStartViewTransition();
    const { rerender } = render(
      <Group items={['a', 'b']} childVtClass="item" rootVtClass="list" />,
    );
    rerender(<Group items={['b', 'c']} childVtClass="item" rootVtClass="list" />);

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(texts()).toBe('ab');
    expect(oldNames[0]).toMatchObject({ a: VT_NAME_MATCH_ELEMENT, b: VT_NAME_MATCH_ELEMENT });
    expect(vtClass(screen.getByTestId('root'))).toBe('list');

    await updatesDone();
    expect(texts()).toBe('bc');
    expect(vtName(screen.getByText('c'))).toBe(VT_NAME_MATCH_ELEMENT);
    expect(vtClass(screen.getByText('c'))).toBe('item');

    await finishTransitions();
    expect(vtName(screen.getByText('b'))).toBe('');
    expect(vtName(screen.getByText('c'))).toBe('');
    expect(screen.getByTestId('root').getAttribute('style')).toBe('');
  });

  it('animates a reorder', async () => {
    const { startViewTransition, updatesDone } = mockStartViewTransition();
    const { rerender } = render(<Group items={['a', 'b']} />);
    rerender(<Group items={['b', 'a']} />);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    await updatesDone();
    expect(texts()).toBe('ba');
  });

  it('updates children with the same keys at once, without a transition', () => {
    const { startViewTransition } = mockStartViewTransition();
    const { rerender } = render(
      <ViewTransitionGroup data-testid="root">
        <div key="a">a1</div>
      </ViewTransitionGroup>,
    );
    rerender(
      <ViewTransitionGroup data-testid="root">
        <div key="a">a2</div>
      </ViewTransitionGroup>,
    );
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(texts()).toBe('a2');
  });

  it('renders every child once per update', async () => {
    const { updatesDone } = mockStartViewTransition();
    const { rerender } = render(<Group items={['a', 'b']} />);
    renders.length = 0;
    rerender(<Group items={['a', 'b', 'c']} />);
    // The old children are the same elements
    expect(renders).toEqual([]);
    await updatesDone();
    expect(renders).toEqual(['a', 'b', 'c']);
  });

  it('applies the latest children when they change before the snapshot', async () => {
    const { updatesDone } = mockStartViewTransition();
    const { rerender } = render(<Group items={['a']} />);
    rerender(<Group items={['a', 'b']} />);
    rerender(<Group items={['a', 'b', 'c']} />);
    await updatesDone();
    expect(texts()).toBe('abc');
  });

  it('does not restart the transition on a re-render with the same keys', async () => {
    const { startViewTransition, updatesDone } = mockStartViewTransition();
    const { rerender } = render(<Group items={['a']} />);
    rerender(<Group items={['a', 'b']} />);
    rerender(<Group items={['a', 'b']} />);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    await updatesDone();
    expect(texts()).toBe('ab');
  });

  it('shows the old keys when they come back before the update', async () => {
    const { startViewTransition, updatesDone } = mockStartViewTransition();
    const { rerender } = render(<Group items={['a']} />);
    rerender(<Group items={['a', 'b']} />);
    rerender(<Group items={['a']} />);
    expect(startViewTransition).toHaveBeenCalledTimes(1);
    await updatesDone();
    expect(texts()).toBe('a');
  });

  it('sets the transition types from the change of keys', async () => {
    const { types, updatesDone } = mockStartViewTransition();
    const { rerender } = render(<Group items={['a', 'b', 'c']} />);
    const steps = [
      ['a', 'b', 'c', 'd'],
      ['a', 'b', 'c'],
      ['c', 'b', 'a'],
      ['d', 'b'],
    ];
    for (let index = 0; index < steps.length; index++) {
      rerender(<Group items={steps[index]} />);
      await updatesDone();
    }
    expect(types).toEqual([['add'], ['remove'], ['move'], ['add', 'remove']]);
  });

  it('updates without a transition when disabled', () => {
    const { startViewTransition } = mockStartViewTransition();
    const { rerender } = render(
      <ViewTransitionGroup data-testid="root" disabled>
        <div key="a">a</div>
      </ViewTransitionGroup>,
    );
    rerender(
      <ViewTransitionGroup data-testid="root" disabled>
        <div key="b">b</div>
      </ViewTransitionGroup>,
    );
    expect(startViewTransition).not.toHaveBeenCalled();
    expect(texts()).toBe('b');
  });

  it('warns once when a child does not render exactly one element', () => {
    const warn = mockConsoleWarn();
    const Empty = () => null;
    render(
      <ViewTransitionGroup>
        <div key="a">a</div>
        <Empty key="b" />
      </ViewTransitionGroup>,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn).toHaveBeenCalledWith(WARNING_CHILDREN_MISMATCH);
  });
});
