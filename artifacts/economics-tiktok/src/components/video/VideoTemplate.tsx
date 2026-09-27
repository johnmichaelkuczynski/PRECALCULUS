import { useEffect, useRef, type ComponentType } from 'react';
import { AnimatePresence } from 'framer-motion';
import { VideoCanvas, VideoPausedContext, useVideoPlayer, type VideoAspectRatio } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';
import { Scene6 } from './video_scenes/Scene6';

export const SCENE_DURATIONS = {
  dashboard: 6500,
  lesson: 6500,
  tutor: 7500,
  analytics: 6000,
  practice: 7000,
  review: 6500,
};

const SCENES: Record<string, ComponentType> = {
  dashboard: Scene1,
  lesson: Scene2,
  tutor: Scene3,
  analytics: Scene4,
  practice: Scene5,
  review: Scene6,
};

const VIDEO_ASPECT_RATIO: VideoAspectRatio = '16:9';
const SCENE_START_SEC: Record<string, number> = (() => {
  const out: Record<string, number> = {};
  let ms = 0;
  for (const [key, duration] of Object.entries(SCENE_DURATIONS)) {
    out[key] = ms / 1000;
    ms += duration;
  }
  return out;
})();

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  paused = false,
  muted = false,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  paused?: boolean;
  muted?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentSceneKey } = useVideoPlayer({ durations, loop, paused });
  useEffect(() => { onSceneChange?.(currentSceneKey); }, [currentSceneKey, onSceneChange]);
  const key = currentSceneKey.replace(/_r[12]$/, '');
  const Scene = SCENES[key];
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSceneRef = useRef<string | null>(null);
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (paused) { audio.pause(); return; }
    if (lastSceneRef.current !== currentSceneKey) {
      lastSceneRef.current = currentSceneKey;
      const target = SCENE_START_SEC[key] ?? 0;
      if (Math.abs(audio.currentTime - target) > .18) audio.currentTime = target;
    }
    audio.play().catch(() => {});
  }, [currentSceneKey, key, muted, paused]);

  return (
    <VideoPausedContext.Provider value={paused}>
      <VideoCanvas aspectRatio={VIDEO_ASPECT_RATIO} style={{ backgroundColor: '#faf7f2' }}>
        <AnimatePresence mode="sync">
          {Scene && <Scene key={currentSceneKey} />}
        </AnimatePresence>
        <audio ref={audioRef} src={`${import.meta.env.BASE_URL}audio/composite_audio.mp3`} preload="auto" autoPlay muted={muted} />
      </VideoCanvas>
    </VideoPausedContext.Provider>
  );
}