import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSceneTimer } from '@/lib/video';
import { Card, Screen, Tap } from '../FilmUI';

export function Scene1() {
  const [phase, setPhase] = useState(0);
  useSceneTimer([
    { time: 1350, callback: () => setPhase(1) },
    { time: 2800, callback: () => setPhase(2) },
    { time: 5300, callback: () => setPhase(3) },
    { time: 5800, callback: () => setPhase(4) },
  ]);
  return (
    <Screen title={phase < 2 ? 'Dashboard' : 'Your course'}>
      {phase < 2 ? <>
        <div className="eyebrow">YOUR COURSE</div>
        <h1>Economics</h1>
        <p className="lead">A clear path through the ideas that shape everyday decisions.</p>
        <div className="metric-row">
          <Card><small>COURSE LENGTH</small><b>4 weeks</b></Card>
          <Card><small>START HERE</small><b>Week 1</b></Card>
        </div>
        <h2>Course Schedule</h2>
        <Card className={`week-card ${phase >= 1 ? 'selected-card' : ''}`}>
          <div className="eyebrow">WEEK 1 <span className="arrow">↗</span></div>
          <h3>Foundations of choice and markets</h3>
          <p>7 lectures · 3 assignments</p>
          <div className="mini-progress"><i /></div>
        </Card>
        <Card className="week-card subdued">
          <div className="eyebrow">WEEK 2</div>
          <h3>Firms, consumers, and market structure</h3>
        </Card>
      </> : <>
        <div className="eyebrow">WEEK 1 · 7 LECTURES</div>
        <h1 className="long-title">Foundations of choice and markets</h1>
        <p className="lead">Build the tools for thinking about scarcity, markets, and tradeoffs.</p>
        <h2>Lectures</h2>
        <Card className="list-card">
          <div className={`list-row ${phase >= 3 ? 'selected-row' : ''}`}><span className="row-number">01</span><strong>What economics is and why it matters</strong><span>›</span></div>
          <div className="list-row"><span className="row-number">02</span><strong>Scarcity, choice, and opportunity cost</strong><span>›</span></div>
          <div className="list-row"><span className="row-number">03</span><strong>Supply, demand, and market equilibrium</strong><span>›</span></div>
        </Card>
        <motion.div className="lesson-preview" animate={{ opacity: phase >= 4 ? 1 : 0, y: phase >= 4 ? 0 : 16 }}>
          Opening lecture 1.1…
        </motion.div>
      </>}
      <Tap x={phase < 2 ? '46%' : '48%'} y={phase < 2 ? '63%' : '47%'} pulse={phase === 2 || phase === 4} />
    </Screen>
  );
}