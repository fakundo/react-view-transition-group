// Unit test helpers
import { act } from 'react';
import { vi } from 'vitest';
import { resetWarnings } from './helpers';
import { CSS_VT_CLASS, CSS_VT_NAME } from './constants';

type WithStartViewTransition = { startViewTransition?: unknown };

type StartViewTransitionOptions = { update: () => void; types?: string[] };

/**
 * Mocks `startViewTransition`: the update runs in a microtask.
 * `oldNames`: names of the leaf elements in every old snapshot, by text
 */
export const mockStartViewTransition = () => {
  const finishers: (() => void)[] = [];
  const updates: Promise<void>[] = [];
  const oldNames: Record<string, string>[] = [];
  const types: (string[] | undefined)[] = [];

  const startViewTransition = vi.fn<
    (options: StartViewTransitionOptions) => { finished: Promise<void> }
  >((options) => {
    types.push(options.types);
    const names: Record<string, string> = {};
    document.body.querySelectorAll<HTMLElement>('*').forEach((element) => {
      if (element.childElementCount === 0) {
        names[element.textContent ?? ''] = vtName(element);
      }
    });
    oldNames.push(names);
    updates.push(
      Promise.resolve().then(() => {
        act(options.update);
      }),
    );
    const finished = new Promise<void>((resolve) => {
      finishers.push(resolve);
    });
    return { finished };
  });
  (Element.prototype as WithStartViewTransition).startViewTransition = startViewTransition;

  const updatesDone = async () => {
    await act(async () => {
      await Promise.all(updates);
    });
  };
  const finishTransition = async (index: number) => {
    await act(async () => {
      finishers[index]();
    });
  };
  const finishTransitions = async () => {
    await act(async () => {
      finishers.forEach((finish) => {
        finish();
      });
    });
  };

  return {
    startViewTransition,
    oldNames,
    types,
    updatesDone,
    finishTransition,
    finishTransitions,
  };
};

export const mockReducedMotion = (matches: boolean) => {
  vi.stubGlobal('matchMedia', () => ({ matches }));
};

export const mockConsoleWarn = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

/** For `afterEach` */
export const resetTestEnvironment = () => {
  delete (Element.prototype as WithStartViewTransition).startViewTransition;
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetWarnings();
};

export const vtName = (element: HTMLElement) => element.style.getPropertyValue(CSS_VT_NAME);

export const vtClass = (element: HTMLElement) => element.style.getPropertyValue(CSS_VT_CLASS);
