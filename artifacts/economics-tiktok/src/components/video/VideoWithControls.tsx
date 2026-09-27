import { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronUp, Pause, Play, Repeat, Volume2, VolumeX } from 'lucide-react';
import VideoTemplate, { SCENE_DURATIONS } from './VideoTemplate';
import { useSceneControls } from './useSceneControls';

const SCENE_DETAILS: Record<string, { title: string; filePath: string }> = {
  dashboard: { title: 'Dashboard', filePath: 'src/components/video/video_scenes/Scene1.tsx' },
  lesson: { title: 'Lesson', filePath: 'src/components/video/video_scenes/Scene2.tsx' },
  tutor: { title: 'Tutor', filePath: 'src/components/video/video_scenes/Scene3.tsx' },
  analytics: { title: 'Analytics', filePath: 'src/components/video/video_scenes/Scene4.tsx' },
  practice: { title: 'Practice', filePath: 'src/components/video/video_scenes/Scene5.tsx' },
  review: { title: 'Review', filePath: 'src/components/video/video_scenes/Scene6.tsx' },
};
const format = (ms: number) => {
  const seconds = Math.floor(Math.max(0, ms) / 1000);
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
};

function PlaybackStatus({ keys, activeIndex, activeDuration, activeStartTime, totalDuration, tick, paused, onJumpTo }: {
  keys: string[]; activeIndex: number; activeDuration: number; activeStartTime: number;
  totalDuration: number; tick: number; paused: boolean; onJumpTo: (index: number) => void;
}) {
  const [elapsed, setElapsed] = useState(0);
  const base = useRef(0);
  useEffect(() => { setElapsed(0); base.current = 0; }, [tick]);
  useEffect(() => {
    if (paused) return;
    const start = performance.now();
    const id = window.setInterval(() => setElapsed(base.current + performance.now() - start), 60);
    return () => { clearInterval(id); base.current += performance.now() - start; };
  }, [paused, tick]);
  return <>
    <div className="preview-segments">{keys.map((key, i) => (
      <button key={key} onClick={() => onJumpTo(i)} aria-label={`Jump to scene ${i + 1}: ${SCENE_DETAILS[key].title}`} aria-current={i === activeIndex ? 'true' : undefined}>
        <i style={{ width: i === activeIndex ? `${Math.min(100, 100 * elapsed / activeDuration)}%` : '0%' }} />
      </button>
    ))}</div>
    <span className="preview-timer">{activeIndex + 1}/{keys.length} &nbsp; {format(Math.min(totalDuration, activeStartTime + Math.min(elapsed, activeDuration)))} / {format(totalDuration)}</span>
  </>;
}

export default function VideoWithControls() {
  const isIframed = typeof window !== 'undefined' && window.self !== window.top;
  const player = useSceneControls(SCENE_DURATIONS);
  const [muted, setMuted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pinned, setPinned] = useState(false);
  const sensor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!player.paused) return;
    const frozen = document.getAnimations().filter(a => a.playState === 'running');
    frozen.forEach(a => a.pause());
    return () => frozen.forEach(a => a.play());
  }, [player.paused]);
  useEffect(() => {
    if (!collapsed || !pinned) return;
    const outside = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && sensor.current && !sensor.current.contains(e.target as Node)) setPinned(false);
    };
    document.addEventListener('pointerdown', outside);
    return () => document.removeEventListener('pointerdown', outside);
  }, [collapsed, pinned]);
  const handleJump = useCallback((index: number) => {
    player.jumpTo(index);
    const key = player.sceneKeys[index];
    const detail = SCENE_DETAILS[key];
    window.parent.postMessage({
      type: 'REPLIT_VIDEO_SCENE_SELECTED',
      payload: { sceneIndex: index, sceneCount: player.sceneKeys.length, sceneTitle: detail.title, filePath: detail.filePath, lineNumber: 1 },
    }, '*');
  }, [player.jumpTo, player.sceneKeys]);

  if (!isIframed) return <VideoTemplate />;
  return <div className="preview-wrap">
    <VideoTemplate key={player.mountKey} durations={player.durations} paused={player.paused} muted={muted} onSceneChange={player.onSceneChange} />
    <div ref={sensor} className="preview-sensor" onPointerEnter={e => { if (e.pointerType === 'mouse') setHovering(true); }} onPointerLeave={e => { if (e.pointerType === 'mouse') setHovering(false); }} onPointerDown={e => { if (e.pointerType !== 'mouse' && collapsed) setPinned(true); }}>
      <div className="preview-hover-area" />
      <div className={`preview-bar ${!collapsed || hovering || pinned ? 'visible' : ''}`}>
        <button onClick={player.togglePause} title={player.paused ? 'Play' : 'Pause'} aria-label={player.paused ? 'Play' : 'Pause'}>{player.paused ? <Play /> : <Pause />}</button>
        <button onClick={player.toggleLock} title="Loop current scene" aria-label="Loop current scene" aria-pressed={player.locked} className={player.locked ? 'on' : ''}><Repeat /></button>
        <button onClick={() => setMuted(v => !v)} title={muted ? 'Unmute' : 'Mute'} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX /> : <Volume2 />}</button>
        <PlaybackStatus keys={player.sceneKeys} activeIndex={player.activeIndex} activeDuration={player.activeDuration} activeStartTime={player.activeStartTime} totalDuration={player.totalDuration} tick={player.tick} paused={player.paused} onJumpTo={handleJump} />
        <button onClick={() => { setCollapsed(c => !c); setHovering(false); setPinned(false); }} title={collapsed ? 'Show controls' : 'Hide controls'} aria-label={collapsed ? 'Show controls' : 'Hide controls'}>{collapsed ? <ChevronUp /> : <ChevronDown />}</button>
      </div>
    </div>
  </div>;
}