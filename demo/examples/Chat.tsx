import { useLayoutEffect, useRef, useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
const [chatRef, startTransition] = useViewTransitionGroup<HTMLOListElement>({
  childVtClass: 'message',
});

// runs inside the update, so the new snapshot is already scrolled down
const lastId = messages[messages.length - 1]?.id;
useLayoutEffect(() => {
  if (lastId !== undefined) {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
  }
}, [lastId]);

<ol ref={chatRef} className="chat">
  {messages.map((message) => (
    <li key={message.id} className={message.author}>{message.text}</li>
  ))}
</ol>
`;

const CSS = `
/* the chat is its own scroll container: keep the wheel working during a transition */
.chat::view-transition {
  pointer-events: none;
}

/* a new message slides up */
.chat::view-transition-new(.message):only-child {
  animation: message-in 0.3s both;
}
`;

type Author = 'me' | 'bot';

interface Message {
  id: number;
  author: Author;
  text: string;
}

const TEXTS: Record<Author, string[]> = {
  me: ['Hi! 👋', 'How is the release going?', 'Can I help with the tests?', 'Great, thanks!'],
  bot: ['Hello!', 'Almost done, a few bugs left.', 'Sure, take the e2e tests.', 'Anytime 🙂'],
};

const INITIAL_MESSAGES: Message[] = [
  { id: 1, author: 'bot', text: 'Welcome to the chat.' },
  { id: 2, author: 'me', text: 'Hi! 👋' },
  { id: 3, author: 'bot', text: 'Send a message or click one to delete it.' },
];

export const Chat = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const nextIdRef = useRef(INITIAL_MESSAGES.length + 1);
  const [chatRef, startTransition] = useViewTransitionGroup<HTMLOListElement>({
    respectReducedMotion,
    childVtClass: 'message',
  });

  // Inside the update, so the new snapshot is already scrolled down
  const lastId = messages[messages.length - 1]?.id;
  useLayoutEffect(() => {
    if (lastId !== undefined) {
      chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight });
    }
  }, [chatRef, lastId]);

  const send = (author: Author) => {
    const id = nextIdRef.current++;
    const texts = TEXTS[author];
    startTransition(() => {
      setMessages((prev) => [...prev, { id, author, text: texts[id % texts.length] }]);
    });
  };

  const remove = (id: number) => {
    startTransition(() => {
      setMessages((prev) => prev.filter((message) => message.id !== id));
    });
  };

  return (
    <Example
      id="chat"
      title="Chat"
      tags={['hook', 'enter', 'exit', 'scroll container']}
      description={
        <>
          The group is its own scroll container. A layout effect scrolls it down inside the update,
          so the new message slides in at the bottom. The transition is clipped by the container,
          and <code>pointer-events: none</code> on <code>::view-transition</code> keeps the wheel
          working.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div className="toolbar">
        <button type="button" onClick={() => send('me')}>
          Send
        </button>
        <button type="button" onClick={() => send('bot')}>
          Get a reply
        </button>
      </div>
      <ol ref={chatRef} className="chat">
        {messages.map((message) => (
          <li key={message.id} className={message.author}>
            <button type="button" onClick={() => remove(message.id)}>
              {message.text}
            </button>
          </li>
        ))}
      </ol>
    </Example>
  );
};
