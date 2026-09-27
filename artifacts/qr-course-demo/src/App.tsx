export default function App() {
  return (
    <main className="h-screen w-screen overflow-hidden bg-black">
      <video
        className="h-full w-full object-contain"
        src={`${import.meta.env.BASE_URL}precalculus-live-app-demo.mp4`}
        poster={`${import.meta.env.BASE_URL}precalculus-poster.jpg`}
        controls
        playsInline
        preload="metadata"
        aria-label="Recorded walkthrough of the working Precalculus app"
      />
    </main>
  );
}
