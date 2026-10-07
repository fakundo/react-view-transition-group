import { useEffect, useState } from 'react';
import { useViewTransitionGroup } from '../../src';
import { Example, useRespectReducedMotion, randomInt } from '../ui';

const CODE = `
const [players, setPlayers] = useState(INITIAL_PLAYERS);
const [running, setRunning] = useState(0);
const [boardRef, startTransition] = useViewTransitionGroup<HTMLOListElement>({
  childVtClass: 'row',
  // an interrupted transition ends too, so count them
  onTransitionStart: () => setRunning((count) => count + 1),
  onTransitionEnd: () => setRunning((count) => count - 1),
});

const playRound = () => {
  startTransition(() => {
    setPlayers((prev) => sortByScore(prev.map(addRandomPoints)));
  });
};

<ol ref={boardRef} className="board">
  {players.map((player, index) => (
    <li key={player.name}>
      <span className="rank">{index + 1}</span>
      <span>{player.name}</span>
      <span className="score">{player.score}</span>
    </li>
  ))}
</ol>
`;

interface Player {
  name: string;
  emoji: string;
  score: number;
}

const INITIAL_PLAYERS: Player[] = [
  { name: 'Ada', emoji: '🦊', score: 120 },
  { name: 'Linus', emoji: '🐧', score: 110 },
  { name: 'Grace', emoji: '🦉', score: 95 },
  { name: 'Alan', emoji: '🐢', score: 80 },
  { name: 'Barbara', emoji: '🐙', score: 70 },
  { name: 'Ken', emoji: '🦔', score: 60 },
];

const ROUND_INTERVAL = 1600;

const sortByScore = (players: Player[]) => [...players].sort((a, b) => b.score - a.score);

const addRandomPoints = (player: Player) => ({ ...player, score: player.score + randomInt(0, 40) });

export const Leaderboard = () => {
  const [players, setPlayers] = useState(INITIAL_PLAYERS);
  const [autoplay, setAutoplay] = useState(false);
  const [running, setRunning] = useState(0);
  const [finished, setFinished] = useState(0);
  const respectReducedMotion = useRespectReducedMotion();
  const [boardRef, startTransition] = useViewTransitionGroup<HTMLOListElement>({
    respectReducedMotion,
    childVtClass: 'row',
    onTransitionStart: () => {
      setRunning((count) => count + 1);
    },
    onTransitionEnd: () => {
      setRunning((count) => count - 1);
      setFinished((count) => count + 1);
    },
  });

  const playRound = () => {
    startTransition(() => {
      setPlayers((prev) => sortByScore(prev.map(addRandomPoints)));
    });
  };

  useEffect(() => {
    if (!autoplay) {
      return;
    }
    const timer = setInterval(() => {
      startTransition(() => {
        setPlayers((prev) => sortByScore(prev.map(addRandomPoints)));
      });
    }, ROUND_INTERVAL);
    return () => {
      clearInterval(timer);
    };
  }, [autoplay, startTransition]);

  return (
    <Example
      id="leaderboard"
      title="Leaderboard"
      tags={['hook', 'move', 'content', 'events']}
      description={
        <>
          Scores change and the rows overtake each other. Rank and score are new content of the same
          row, so they cross-fade while the row slides to its place. The status comes from{' '}
          <code>onTransitionStart</code> and <code>onTransitionEnd</code>.
        </>
      }
      code={CODE}
    >
      <div className="toolbar">
        <button type="button" onClick={playRound}>
          Play a round
        </button>
        <label className="switch">
          <input
            type="checkbox"
            checked={autoplay}
            onChange={(event) => setAutoplay(event.target.checked)}
          />
          Autoplay
        </label>
        <button
          type="button"
          className="link"
          onClick={() => {
            startTransition(() => {
              setPlayers(INITIAL_PLAYERS);
            });
          }}
        >
          Reset
        </button>
        <span className="status" aria-live="polite">
          {running > 0 ? 'Animating…' : 'Idle'} · {finished}{' '}
          {finished === 1 ? 'transition' : 'transitions'}
        </span>
      </div>
      <ol ref={boardRef} className="board">
        {players.map((player, index) => (
          <li key={player.name}>
            <span className="rank">{index + 1}</span>
            <span className="avatar">{player.emoji}</span>
            <span className="name">{player.name}</span>
            <span className="score">{player.score}</span>
          </li>
        ))}
      </ol>
    </Example>
  );
};
