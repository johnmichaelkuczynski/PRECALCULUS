import React, { useEffect, useState } from 'react';

export function StreamingText({ text, delay = 0, onComplete }: { text: string; delay?: number; onComplete?: () => void }) {
  const [displayedWords, setDisplayedWords] = useState<string[]>([]);
  
  useEffect(() => {
    const words = text.split(' ');
    let i = 0;
    
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayedWords(prev => [...prev, words[i]]);
        i++;
        if (i >= words.length) {
          clearInterval(interval);
          onComplete?.();
        }
      }, 150);
      return () => clearInterval(interval);
    }, delay);
    
    return () => clearTimeout(timeout);
  }, [text, delay, onComplete]);

  return <span>{displayedWords.join(' ')}</span>;
}
