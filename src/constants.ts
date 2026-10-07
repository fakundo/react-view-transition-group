// ---------- Names ----------

export const COMPONENT_NAME = 'ViewTransitionGroup';
const HOOK_NAME = 'useViewTransitionGroup';

// ---------- Defaults ----------

export const DEFAULT_ROOT_TAG = 'div';
export const DEFAULT_CHILD_VT_CLASS = 'vtg-child';
export const DEFAULT_ROOT_VT_CLASS = 'vtg-root';

// ---------- CSS ----------

export const CSS_VT_CLASS = 'view-transition-class';
export const CSS_VT_NAME = 'view-transition-name';
/** A unique name per DOM node */
export const VT_NAME_MATCH_ELEMENT = 'match-element';
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// ---------- Warnings ----------

export const WARNING_HOOK_ROOT_NOT_FOUND =
  `[${HOOK_NAME}] The group root ref is not attached to an element, the update runs without animation. ` +
  `With ${COMPONENT_NAME}, a component passed to \`as\` must forward ref to a DOM element.`;

export const WARNING_TEXT_CHILD =
  `[${HOOK_NAME}] The group root has a text child: text can not be animated, ` +
  `wrap it into an element.`;

export const WARNING_CHILDREN_MISMATCH =
  `[${COMPONENT_NAME}] The number of child elements does not match the number of children. ` +
  `Every child must render exactly one element: no fragments, text or null.`;
