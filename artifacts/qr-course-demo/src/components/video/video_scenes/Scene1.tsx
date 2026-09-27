import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Scene1({ setCursorPos, setIsClicking }: { setCursorPos: (pos: {x: string, y: string}) => void, setIsClicking: (val: boolean) => void }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Timings
    // 0.0-1.0s: Static dashboard, subtle fade-in.
    // 1.0-3.0s: Cursor glides from top-right to the Week 1 card.
    // 3.0-3.4s: Click animation
    // 3.4-5.0s: Cross-fade to Week 1 detail page.
    // 5.0-7.0s: Cursor moves down to lecture 1.1, hover, clicks.
    // 7.0-8.0s: Cross-fade begins to lecture view.
    setCursorPos({ x: '80vw', y: '20vh' });

    const t1 = setTimeout(() => {
      setCursorPos({ x: '45vw', y: '55vh' }); // Move to Week 1 card
    }, 1000);

    const t2 = setTimeout(() => {
      setIsClicking(true);
      setPhase(1); // Card click down
    }, 3000);

    const t3 = setTimeout(() => {
      setIsClicking(false);
      setPhase(2); // Start crossfade to Week 1
    }, 3400);

    const t4 = setTimeout(() => {
      setCursorPos({ x: '35vw', y: '45vh' }); // Move to lecture 1.1
    }, 5000);

    const t5 = setTimeout(() => {
      setIsClicking(true);
      setPhase(3); // Lecture 1.1 click down
    }, 6800);

    const t6 = setTimeout(() => {
      setIsClicking(false);
      setPhase(4); // End scene
    }, 7200);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); 
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
  }, [setCursorPos, setIsClicking]);

  return (
    <motion.div 
      className="absolute inset-0 w-full h-full bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <AnimatePresence mode="wait">
        {phase < 2 ? (
          <motion.div 
            key="dashboard"
            className="w-full h-full p-12"
            exit={{ opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.4 }}
          >
            <h1 className="text-4xl font-serif text-primary mb-8 tracking-tight">Economics</h1>
            
            <div className="grid grid-cols-3 gap-6 mb-12">
              <div className="col-span-2 flex space-x-6">
                <div className="flex-1 bg-white border border-border p-6 rounded-xl shadow-sm">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Assignments</div>
                  <div className="text-3xl font-sans font-light mb-4">12 <span className="text-muted-foreground text-xl">/ 12</span></div>
                  <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
                    <div className="bg-primary w-full h-full"></div>
                  </div>
                </div>
                <div className="flex-1 bg-white border border-border p-6 rounded-xl shadow-sm">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Lectures Completed</div>
                  <div className="text-3xl font-sans font-light">32 <span className="text-muted-foreground text-xl">/ 32</span></div>
                </div>
              </div>
              <div className="row-span-2 bg-white border border-border p-6 rounded-xl shadow-sm">
                <h3 className="font-serif text-xl mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm font-medium">Topic Practice</span>
                    <span className="text-xs text-muted-foreground">Just now</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-sm font-medium">Homework 1.1</span>
                    <span className="text-xs text-muted-foreground">Yesterday</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Week 1 Test</span>
                    <span className="text-xs text-muted-foreground">2 days ago</span>
                  </div>
                </div>
              </div>
              
              <div className="col-span-2">
                <h3 className="font-serif text-2xl mb-4 mt-2">Course Schedule</h3>
                <div className="grid grid-cols-2 gap-4">
                  <motion.div 
                    className="bg-white border border-border p-5 rounded-xl cursor-pointer"
                    animate={phase === 1 ? { scale: 0.98, backgroundColor: '#f8fafc' } : { scale: 1, backgroundColor: '#ffffff' }}
                    whileHover={{ y: -2, boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Week 1</div>
                    <h4 className="font-serif text-lg mb-2">Foundations of choice and markets</h4>
                    <p className="text-sm text-muted-foreground">7 Lectures · 3 Assignments</p>
                  </motion.div>
                  <div className="bg-white/60 border border-border p-5 rounded-xl opacity-70">
                    <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Week 2</div>
                    <h4 className="font-serif text-lg mb-2">Firms, consumers, and market structure</h4>
                    <p className="text-sm text-muted-foreground">7 Lectures · 3 Assignments</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="week1"
            className="w-full h-full p-12"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
              <span>Dashboard</span>
              <span>/</span>
              <span className="text-primary font-medium">Week 1</span>
            </div>
            
            <h1 className="text-4xl font-serif text-primary mb-8 tracking-tight">Week 1 — Foundations of choice and markets</h1>
            
            <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden w-2/3">
              <div className="px-6 py-4 bg-muted/30 border-b border-border text-xs font-semibold text-muted-foreground uppercase tracking-wider">Lectures</div>
              
              <div className="divide-y divide-border">
                <motion.div 
                  className="px-6 py-4 flex items-center justify-between cursor-pointer"
                  animate={phase === 3 ? { backgroundColor: '#f1f5f9' } : { backgroundColor: '#ffffff' }}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium">1</div>
                    <span className="font-medium">1.1 What economics is and why it matters</span>
                  </div>
                  <span className="text-xs text-muted-foreground">12 min</span>
                </motion.div>
                
                <div className="px-6 py-4 flex items-center justify-between opacity-80">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">2</div>
                    <span>1.2 Scarcity, choice, and opportunity cost</span>
                  </div>
                  <span className="text-xs text-muted-foreground">14 min</span>
                </div>
                
                <div className="px-6 py-4 flex items-center justify-between opacity-80">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">3</div>
                    <span>1.3 Supply, demand, and market equilibrium</span>
                  </div>
                  <span className="text-xs text-muted-foreground">15 min</span>
                </div>
                
                <div className="px-6 py-4 flex items-center justify-between opacity-80">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">4</div>
                    <span>1.4 Elasticity and market response</span>
                  </div>
                  <span className="text-xs text-muted-foreground">16 min</span>
                </div>
                <div className="px-6 py-4 flex items-center justify-between opacity-80">
                  <div className="flex items-center space-x-4">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">5</div>
                    <span>1.5 Consumer choice and utility</span>
                  </div>
                  <span className="text-xs text-muted-foreground">14 min</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}