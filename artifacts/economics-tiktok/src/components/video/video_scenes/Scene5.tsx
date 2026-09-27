import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Card, Screen, Tap } from '../FilmUI';

export function Scene5() {
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 1500, callback: () => setPhase(1) },
    { time: 2200, callback: () => setPhase(2) },
    { time: 3000, callback: () => setPhase(3) },
    { time: 3800, callback: () => setPhase(4) },
    { time: 4800, callback: () => setPhase(5) },
    { time: 6100, callback: () => setPhase(6) },
    { time: 6800, callback: () => setPhase(7) },
  ]);
  return (
    <Screen title="Topic Practice" tab={phase >= 7 ? 'Assignments' : 'Analytics'}>
      <div className="eyebrow">WEEK 1 · TOPIC PRACTICE</div>
      <h1 className="long-title">Supply, demand, and market equilibrium</h1>
      <Card className="problem">
        <div className="eyebrow">QUESTION 01</div>
        <p>Demand: <strong>Qd = 100 − 2P</strong><br />Supply: <strong>Qs = 20 + 2P</strong></p>
        <h2>What price clears the market?</h2>
      </Card>
      <div className="answer-row"><div className="answer-field">{phase >= 3 ? 'P = 20' : phase >= 2 ? 'P = ' : phase >= 1 ? 'P' : 'Type your answer…'}</div><div className={`submit ${phase === 4 ? 'pressed' : ''}`}>Submit</div></div>
      {phase >= 4 ? <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="feedback"><div className="success">✓ Correct!</div><p>At equilibrium Qd = Qs.</p><p>100 − 2P = 20 + 2P<br />80 = 4P<br /><strong>P = 20</strong></p></Card>
      </motion.div> : <Card className="keyboard"><div className="eyebrow">ECONOMICS KEYBOARD</div><div className="keys">{['P', 'Q', 'Qd', 'Qs', '=', '−', '+', '20'].map(k => <span key={k}>{k}</span>)}</div></Card>}
      <Tap x={phase >= 6 ? '9%' : phase >= 3 ? '72%' : '40%'} y={phase >= 6 ? '26%' : phase >= 3 ? '62%' : '62%'} pulse={phase === 4 || phase === 7} />
    </Screen>
  );
}