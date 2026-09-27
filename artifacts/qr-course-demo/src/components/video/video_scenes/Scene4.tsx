import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Scene4({ setCursorPos, setIsClicking }: { setCursorPos: (pos: {x: string, y: string}) => void, setIsClicking: (val: boolean) => void }) {
  const [phase, setPhase] = useState(0);
  const [kpi1, setKpi1] = useState(0);
  const [kpi2, setKpi2] = useState(0);
  const [kpi3, setKpi3] = useState(0);
  const [kpi4, setKpi4] = useState(0);
  const [kpi5, setKpi5] = useState(0);

  useEffect(() => {
    // 0-1.5s: Cursor to sidebar "Analytics", clicks. Crossfade.
    // 1.5-4.0s: KPI tiles count up.
    // 4.0-6.0s: Topic Mastery rows stagger in.
    // 6.0-8.5s: Cursor to "Ratios and proportions", click.
    // 8.5-10s: Crossfade begins.

    setCursorPos({ x: '65vw', y: '90vh' }); // Start where Scene 3 left off
    
    const t1 = setTimeout(() => {
      setCursorPos({ x: '10vw', y: '30vh' }); // Move to Analytics nav
    }, 500);

    const t2 = setTimeout(() => {
      setIsClicking(true);
      setPhase(1); // Nav clicked
    }, 1300);

    const t3 = setTimeout(() => {
      setIsClicking(false);
      setPhase(2); // Crossfade to Analytics content
    }, 1500);

    // Number ticker logic
    const t4 = setTimeout(() => {
      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        setKpi1(Math.min(100, Math.floor(step * 4)));
        setKpi2(Math.min(100, Math.floor(step * 3.8)));
        setKpi3(Math.min(24, Math.floor(step * 0.9)));
        setKpi4(Math.min(4, Math.floor(step * 0.2)));
        setKpi5(Math.min(1, Math.floor(step * 0.05)));
        if (step > 30) clearInterval(interval);
      }, 50);
    }, 1500);

    const t5 = setTimeout(() => {
      setPhase(3); // Rows stagger in
    }, 4000);

    const t6 = setTimeout(() => {
      setCursorPos({ x: '40vw', y: '65vh' }); // Move to Ratios row
    }, 6000);

    const t7 = setTimeout(() => {
      setPhase(4); // Hover effect
      setIsClicking(true);
    }, 8300);

    const t8 = setTimeout(() => {
      setIsClicking(false);
      setPhase(5); // Click flash & end
    }, 8500);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearTimeout(t5); clearTimeout(t6); clearTimeout(t7); clearTimeout(t8);
    };
  }, [setCursorPos, setIsClicking]);

  const rows = [
    { topic: 'What economics is and why it matters', week: 'Week 1', att: 0, acc: 0, stat: 'UNTESTED', statColor: 'text-muted-foreground bg-muted' },
    { topic: 'Scarcity, choice, and opportunity cost', week: 'Week 1', att: 1, acc: 1, stat: 'STRONG', statColor: 'text-emerald-700 bg-emerald-50' },
    { topic: 'Supply, demand, and market equilibrium', week: 'Week 1', att: 1, acc: 1, stat: 'STRONG', statColor: 'text-emerald-700 bg-emerald-50' },
    { topic: 'Elasticity and market response', week: 'Week 1', att: 0, acc: 0, stat: 'UNTESTED', statColor: 'text-muted-foreground bg-muted' },
    { topic: 'Consumer choice and utility', week: 'Week 1', att: 0, acc: 0, stat: 'UNTESTED', statColor: 'text-muted-foreground bg-muted' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <AnimatePresence>
        {phase >= 2 && (
          <motion.div 
            className="w-full h-full p-12 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-4xl font-serif text-primary mb-8 tracking-tight">Analytics</h1>
            
            <div className="grid grid-cols-5 gap-4 mb-10">
              <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Course Average</div>
                <div className="text-3xl font-light">{kpi1}%</div>
              </div>
              <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Practice Accuracy</div>
                <div className="text-3xl font-light">{kpi2}%</div>
              </div>
              <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Assignments</div>
                <div className="text-3xl font-light">{kpi3}</div>
              </div>
              <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Practice Count</div>
                <div className="text-3xl font-light">{kpi4}</div>
              </div>
              <div className="bg-white border border-border p-5 rounded-xl shadow-sm">
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Streak (Days)</div>
                <div className="text-3xl font-light">{kpi5}</div>
              </div>
            </div>

            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-5 border-b border-border bg-background/50">
                <h3 className="font-serif text-xl">Topic Mastery</h3>
              </div>
              
              <div className="w-full">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/20">
                  <div className="col-span-5">Topic</div>
                  <div className="col-span-2">Week</div>
                  <div className="col-span-2">Attempts</div>
                  <div className="col-span-1">Accuracy</div>
                  <div className="col-span-2 text-right">Status</div>
                </div>
                
                <div className="divide-y divide-border">
                  {rows.map((row, i) => (
                    <motion.div 
                      key={i}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors ${i === 2 && phase >= 4 ? 'bg-primary/5 cursor-pointer' : ''}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={phase >= 3 ? { opacity: 1, y: 0 } : {}}
                      transition={{ delay: phase >= 3 ? i * 0.06 : 0, duration: 0.4 }}
                    >
                      <div className="col-span-5 font-medium text-sm text-primary">{row.topic}</div>
                      <div className="col-span-2 text-sm text-muted-foreground">{row.week}</div>
                      <div className="col-span-2 text-sm">{row.att}</div>
                      <div className="col-span-1 text-sm">{row.acc}%</div>
                      <div className="col-span-2 text-right">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider ${row.statColor}`}>
                          {row.stat}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}