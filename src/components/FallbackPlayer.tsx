// FallbackPlayer.tsx (or define it inside your main component file)
import React from "react";
import ReactPlayer from "react-player";

interface FallbackPlayerProps {
  videoUrl: string;
  playerKey?: string | number;
}

const FallbackPlayer: React.FC<FallbackPlayerProps> = ({ videoUrl, playerKey }) => {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-4">
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg border border-white/10">
        <ReactPlayer
          key={playerKey}
          src={videoUrl}
          controls
          width="100%"
          height="100%"
          className="absolute top-0 left-0"
        />
      </div>
      <div className="text-center text-sm text-slate-400 p-2 bg-slate-800/50 rounded-lg">
        The interactive tutorial is only available on larger screens. (This is a fallback video)
      </div>
    </div>
  );
};

export default FallbackPlayer;
