import { motion } from 'framer-motion';

export function TypingIndicator() {
  return (
    <div className="flex space-x-1 p-2 bg-white rounded-lg shadow-sm w-fit border border-border">
      <motion.div className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} />
      <motion.div className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} />
      <motion.div className="w-2 h-2 rounded-full bg-muted-foreground" animate={{ y: [0, -4, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} />
    </div>
  );
}
