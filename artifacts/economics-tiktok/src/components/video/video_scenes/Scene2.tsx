import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Card, LessonTag, Screen, Tap } from '../FilmUI';

export function Scene2() {
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 2600, callback: () => setPhase(1) },
    { time: 4200, callback: () => setPhase(2) },
    { time: 6000, callback: () => setPhase(3) },
  ]);
  return (
    <Screen title="Lecture">
      <LessonTag />
      <h1 className="long-title">What economics is and why it matters</h1>
      <div className="segment-control">{['Short', 'Medium', 'Long'].map((length) => <span key={length} className={(phase === 0 ? 'Short' : 'Long') === length ? 'selected' : ''}>{length}</span>)}</div>
      <Card className="reading">
        <div className="eyebrow">THE IDEA</div>
        <h2>What is economics?</h2>
        <p>Economics studies how people use scarce resources. Every choice has a tradeoff.</p>
        {phase >= 1 && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} transition={{ duration: .55 }}>
          <p>Scarcity means time, income, and resources cannot satisfy every possible want.</p>
          <p>Opportunity cost is the value of the next-best alternative you give up.</p>
        </motion.div>}
      </Card>
      <div className="lesson-actions"><span className={phase >= 3 ? 'active' : ''}>Ask the tutor</span><span>Practice on this</span></div>
      <Tap x={phase < 2 ? '65%' : '82%'} y={phase < 2 ? '27%' : '32%'} pulse={phase === 1 || phase === 3} />
    </Screen>
  );
}