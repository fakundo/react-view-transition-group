import { useEffect, useRef, useState } from 'react';
import { ViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion } from '../ui';

const CODE = `
<ViewTransitionGroup as="ol" className="toasts" childVtClass="toast">
  {toasts.map((toast) => (
    <li key={toast.id} className={toast.kind}>
      {toast.text}
    </li>
  ))}
</ViewTransitionGroup>
`;

const CSS = `
/* slide in from the right, slide out to the right */
::view-transition-new(.toast):only-child {
  animation: slide-in 0.35s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
::view-transition-old(.toast):only-child {
  animation: slide-out 0.25s ease-in forwards;
}
`;

type ToastKind = 'success' | 'info' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  text: string;
}

const TOAST_TEXTS: Record<ToastKind, string> = {
  success: '✓ Changes saved',
  info: 'ℹ New version available',
  error: '✕ Connection lost',
};

const TOAST_KINDS: ToastKind[] = ['success', 'info', 'error'];
const TOAST_LIFETIME = 4000;
const MAX_TOASTS = 4;

export const Toasts = () => {
  const respectReducedMotion = useRespectReducedMotion();
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => {
        clearTimeout(timer);
      });
    };
  }, []);

  const dismiss = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const notify = (kind: ToastKind) => {
    const id = nextIdRef.current++;
    setToasts((prev) => [...prev, { id, kind, text: TOAST_TEXTS[kind] }].slice(-MAX_TOASTS));
    const timer = setTimeout(() => {
      timersRef.current.delete(timer);
      dismiss(id);
    }, TOAST_LIFETIME);
    timersRef.current.add(timer);
  };

  return (
    <Example
      id="toasts"
      title="Notifications"
      tags={['component', 'enter', 'exit', 'custom animation']}
      description={
        <>
          Toasts slide in, the stack makes room, and each toast leaves after four seconds or on
          click. The component does not need any changes in your state code.
        </>
      }
      code={CODE}
      css={CSS}
    >
      <div className="toolbar">
        {TOAST_KINDS.map((kind) => (
          <button key={kind} type="button" className={`kind-${kind}`} onClick={() => notify(kind)}>
            {kind}
          </button>
        ))}
      </div>
      <div className="toast-area">
        <ViewTransitionGroup
          respectReducedMotion={respectReducedMotion}
          as="ol"
          className="toasts"
          childVtClass="toast"
        >
          {toasts.map((toast) => (
            <li key={toast.id} className={toast.kind}>
              <button type="button" onClick={() => dismiss(toast.id)}>
                {toast.text}
              </button>
            </li>
          ))}
        </ViewTransitionGroup>
      </div>
    </Example>
  );
};
