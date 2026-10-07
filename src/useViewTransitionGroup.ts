import { useCallback, useLayoutEffect, useRef } from 'react';
import { flushSync } from 'react-dom';
import { isValidChildNode, isVisibleTextNode, prefersReducedMotion, warnOnce } from './helpers';
import {
  CSS_VT_CLASS,
  CSS_VT_NAME,
  DEFAULT_CHILD_VT_CLASS,
  DEFAULT_ROOT_VT_CLASS,
  VT_NAME_MATCH_ELEMENT,
  WARNING_HOOK_ROOT_NOT_FOUND,
  WARNING_TEXT_CHILD,
} from './constants';

export interface UseViewTransitionGroupOptions {
  /**
   * `view-transition-class` of every child
   * @default 'vtg-child'
   */
  childVtClass?: string;
  /**
   * `view-transition-class` of the root
   * @default 'vtg-root'
   */
  rootVtClass?: string;
  /**
   * Updates run without a transition
   * @default false
   */
  disabled?: boolean;
  /**
   * Updates run without a transition when the user prefers reduced motion
   * @default true
   */
  respectReducedMotion?: boolean;
  /** A transition has started */
  onTransitionStart?: (transition: ViewTransition) => void;
  /** A transition has ended: finished, skipped or aborted */
  onTransitionEnd?: (transition: ViewTransition) => void;
}

export interface GroupStartTransitionOptions {
  /** Matched in CSS by `:active-view-transition-type()` on the root */
  types?: string[];
}

/** Runs `update` inside a transition. `null`: the update ran without one */
export type GroupStartTransition = (
  update: () => void,
  options?: GroupStartTransitionOptions,
) => ViewTransition | null;

/** Element-scoped View Transitions are not in lib.dom yet */
type ViewTransitionRoot = HTMLElement & {
  startViewTransition?(
    callbackOptions: ViewTransitionUpdateCallback | StartViewTransitionOptions,
  ): ViewTransition;
};

/**
 * Animates the children of an element when they are added, removed, moved or changed.
 *
 * ```tsx
 * const [rootRef, startTransition] = useViewTransitionGroup<HTMLUListElement>();
 * startTransition(() => setItems(next));
 * <ul ref={rootRef}>{items.map((item) => <li key={item.id}>{item.text}</li>)}</ul>
 * ```
 */
export const useViewTransitionGroup = <T extends HTMLElement = HTMLElement>(
  options: UseViewTransitionGroupOptions = {},
) => {
  const rootRef = useRef<T>(null);
  const optionsRef = useRef(options);
  // Only the newest transition removes the names
  const latestTransitionRef = useRef<ViewTransition | null>(null);

  useLayoutEffect(() => {
    optionsRef.current = options;
  });

  const startTransition = useCallback<GroupStartTransition>((update, transitionOptions) => {
    const rootNode = rootRef.current as ViewTransitionRoot | null;
    const {
      childVtClass = DEFAULT_CHILD_VT_CLASS,
      rootVtClass = DEFAULT_ROOT_VT_CLASS,
      disabled = false,
      respectReducedMotion = true,
      onTransitionStart,
      onTransitionEnd,
    } = optionsRef.current;

    if (!rootNode) {
      warnOnce(WARNING_HOOK_ROOT_NOT_FOUND);
      update();
      return null;
    }
    // No support or no animation wanted
    if (
      !rootNode.startViewTransition ||
      disabled ||
      (respectReducedMotion && prefersReducedMotion())
    ) {
      update();
      return null;
    }

    // A kept node has the same name in both snapshots
    const nameChildren = () => {
      rootNode.childNodes.forEach((node) => {
        if (isValidChildNode(node)) {
          node.style.setProperty(CSS_VT_CLASS, childVtClass);
          node.style.setProperty(CSS_VT_NAME, VT_NAME_MATCH_ELEMENT);
        } else if (isVisibleTextNode(node)) {
          warnOnce(WARNING_TEXT_CHILD);
        }
      });
    };

    const cleanup = () => {
      rootNode.childNodes.forEach((node) => {
        if (isValidChildNode(node)) {
          node.style.removeProperty(CSS_VT_CLASS);
          node.style.removeProperty(CSS_VT_NAME);
        }
      });
      rootNode.style.removeProperty(CSS_VT_CLASS);
    };

    // Old snapshot
    rootNode.style.setProperty(CSS_VT_CLASS, rootVtClass);
    nameChildren();

    const callback = () => {
      flushSync(update);
      // New snapshot: name the added children
      nameChildren();
    };
    const transition = rootNode.startViewTransition({
      update: callback,
      types: transitionOptions?.types,
    });
    latestTransitionRef.current = transition;
    onTransitionStart?.(transition);

    // Also when skipped or aborted
    transition.finished.finally(() => {
      if (latestTransitionRef.current === transition) {
        latestTransitionRef.current = null;
        if (rootNode.isConnected) {
          cleanup();
        }
      }
      onTransitionEnd?.(transition);
    });

    return transition;
  }, []);

  return [rootRef, startTransition] as const;
};
