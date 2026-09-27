import React, { useEffect, useState } from 'react';

export function TypewriterText({ text, speed = 25, delay = 0, onComplete }: { text: string; speed?: number; delay?: number; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    if (delay > 0) {
      timeout = setTimeout(() => {
        startTyping();
      }, delay);
    } else {
      startTyping();
    }
    
    function startTyping() {
      let i = 0;
      const interval = setInterval(() => {
        setDisplayed(text.substring(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          onComplete?.();
        }
      }, 1000 / speed);
      timeout = interval as unknown as NodeJS.Timeout;
    }
    
    return () => clearTimeout(timeout);
  }, [text, speed, delay, onComplete]);

  return <span>{displayed}</span>;
}
