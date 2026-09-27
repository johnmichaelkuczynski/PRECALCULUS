import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { StreamingText } from '../StreamingText';

export function Scene6({ setCursorPos, setIsClicking }: { setCursorPos: (pos: {x: string, y: string}) => void, setIsClicking: (val: boolean) => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // 0-1.5s: Cursor to sidebar "Assignments", clicks.
    // 1.5-3.0s: Cards stagger-fade in.
    // 3.0-4.5s: Cursor to "Homework 1.1", hover, click.
    // 4.5-6.0s: Crossfade to assignment results.
    // 6.0-8.0s: AI feedback streams in.
    // 8.0-10s: AI detection appears. Scene ends.

    setCursorPos({ x: '70vw', y: '60vh' }); // Start where Scene 5 left off
    
    const t1 = setTimeout(() => {
      setCursorPos({ x: '10vw', y: '23vh' }); // Move to Assignments nav
    }, 500);

    const t2 = setTimeout(() => {
      setIsClicking(true);
      setPhase(1); // Nav clicked
    }, 1300);

    const t3 = setTimeout(() => {
      setIsClicking(false);
      setPhase(2); // Crossfade to Assignments
    }, 1500);

    const t4 = setTimeout(() => {
      setPhase(3); // Cards stagger in
    }, 2000);

    const t5 = setTimeout(() => {
      setCursorPos({ x: '60vw', y: '40vh' }); // Move to HW 1.1 review
    }, 3000);

    const t6 = setTimeout(() => {
      setIsClicking(true);
      setPhase(4); // Hover effect & click
    }, 4200);

    const t7 = setTimeout(() => {
      setIsClicking(false);
      setPhase(5); // Crossfade to results
    }, 4500);

    const t8 = setTimeout(() => {
      setPhase(6); // Feedback stream starts
    }, 6000);

    const t9 = setTimeout(() => {
      setPhase(7); // AI detection appears
      setCursorPos({ x: '95vw', y: '90vh' }); // Move cursor away
    }, 8000);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4);
      clearTimeout(t5); clearTimeout(t6); clearTimeout(t7); clearTimeout(t8); clearTimeout(t9);
    };
  }, [setCursorPos, setIsClicking]);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.5 } }} // gentle fade at loop end
    >
      <AnimatePresence mode="wait">
        {phase >= 2 && phase < 5 ? (
          <motion.div 
            key="assignmentsList"
            className="w-full h-full p-12 overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-serif text-primary mb-2 tracking-tight">Assignments</h1>
            <p className="text-muted-foreground mb-12">Complete your homework, tests, midterm, and final exams.</p>
            
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-4">Week 1</h3>
            
            <div className="space-y-4">
              {/* Card 1 */}
              <motion.div 
                className={`bg-white border p-6 rounded-xl flex items-center justify-between shadow-sm transition-colors ${phase >= 4 ? 'bg-muted/50 border-primary/30' : 'border-border'}`}
                initial={{ opacity: 0, x: -20 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4 }}
              >
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Homework</div>
                  <h4 className="font-serif text-lg text-primary mb-1">Homework 1.1 — Scarcity, choice, and opportunity cost</h4>
                  <div className="text-sm text-muted-foreground">4 problems</div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Score</div>
                    <div className="font-medium text-emerald-600">100%</div>
                  </div>
                  <div className="px-4 py-2 border border-border rounded-lg text-sm font-medium bg-background text-foreground shadow-sm cursor-pointer">
                    Review Results
                  </div>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                className="bg-white border border-border p-6 rounded-xl flex items-center justify-between shadow-sm opacity-70"
                initial={{ opacity: 0, x: -20 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.1 }}
              >
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Homework</div>
                  <h4 className="font-serif text-lg text-primary mb-1">Homework 1.2 — Supply, demand, and elasticity</h4>
                  <div className="text-sm text-muted-foreground">4 problems</div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Score</div>
                    <div className="font-medium text-emerald-600">100%</div>
                  </div>
                  <div className="px-4 py-2 border border-border rounded-lg text-sm font-medium bg-background text-foreground shadow-sm">
                    Review Results
                  </div>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                className="bg-white border border-border p-6 rounded-xl flex items-center justify-between shadow-sm opacity-70"
                initial={{ opacity: 0, x: -20 }}
                animate={phase >= 3 ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <div>
                  <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">Test</div>
                  <h4 className="font-serif text-lg text-primary mb-1">Week 1 Test</h4>
                  <div className="text-sm text-muted-foreground">5 problems · 30 min</div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Score</div>
                    <div className="font-medium text-emerald-600">100%</div>
                  </div>
                  <div className="px-4 py-2 border border-border rounded-lg text-sm font-medium bg-background text-foreground shadow-sm">
                    Review Results
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        ) : phase >= 5 ? (
          <motion.div 
            key="assignmentDetail"
            className="w-full h-full p-12 overflow-y-auto"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
              <span>Assignments</span>
              <span>/</span>
              <span className="text-primary font-medium">Homework 1.1</span>
            </div>
            
            <h1 className="text-3xl font-serif text-primary mb-8 tracking-tight">Review: Homework 1.1</h1>

            <div className="bg-white border border-border rounded-xl shadow-sm p-8 mb-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-emerald-100 text-emerald-700 px-4 py-1.5 text-xs font-bold tracking-widest rounded-bl-xl border-b border-l border-emerald-200">GRADED</div>
              
              <h3 className="font-medium text-lg mb-6 max-w-2xl text-foreground">Q1. A student chooses between studying and working. If studying costs $40 in wages and yields $100 in additional future income, state the opportunity cost of studying.</h3>
              
              <div className="w-fit mb-6">
                <div className="text-xs text-muted-foreground mb-2">Your answer:</div>
                <div className="px-6 py-3 bg-muted/30 border border-border rounded-lg text-lg font-mono">Opportunity cost = $40</div>
              </div>

              <AnimatePresence>
                {phase >= 6 && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="bg-blue-50 border border-blue-100 rounded-lg p-5"
                  >
                    <div className="flex items-center space-x-2 text-blue-800 font-bold text-xs mb-2 uppercase tracking-widest">
                      <div className="w-5 h-5 rounded bg-blue-200 flex items-center justify-center">✦</div>
                      <span>AI Tutor Feedback</span>
                    </div>
                    <div className="text-sm text-blue-900 leading-relaxed">
                      <StreamingText text="Correct. The $40 in forgone wages is the opportunity cost of studying. Good economic reasoning compares the next-best alternative, not just the direct price." delay={0} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {phase >= 7 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-4 flex items-center space-x-2 text-xs"
                  >
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-emerald-500"
                      animate={{ opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                    <span className="text-muted-foreground">AI-DETECTION: Human-written response · confidence 94%</span>
                    <span className="ml-2 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full font-medium">AI check: passed</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="bg-white border border-border rounded-xl shadow-sm p-8 opacity-50">
              <h3 className="font-medium text-lg mb-6 max-w-2xl text-foreground">Q2. Explain how a binding price ceiling creates a shortage.</h3>
              <div className="text-sm text-muted-foreground">Problem content hidden...</div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  );
}