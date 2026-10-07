import {
  Children,
  forwardRef,
  isValidElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useViewTransitionGroup } from './useViewTransitionGroup';
import type { UseViewTransitionGroupOptions } from './useViewTransitionGroup';
import { isDev, warnOnce } from './helpers';
import { COMPONENT_NAME, DEFAULT_ROOT_TAG, WARNING_CHILDREN_MISMATCH } from './constants';

export interface ViewTransitionGroupProps extends UseViewTransitionGroupOptions {
  children?: React.ReactNode;
}

type PolymorphicRef<E extends React.ElementType> = React.ComponentPropsWithRef<E>['ref'];

/** Group props, `as` and the props of the root element */
export type PolymorphicViewTransitionGroupProps<
  E extends React.ElementType = typeof DEFAULT_ROOT_TAG,
> = ViewTransitionGroupProps & {
  /** A component must forward ref to a DOM element */
  as?: E;
  ref?: PolymorphicRef<E>;
} & Omit<React.ComponentPropsWithoutRef<E>, keyof ViewTransitionGroupProps | 'as'>;

type PolymorphicViewTransitionGroupComponent = (<
  E extends React.ElementType = typeof DEFAULT_ROOT_TAG,
>(
  props: PolymorphicViewTransitionGroupProps<E>,
) => React.ReactElement | null) & { displayName?: string };

const getKeys = (children: React.ReactNode) =>
  Children.toArray(children).map((child) => (isValidElement(child) ? child.key : null));

/** `add`, `remove` and `move` by the keys; empty when the keys are the same */
const getTransitionTypes = (prev: React.ReactNode, next: React.ReactNode) => {
  if (prev === next) {
    return [];
  }
  const prevKeys = getKeys(prev);
  const nextKeys = getKeys(next);
  const prevSet = new Set(prevKeys);
  const nextSet = new Set(nextKeys);
  const keptPrev = prevKeys.filter((key) => nextSet.has(key));
  const keptNext = nextKeys.filter((key) => prevSet.has(key));
  const types: string[] = [];
  if (nextKeys.some((key) => !prevSet.has(key))) {
    types.push('add');
  }
  if (prevKeys.some((key) => !nextSet.has(key))) {
    types.push('remove');
  }
  if (keptPrev.some((key, index) => key !== keptNext[index])) {
    types.push('move');
  }
  return types;
};

/**
 * Animates its children when they are added, removed or moved, with the types
 * `add`, `remove` and `move`. Other changes are applied at once
 */
export const ViewTransitionGroup = forwardRef(
  (
    props: PolymorphicViewTransitionGroupProps<React.ElementType>,
    ref: React.ForwardedRef<HTMLElement>,
  ) => {
    const {
      as: Component = DEFAULT_ROOT_TAG,
      children,
      childVtClass,
      rootVtClass,
      disabled,
      respectReducedMotion,
      onTransitionStart,
      onTransitionEnd,
      ...rest
    } = props;
    const [rootRef, startTransition] = useViewTransitionGroup({
      childVtClass,
      rootVtClass,
      disabled,
      respectReducedMotion,
      onTransitionStart,
      onTransitionEnd,
    });
    const [rendered, setRendered] = useState(children);
    // Children for the update of the started transition
    const nextRef = useRef<{ children: React.ReactNode } | null>(null);
    const types = getTransitionTypes(rendered, children);
    const keysChanged = types.length > 0;

    // Same keys: update at once, React re-renders before the children
    if (!keysChanged && rendered !== children) {
      setRendered(children);
    }

    useLayoutEffect(() => {
      const next = nextRef.current;
      // Re-rendered before the update: it shows the latest children
      if (next && (!keysChanged || getTransitionTypes(next.children, children).length === 0)) {
        next.children = children;
      } else if (keysChanged) {
        const target = { children };
        nextRef.current = target;
        startTransition(
          () => {
            if (nextRef.current === target) {
              nextRef.current = null;
            }
            setRendered(target.children);
          },
          { types },
        );
      }
      // oxlint-disable-next-line react-hooks/exhaustive-deps, react/exhaustive-effect-dependencies
    }, [children]);

    // Every child must render one element
    useLayoutEffect(() => {
      const rootNode = rootRef.current;
      if (isDev() && rootNode && Children.toArray(rendered).length !== rootNode.children.length) {
        warnOnce(WARNING_CHILDREN_MISMATCH);
      }
    }, [rendered, rootRef]);

    const mergedRef = useCallback<React.RefCallback<HTMLElement>>(
      (node) => {
        rootRef.current = node;
        if (typeof ref === 'function') {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      },
      [ref, rootRef],
    );

    return (
      <Component {...rest} ref={mergedRef}>
        {rendered}
      </Component>
    );
  },
) as PolymorphicViewTransitionGroupComponent;

ViewTransitionGroup.displayName = COMPONENT_NAME;
