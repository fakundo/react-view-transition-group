import { useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
const [carouselRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
  childVtClass: 'slide',
});

// the direction is a transition type, matched in CSS
const goTo = (next: number, direction: 'next' | 'prev') => {
  startTransition(() => setIndex(next), { types: [direction] });
};

// one element with new content: its old and new snapshots slide
<div ref={carouselRef} className="carousel">
  <article>…</article>
</div>
`;

const CSS = `
.carousel:active-view-transition-type(next)::view-transition-new(.slide) {
  animation: from-right 0.4s both;
}
.carousel:active-view-transition-type(next)::view-transition-old(.slide) {
  animation: to-left 0.4s both;
}
.carousel:active-view-transition-type(prev)::view-transition-new(.slide) {
  animation: from-left 0.4s both;
}
.carousel:active-view-transition-type(prev)::view-transition-old(.slide) {
  animation: to-right 0.4s both;
}
`;

const SLIDES = [
  { id: 1, emoji: '🌅', title: 'Sunrise', color: 'oklch(0.85 0.1 60)' },
  { id: 2, emoji: '🌊', title: 'Ocean', color: 'oklch(0.82 0.1 230)' },
  { id: 3, emoji: '🌿', title: 'Forest', color: 'oklch(0.84 0.1 150)' },
  { id: 4, emoji: '🌌', title: 'Night', color: 'oklch(0.75 0.1 290)' },
  { id: 5, emoji: '🌸', title: 'Spring', color: 'oklch(0.86 0.08 350)' },
];

export const Carousel = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [index, setIndex] = useState(0);
  const [carouselRef, startTransition] = useViewTransitionGroup<HTMLDivElement>({
    respectReducedMotion,
    childVtClass: 'slide',
  });

  const goTo = (next: number, direction: 'next' | 'prev') => {
    startTransition(
      () => {
        setIndex((next + SLIDES.length) % SLIDES.length);
      },
      { types: [direction] },
    );
  };

  const slide = SLIDES[index];

  return (
    <Example
      id="carousel"
      title="Carousel"
      tags={['hook', 'content', 'transition types']}
      description={
        <>
          The slide is one element, only its content changes: the old snapshot leaves, the new one
          enters. The direction is a transition type, <code>next</code> or <code>prev</code>, so CSS
          slides them the right way.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div className="carousel-frame">
        <button type="button" aria-label="Previous" onClick={() => goTo(index - 1, 'prev')}>
          ‹
        </button>
        <div ref={carouselRef} className="carousel">
          <article style={{ background: slide.color }}>
            <span>{slide.emoji}</span>
            <strong>{slide.title}</strong>
          </article>
        </div>
        <button type="button" aria-label="Next" onClick={() => goTo(index + 1, 'next')}>
          ›
        </button>
      </div>
      <div className="dots">
        {SLIDES.map((item, itemIndex) => (
          <button
            key={item.id}
            type="button"
            aria-label={item.title}
            aria-current={itemIndex === index}
            onClick={() => {
              if (itemIndex !== index) {
                goTo(itemIndex, itemIndex > index ? 'next' : 'prev');
              }
            }}
          />
        ))}
      </div>
    </Example>
  );
};
