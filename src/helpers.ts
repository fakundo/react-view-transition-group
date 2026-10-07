import { REDUCED_MOTION_QUERY } from './constants';

// Replaced by the bundler of the app
declare const process: { env: { NODE_ENV?: string } } | undefined;

export const isDev = () => typeof process === 'undefined' || process.env.NODE_ENV !== 'production';

const warned = new Set<string>();

/** Warns once per message, in development only */
export const warnOnce = (message: string) => {
  if (!isDev() || warned.has(message) || typeof console === 'undefined') {
    return;
  }
  warned.add(message);
  console.warn(message);
};

/** For tests */
export const resetWarnings = () => {
  warned.clear();
};

/** Elements with inline `style`, so they can be named */
export type ValidChildNode = HTMLElement | SVGElement;

export const isValidChildNode = (node: Node): node is ValidChildNode =>
  node instanceof HTMLElement || node instanceof SVGElement;

/** Text can not be named, so it does not animate */
export const isVisibleTextNode = (node: Node) =>
  node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim() !== '';

/** jsdom has no `matchMedia` */
export const prefersReducedMotion = () =>
  typeof window.matchMedia === 'function' && window.matchMedia(REDUCED_MOTION_QUERY).matches;
