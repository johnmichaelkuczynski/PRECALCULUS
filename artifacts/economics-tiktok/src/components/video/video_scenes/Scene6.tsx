import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Card, Screen, Tap } from '../FilmUI';

export function Scene6() {
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 1200, callback: () => setPhase(1) },
    { time: 1600, callback: () => setPhase(2) },
    { time: 2600, callback: () => setPhase(3) },
    { time: 3600, callback: () => setPhase(4) },
    { time: 4600, callback: () => setPhase(5) },
  ]);
  return (
    <Screen title="Assignments" tab="Assignments">
      {phase < 2 ? <>
        <h1>Week 1</h1><p className="lead">Your submitted work and feedback.</p>
        <h2>Reviewed work</h2>
        <Card className={`assignment-item ${phase === 1 ? 'selected-card' : ''}`}>
          <div className="eyebrow">HOMEWORK 1.1 <span className="status green">Reviewed</span></div>
          <h3>Scarcity, choice, and opportunity cost</h3>
          <p>Open review <span className="arrow">↗</span></p>
        </Card>
        <Card className="assignment-item subdued"><div className="eyebrow">HOMEWORK 1.2</div><h3>Supply and demand</h3></Card>
      </> : <>
        <div className="eyebrow">WEEK 1 · HOMEWORK 1.1</div>
        <h1 className="long-title">Review: Homework 1.1</h1>
        <Card className="review-question">
          <div className="eyebrow">QUESTION &amp; YOUR ANSWER</div>
          <p>You study instead of working a shift that pays $40. What is the opportunity cost?</p>
          <div className="submitted"><small>YOU ANSWERED</small><strong>$40 in forgone wages</strong></div>
        </Card>
        {phase >= 3 && <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="review-feedback">
            <div className="success">✓ Correct</div>
            <h2>AI Tutor Feedback</h2>
            <p>The $40 in forgone wages is the opportunity cost of studying.</p>
            {phase >= 5 && <p>Compare the next-best alternative, not only the direct price.</p>}
          </Card>
        </motion.div>}
      </>}
      {phase < 2 && <Tap x="50%" y="50%" pulse={phase === 1} />}
    </Screen>
  );
}