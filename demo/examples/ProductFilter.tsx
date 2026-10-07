import { useState } from 'react';
import { ViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
const visible = PRODUCTS.filter(
  (product) => (category === 'all' || product.category === category)
    && product.name.toLowerCase().includes(query.toLowerCase()),
);

<ViewTransitionGroup className="products" childVtClass="product">
  {visible.map((product) => (
    <article key={product.name}>
      <span className="emoji">{product.emoji}</span>
      {product.name}
    </article>
  ))}
</ViewTransitionGroup>
`;

type Category = 'all' | 'fruit' | 'vegetable' | 'berry';

const CATEGORIES: { id: Category; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'fruit', label: 'Fruits' },
  { id: 'vegetable', label: 'Vegetables' },
  { id: 'berry', label: 'Berries' },
];

const PRODUCTS: { name: string; emoji: string; category: Category }[] = [
  { name: 'Apple', emoji: '🍎', category: 'fruit' },
  { name: 'Carrot', emoji: '🥕', category: 'vegetable' },
  { name: 'Strawberry', emoji: '🍓', category: 'berry' },
  { name: 'Banana', emoji: '🍌', category: 'fruit' },
  { name: 'Broccoli', emoji: '🥦', category: 'vegetable' },
  { name: 'Watermelon', emoji: '🍉', category: 'berry' },
  { name: 'Pear', emoji: '🍐', category: 'fruit' },
  { name: 'Eggplant', emoji: '🍆', category: 'vegetable' },
  { name: 'Cherry', emoji: '🍒', category: 'berry' },
  { name: 'Peach', emoji: '🍑', category: 'fruit' },
  { name: 'Corn', emoji: '🌽', category: 'vegetable' },
  { name: 'Grapes', emoji: '🍇', category: 'berry' },
];

export const ProductFilter = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [category, setCategory] = useState<Category>('all');
  const [query, setQuery] = useState('');

  const visible = PRODUCTS.filter(
    (product) =>
      (category === 'all' || product.category === category) &&
      product.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  return (
    <Example
      id="filter"
      title="Filter and search"
      tags={['component', 'enter', 'exit', 'move']}
      description={
        <>
          Filtering is plain derived state, the component sees new children and animates the
          difference. Type fast: a new transition interrupts the running one.
        </>
      }
      code={CODE}
    >
      <div className="toolbar">
        <div className="chips" role="radiogroup" aria-label="Category">
          {CATEGORIES.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={category === item.id}
              onClick={() => setCategory(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search…"
          aria-label="Search"
        />
      </div>
      <ViewTransitionGroup
        respectReducedMotion={respectReducedMotion}
        className="products"
        childVtClass="product"
      >
        {visible.map((product) => (
          <article key={product.name}>
            <span className="emoji">{product.emoji}</span>
            {product.name}
          </article>
        ))}
      </ViewTransitionGroup>
      {visible.length === 0 && <p className="empty">Nothing found</p>}
    </Example>
  );
};
