import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Card, Screen, Tap } from '../FilmUI';

export function Scene4() {
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 700, callback: () => setPhase(1) },
    { time: 1400, callback: () => setPhase(2) },
    { time: 2100, callback: () => setPhase(3) },
    { time: 2800, callback: () => setPhase(4) },
    { time: 3900, callback: () => setPhase(5) },
    { time: 5300, callback: () => setPhase(6) },
  ]);
  return (
    <Screen title="Analytics" tab="Analytics">
      <h1>Course Progress</h1>
      <p className="lead">Your progress across Economics 101</p>
      <div className="metric-row">
        <Card><small>LECTURES</small><b>{phase >= 2 ? 4 : phase >= 1 ? 2 : 0} <em>/ 28</em></b></Card>
        <Card><small>ASSIGNMENTS</small><b>{phase >= 2 ? 1 : 0} <em>/ 12</em></b></Card>
      </div>
      <div className="progress-line"><motion.i animate={{ width: phase >= 2 ? '14%' : '0%' }} /></div>
      <h2>Topic Mastery</h2>
      <Card className="list-card topic-list">
        <motion.div className={`topic-row ${phase >= 6 ? 'selected-row' : ''}`} animate={{ opacity: phase >= 3 ? 1 : 0 }}>
          <strong>Supply, demand, and market equilibrium</strong><span className="status amber">Practice again</span>
        </motion.div>
        <motion.div className="topic-row" animate={{ opacity: phase >= 4 ? 1 : 0 }}>
          <strong>Scarcity, choice, and opportunity cost</strong><span className="status green">Strong</span>
        </motion.div>
        <motion.div className="topic-row" animate={{ opacity: phase >= 5 ? 1 : 0 }}>
          <strong>Elasticity and market response</strong><span className="status">Not started</span>
        </motion.div>
      </Card>
      <Tap x="53%" y="58%" pulse={phase === 6} />
    </Screen>
  );
}