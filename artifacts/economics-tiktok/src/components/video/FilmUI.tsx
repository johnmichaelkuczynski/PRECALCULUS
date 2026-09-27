import { motion } from 'framer-motion';
import type { PropsWithChildren } from 'react';

export function Screen({ title, tab = 'Dashboard', children }: PropsWithChildren<{ title: string; tab?: 'Dashboard' | 'Assignments' | 'Analytics' }>) {
  return (
    <motion.section
      className="app-screen"
      initial={{ opacity: 0, scale: 1.015 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: .985 }}
      transition={{ duration: .24 }}
    >
      <header className="app-header">
        <div className="app-brand"><span className="sigma">Σ</span><span>Economics <strong>101</strong></span></div>
        <span className="header-dots">•••</span>
      </header>
      <main className="app-main">
        <div className="page-label">{title}</div>
        {children}
      </main>
      <nav className="app-nav">
        {(['Dashboard', 'Assignments', 'Analytics'] as const).map((item) => (
          <div key={item} className={`app-nav-item ${tab === item ? 'active' : ''}`}>
            <span className="nav-icon">{item === 'Dashboard' ? '⌂' : item === 'Assignments' ? '▤' : '▥'}</span>
            <span>{item}</span>
          </div>
        ))}
      </nav>
    </motion.section>
  );
}

export function Tap({ x, y, pulse = false }: { x: string; y: string; pulse?: boolean }) {
  return (
    <motion.div className="tap-indicator" animate={{ left: x, top: y, scale: pulse ? [.75, 1.25, .85] : 1 }} transition={{ duration: pulse ? .35 : .65 }} aria-hidden="true">
      <span />
    </motion.div>
  );
}

export function Card({ children, className = '' }: PropsWithChildren<{ className?: string }>) {
  return <div className={`app-card ${className}`}>{children}</div>;
}

export function LessonTag() {
  return <div className="eyebrow">WEEK 1 · LECTURE 1.1</div>;
}