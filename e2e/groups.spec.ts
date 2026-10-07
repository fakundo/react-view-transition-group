import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

declare global {
  interface Window {
    /** Transition log: `<root id>: start | ready | aborted | finished` and the hook events */
    vtLog: string[];
  }
}

// Every element-scoped transition writes its outcome into window.vtLog
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    type Start = (this: Element, callbackOptions: unknown) => ViewTransition;
    const prototype = Element.prototype as unknown as { startViewTransition: Start };
    const original = prototype.startViewTransition;
    prototype.startViewTransition = function (callbackOptions) {
      const transition = original.call(this, callbackOptions);
      const push = (event: string) => {
        window.vtLog.push(`${this.id}: ${event}`);
      };
      push('start');
      transition.ready.then(
        () => {
          push('ready');
        },
        () => {
          push('aborted');
        },
      );
      transition.finished.then(() => {
        push('finished');
      });
      return transition;
    };
  });
});

const open = async (page: Page, query = '') => {
  await page.goto(`/${query}`);
  await page.locator('#hook-root li').first().waitFor();
};

const vtLog = (page: Page) => page.evaluate(() => [...window.vtLog]);

const clearLog = (page: Page) =>
  page.evaluate(() => {
    window.vtLog.length = 0;
  });

const countInLog = async (page: Page, entry: string) =>
  (await vtLog(page)).filter((item) => item === entry).length;

const waitForLog = (page: Page, entry: string) => expect.poll(() => vtLog(page)).toContain(entry);

/** Running `::view-transition-group()` pseudo-elements of a group root */
const runningGroups = (page: Page, rootId: string) =>
  page.evaluate(
    (id) =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === 'running')
        .map((animation) => animation.effect as KeyframeEffect)
        .filter((effect) => effect.target === document.getElementById(id))
        .filter((effect) => (effect.pseudoElement ?? '').startsWith('::view-transition-group('))
        .length,
    rootId,
  );

const activeTypes = (page: Page, rootId: string) =>
  page.evaluate((id) => {
    const root = document.getElementById(id)!;
    return ['add', 'remove', 'move', 'rotate'].filter((type) =>
      root.matches(`:active-view-transition-type(${type})`),
    );
  }, rootId);

const texts = (page: Page, rootId: string) =>
  page.locator(`#${rootId} > li`).evaluateAll((items) => items.map((item) => item.textContent));

/** Inline view-transition styles left anywhere in the page */
const leftovers = (page: Page) =>
  page.evaluate(() => document.querySelectorAll('[style*="view-transition"]').length);

test('animates every child and the root, then removes the names', async ({ page }) => {
  await open(page);
  await page.click('#hook-rotate');
  // 6 children + the root
  await expect.poll(() => runningGroups(page, 'hook-root')).toBe(7);
  await waitForLog(page, 'hook-root: finished');
  expect(await texts(page, 'hook-root')).toEqual(['2', '3', '4', '5', '6', '1']);
  expect(await leftovers(page)).toBe(0);
});

test('a transition started during another one still animates the children', async ({ page }) => {
  await open(page, '?duration=1000');
  await page.click('#hook-rotate');
  await page.waitForTimeout(200);
  await page.click('#hook-rotate');
  // With the names lost only the root animates: 1 instead of 7
  await expect.poll(() => runningGroups(page, 'hook-root')).toBe(7);
  await expect.poll(() => countInLog(page, 'hook-root: finished')).toBe(2);
  expect(await texts(page, 'hook-root')).toEqual(['3', '4', '5', '6', '1', '2']);
  expect(await leftovers(page)).toBe(0);
});

test('calls onTransitionStart and onTransitionEnd', async ({ page }) => {
  await open(page);
  await clearLog(page);
  await page.click('#hook-rotate');
  await waitForLog(page, 'hook: end');
  expect(await vtLog(page)).toEqual([
    'hook-root: start',
    'hook: start',
    'hook-root: ready',
    'hook-root: finished',
    'hook: end',
  ]);
});

test('removes a child: the DOM updates even when Chromium aborts the transition', async ({
  page,
}) => {
  await open(page);
  await page.click('#hook-remove');
  await waitForLog(page, 'hook: end');
  expect(await texts(page, 'hook-root')).toEqual(['2', '3', '4', '5', '6']);
  expect(await leftovers(page)).toBe(0);
});

test('the hook passes the transition types', async ({ page }) => {
  await open(page, '?duration=1000');
  await page.click('#hook-rotate');
  await expect.poll(() => activeTypes(page, 'hook-root')).toEqual(['rotate']);
  await waitForLog(page, 'hook-root: finished');
  expect(await activeTypes(page, 'hook-root')).toEqual([]);
});

test('the component sets the add and move types', async ({ page }) => {
  await open(page, '?duration=1000');
  await page.click('#component-add');
  await expect.poll(() => activeTypes(page, 'component-root')).toEqual(['add']);
  await waitForLog(page, 'component-root: finished');

  await page.click('#component-rotate');
  await expect.poll(() => activeTypes(page, 'component-root')).toEqual(['move']);
  await expect.poll(() => countInLog(page, 'component-root: finished')).toBe(2);
  expect(await texts(page, 'component-root')).toEqual(['2', '3', '4', '5', '1']);
  expect(await leftovers(page)).toBe(0);
});

test('nested groups animate independently', async ({ page }) => {
  await open(page, '?duration=600');
  await page.click('#a-rotate');
  await page.click('#outer-rotate');
  await waitForLog(page, 'outer-root: finished');
  await waitForLog(page, 'a-root: finished');
  const log = await vtLog(page);
  expect(log).not.toContain('a-root: aborted');
  expect(log).not.toContain('outer-root: aborted');
  expect(await texts(page, 'a-root')).toEqual(['2', '3', '1']);
  expect(await leftovers(page)).toBe(0);
});

test.describe('reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('updates without a transition', async ({ page }) => {
    await open(page);
    await page.click('#hook-rotate');
    await page.click('#component-add');
    await expect.poll(() => texts(page, 'component-root')).toHaveLength(5);
    expect(await texts(page, 'hook-root')).toEqual(['2', '3', '4', '5', '6', '1']);
    expect(await vtLog(page)).toEqual([]);
  });

  test('animates when respectReducedMotion is false', async ({ page }) => {
    await open(page, '?respect=0');
    await page.click('#hook-rotate');
    await waitForLog(page, 'hook-root: finished');
  });
});
