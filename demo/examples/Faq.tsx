import { useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
const [openId, setOpenId] = useState<string | null>(null);
const [faqRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
  childVtClass: 'faq',
});

<div ref={faqRef} className="faq">
  {QUESTIONS.map((item) => (
    <article key={item.id}>
      <button onClick={() => startTransition(() => setOpenId(...))}>
        {item.question}
      </button>
      {openId === item.id && <p>{item.answer}</p>}
    </article>
  ))}
</div>
`;

const CSS = `
/* keep the text crisp while the card grows */
::view-transition-old(.faq),
::view-transition-new(.faq) {
  height: 100%;
  object-fit: none;
  object-position: top;
}
`;

const QUESTIONS = [
  {
    id: 'what',
    question: 'What does the group animate?',
    answer:
      'Children that are added, removed or moved, and children whose size or content changes. Every direct child of the root is a separate view transition group.',
  },
  {
    id: 'when',
    question: 'Component or hook?',
    answer:
      'The hook wraps your own state update, so the old snapshot is the real old DOM and every change is animated. The component takes children from props: it animates changes of keys and order, and shows new children one frame later.',
  },
  {
    id: 'support',
    question: 'Which browsers are supported?',
    answer:
      'Browsers with element-scoped view transitions, see Browser support below. Other browsers update instantly, without animation.',
  },
  {
    id: 'css',
    question: 'How do I change the animation?',
    answer:
      'With CSS: ::view-transition-group, ::view-transition-old and ::view-transition-new with the class set by childVtClass.',
  },
];

export const Faq = () => {
  const [openId, setOpenId] = useState<string | null>(QUESTIONS[0].id);
  const respectReducedMotion = useRespectReducedMotion();
  const [faqRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
    childVtClass: 'faq',
    respectReducedMotion,
  });

  const toggle = (id: string) => {
    startTransition(() => {
      setOpenId((prev) => (prev === id ? null : id));
    });
  };

  return (
    <Example
      id="faq"
      title="Accordion"
      tags={['hook', 'size', 'content']}
      description={
        <>
          Nothing is added or removed here: an open card grows and the cards below slide down. The
          hook animates any change of size and position.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div ref={faqRef} className="faq">
        {QUESTIONS.map((item) => {
          const open = openId === item.id;
          return (
            <article key={item.id} className={open ? 'open' : undefined}>
              <button type="button" aria-expanded={open} onClick={() => toggle(item.id)}>
                <span>{item.question}</span>
                <span className="chevron" aria-hidden="true">
                  ›
                </span>
              </button>
              {open && <p>{item.answer}</p>}
            </article>
          );
        })}
      </div>
    </Example>
  );
};
