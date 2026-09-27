import { useCallback, useMemo, useState } from 'react';

export function useSceneControls(baseDurations: Record<string, number>) {
  const sceneKeys = useMemo(() => Object.keys(baseDurations), [baseDurations]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mountKey, setMountKey] = useState(0);
  const [tick, setTick] = useState(0);
  const durations = useMemo(() => {
    if (locked) {
      const key = sceneKeys[activeIndex];
      return { [`${key}_r1`]: baseDurations[key], [`${key}_r2`]: baseDurations[key] };
    }
    const rotated: Record<string, number> = {};
    for (let i = 0; i < sceneKeys.length; i++) {
      const key = sceneKeys[(activeIndex + i) % sceneKeys.length];
      rotated[key] = baseDurations[key];
    }
    return rotated;
  }, [activeIndex, baseDurations, locked, sceneKeys]);
  const totalDuration = useMemo(() => Object.values(baseDurations).reduce((a, b) => a + b, 0), [baseDurations]);
  const activeStartTime = sceneKeys.slice(0, activeIndex).reduce((total, key) => total + baseDurations[key], 0);
  const onSceneChange = useCallback((rawKey: string) => {
    const idx = sceneKeys.indexOf(rawKey.replace(/_r[12]$/, ''));
    if (idx >= 0) setActiveIndex(idx);
    setTick(t => t + 1);
  }, [sceneKeys]);
  const jumpTo = useCallback((index: number) => {
    setActiveIndex(index);
    setPaused(false);
    setMountKey(k => k + 1);
    setTick(t => t + 1);
  }, []);
  const toggleLock = useCallback(() => {
    setLocked(v => !v);
    setPaused(false);
    setMountKey(k => k + 1);
    setTick(t => t + 1);
  }, []);
  const togglePause = useCallback(() => setPaused(v => !v), []);
  return {
    sceneKeys, activeIndex, locked, paused, mountKey, tick, durations,
    activeDuration: baseDurations[sceneKeys[activeIndex]] ?? 0,
    activeStartTime, totalDuration, onSceneChange, jumpTo, toggleLock, togglePause,
  };
}