import { useState } from 'react';
import { useSceneTimer } from '@/lib/video';
import { Card, Screen, Tap } from '../FilmUI';

const question = 'Why does a price above equilibrium create a surplus?';
const reply = [
  'When price rises above equilibrium, sellers offer more than buyers want.',
  'The unsold goods are a surplus.',
  'That puts downward pressure on price until quantity supplied and demanded move closer together.',
];

export function Scene3() {
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 700, callback: () => setPhase(1) },
    { time: 1300, callback: () => setPhase(2) },
    { time: 2300, callback: () => setPhase(3) },
    { time: 3100, callback: () => setPhase(4) },
    { time: 3900, callback: () => setPhase(5) },
    { time: 4900, callback: () => setPhase(6) },
    { time: 5900, callback: () => setPhase(7) },
    { time: 7100, callback: () => setPhase(8) },
  ]);
  return (
    <Screen title="Ask the tutor" tab={phase >= 8 ? 'Analytics' : 'Dashboard'}>
      <div className="eyebrow">LECTURE 1.1</div>
      <h1 className="long-title">What economics is and why it matters</h1>
      <div className="tutor-tabs"><span className="active">Ask the tutor</span><span>Practice on this</span></div>
      <Card className="lesson-context">
        <div className="eyebrow">FROM THE LESSON</div>
        <h2>Prices and choices</h2>
        <p>At market equilibrium, quantity supplied equals quantity demanded.</p>
        <p>A price above equilibrium leaves sellers with more goods than buyers want.</p>
      </Card>
      <div className="conversation">
        {phase >= 3 && <div className="chat-question">{question}</div>}
        {phase === 3 && <Card className="chat-reply"><span className="typing-dots">•••</span></Card>}
        {phase >= 4 && <Card className="chat-reply">
          <div className="eyebrow">ECONOMICS TUTOR</div>
          {reply.slice(0, phase >= 7 ? 3 : phase >= 6 ? 2 : 1).map((line) => <p key={line}>{line}</p>)}
        </Card>}
      </div>
      <div className="chat-input">{phase === 1 ? 'Why does a price above…' : phase === 2 ? question : 'Ask a question about this lesson…'} <span className="send-arrow">↑</span></div>
      <Tap x={phase >= 7 ? '9%' : phase < 3 ? '86%' : '80%'} y={phase >= 7 ? '33%' : phase < 3 ? '87%' : '85%'} pulse={phase === 3 || phase === 8} />
    </Screen>
  );
}