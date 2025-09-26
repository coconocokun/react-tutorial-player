import React, { useState, useRef, useMemo, useEffect, useLayoutEffect, useCallback } from "react";
import ReactPlayer from "react-player";
import { RefreshCw, MoveRight, Play } from "lucide-react";
import { InteractionArea, StopPoint } from "./types";
import "./output.css";
import { useMediaQuery } from "./hooks/useMediaQuery";
import FallbackPlayer from "@/components/FallbackPlayer";

// Helper components (SpeechBubble, SegmentedTimeline, etc.) are moved inside or below the main component.
// For a larger library, you would place them in `src/components/` and import them.

// =================================================================
// PROPS DEFINITION
// =================================================================
export interface TutorialJsonData {
  version: "1.1";
  stopPoints: StopPoint[];
}

export interface TutorialVideoPlayerProps {
  /** The source of the video. Can be a URL string or a File object. */
  videoSource: string | File;
  /** The parsed JSON data for the interactive tutorial. */
  tutorialData: TutorialJsonData;
  /**
   * Custom labels for UI elements.
   * @default start: "Start Interactive Tutorial", continue: "Continue", complete: "Tutorial Complete!", replay: "Play Again"
   */
  labels?: {
    start?: string;
    continue?: string;
    complete?: string;
    replay?: string;
  };
  /**
   * Custom colors for UI elements.
   * @default primary: "#3B82F6", secondary: "#8B5CF6"
   */
  colors?: {
    primary?: string;
    secondary?: string;
  };
  /**
   * If true, the timeline progress bar will be displayed.
   * @default true
   */
  showTimeline?: boolean;
  key?: string;
  fallbackUrl?: string;
  /** Callback function triggered when the tutorial starts. */
  onTutorialStart?: () => void;
  /** Callback function triggered when the tutorial is completed. */
  onTutorialComplete?: () => void;
  /** Callback function triggered on each interaction step. */
  onNextInteraction?: (stopPoint: StopPoint, areaIndex: number) => void;
}

// =================================================================
// HELPER COMPONENTS (Slightly modified to accept props like colors)
// =================================================================

const SpeechBubble = ({
  text,
  hasNextButton,
  onNext,
  targetStyle,
  isClosing,
  videoContainer,
  continueMessage,
}: {
  text: string;
  hasNextButton: boolean;
  onNext: () => void;
  targetStyle: { left: string; top: string; width: string; height: string };
  isClosing: boolean;
  videoContainer: HTMLElement | null;
  continueMessage: string;
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<"left" | "right" | "top" | "bottom">("left");

  useLayoutEffect(() => {
    if (!bubbleRef.current || !videoContainer) return;

    const bubble = bubbleRef.current;
    const containerRect = videoContainer.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();

    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const bubbleWidth = bubbleRect.width;
    const bubbleHeight = bubbleRect.height;

    // Convert percentage-based targetStyle to pixel values
    const targetPx = {
      left: (parseFloat(targetStyle.left) / 100) * containerWidth,
      top: (parseFloat(targetStyle.top) / 100) * containerHeight,
      width: (parseFloat(targetStyle.width) / 100) * containerWidth,
      height: (parseFloat(targetStyle.height) / 100) * containerHeight,
    };

    const gap = 10;

    const targetCenterX = targetPx.left + targetPx.width / 2;
    const targetCenterY = targetPx.top + targetPx.height / 2;

    let finalLeft: number;
    let finalTop: number;
    let finalDirection: "left" | "right" | "top" | "bottom";

    const spaceOnRight = containerWidth - (targetPx.left + targetPx.width + gap);
    const spaceOnLeft = targetPx.left - gap;
    const isTargetOnRightHalf = targetCenterX > containerWidth / 2;

    // Implement intelligent positioning logic
    if (isTargetOnRightHalf && spaceOnLeft >= bubbleWidth) {
      // Prefer left side if target is on the right
      finalLeft = spaceOnLeft - gap - bubbleWidth;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "left"; // Bubble on left, arrow on its right, points right
    } else if (!isTargetOnRightHalf && spaceOnRight >= bubbleWidth) {
      // Prefer right side if target is on the left
      finalLeft = targetPx.left + targetPx.width + gap;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "right"; // Bubble on right, arrow on its left, points left
    }
    // Fallback logic
    else if (spaceOnRight >= bubbleWidth) {
      // Try right
      finalLeft = targetPx.left + targetPx.width + gap;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "right";
    } else if (spaceOnLeft >= bubbleWidth) {
      // Try left
      finalLeft = spaceOnLeft - gap - bubbleWidth;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "left";
    } else if (targetPx.top - gap - bubbleHeight >= 0) {
      // Try top
      finalLeft = Math.max(0, Math.min(containerWidth - bubbleWidth, targetCenterX - bubbleWidth / 2));
      finalTop = targetPx.top - gap - bubbleHeight;
      finalDirection = "bottom"; // Bubble on top, arrow on its bottom, points down
    } else {
      // Use bottom
      finalLeft = Math.max(0, Math.min(containerWidth - bubbleWidth, targetCenterX - bubbleWidth / 2));
      finalTop = targetPx.top + targetPx.height + gap;
      finalDirection = "top"; // Bubble on bottom, arrow on its top, points up
    }

    setPositionStyle({
      left: `${finalLeft}px`,
      top: `${finalTop}px`,
    });
    setArrowDirection(finalDirection);
  }, [targetStyle, text, videoContainer]);

  const getArrowClasses = () => {
    // Note on direction: "left" means the bubble is on the left, so its arrow is on the right pointing right.
    const baseClasses = "absolute w-0 h-0 z-10";

    switch (arrowDirection) {
      case "right": // Bubble is on the RIGHT, arrow points LEFT
        return `${baseClasses} left-0 top-1/2 -translate-x-full -translate-y-1/2 border-l-0 border-r-[16px] border-t-[12px] border-b-[12px] border-r-slate-700 border-t-transparent border-b-transparent`;
      case "left": // Bubble is on the LEFT, arrow points RIGHT
        return `${baseClasses} right-0 top-1/2 translate-x-full -translate-y-1/2 border-r-0 border-l-[16px] border-t-[12px] border-b-[12px] border-l-slate-700 border-t-transparent border-b-transparent`;
      case "top": // Bubble is on the BOTTOM, arrow points UP
        return `${baseClasses} left-1/2 top-0 -translate-x-1/2 -translate-y-full border-b-0 border-t-[16px] border-l-[12px] border-r-[12px] border-t-slate-700 border-l-transparent border-r-transparent`;
      case "bottom": // Bubble is on the TOP, arrow points DOWN
        return `${baseClasses} left-1/2 bottom-0 -translate-x-1/2 translate-y-full border-t-0 border-b-[16px] border-l-[12px] border-r-[12px] border-b-slate-700 border-l-transparent border-r-transparent`;
      default:
        return baseClasses;
    }
  };

  const animationClass = isClosing ? "animate-fade-out" : "animate-fade-in";

  return (
    <div
      ref={bubbleRef}
      className={`absolute w-80 p-6 backdrop-blur-sm border border-slate-600 text-white rounded-2xl shadow-2xl z-50 ${animationClass}`}
      style={positionStyle}
    >
      {/* Arrow */}
      <div className={getArrowClasses()}></div>

      {/* Glow effect */}
      <div className="absolute inset-0 rounded-2xl bg-blue-500/20 blur-xl opacity-50 -z-10"></div>

      <div className="relative">
        <p className="mb-4 text-base leading-relaxed text-slate-100">{text}</p>

        {hasNextButton && (
          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            <span>{continueMessage}</span>
            <MoveRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const SegmentedTimeline = ({
  duration,
  currentTime,
  stopPoints,
  primaryColor,
}: {
  duration: number;
  currentTime: number;
  stopPoints: StopPoint[];
  primaryColor: string;
}) => {
  if (duration === 0) return null;
  const segments = useMemo(() => {
    const newSegments = [];
    let lastTime = 0;
    stopPoints.forEach((stopPoint) => {
      newSegments.push({ start: lastTime, end: stopPoint.time });
      lastTime = stopPoint.time;
    });
    if (lastTime < duration) newSegments.push({ start: lastTime, end: duration });
    return newSegments;
  }, [stopPoints, duration]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-slate-400">
        <span>Progress</span>
        <span>{Math.round((currentTime / duration) * 100)}%</span>
      </div>
      <div className="flex w-full h-4 bg-white/5 backdrop-blur-sm rounded-full overflow-hidden gap-1 shadow-inner">
        {segments.map((segment, index) => {
          const segmentDuration = segment.end - segment.start;
          const segmentWidth = (segmentDuration / duration) * 100;
          let progressInSegment = 0;
          if (currentTime >= segment.end) progressInSegment = 100;
          else if (currentTime > segment.start)
            progressInSegment = ((currentTime - segment.start) / segmentDuration) * 100;

          return (
            <div key={index} className="relative bg-white/20 overflow-hidden" style={{ width: `${segmentWidth}%` }}>
              <div
                className="h-full transition-all duration-300 ease-out"
                style={{ width: `${progressInSegment}%`, backgroundColor: primaryColor }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

const getHighlightStyle = (area: InteractionArea): React.CSSProperties => {
  switch (area.type) {
    case "box":
    case "oval":
      if (!area.box) return {};
      return {
        left: `${area.box.x * 100}%`,
        top: `${area.box.y * 100}%`,
        width: `${area.box.width * 100}%`,
        height: `${area.box.height * 100}%`,
      };
    case "polygon":
      if (!area.points || area.points.length != 4) return {};
      const xs = area.points.map((p) => p.x);
      const ys = area.points.map((p) => p.y);
      return {
        left: `${Math.min(...xs) * 100}%`,
        top: `${Math.min(...ys) * 100}%`,
        width: `${(Math.max(...xs) - Math.min(...xs)) * 100}%`,
        height: `${(Math.max(...ys) - Math.min(...ys)) * 100}%`,
      };
    default:
      return {};
  }
};

const HighlightRenderer = ({
  area,
  videoRef,
  onClick,
  primaryColor,
}: {
  area: InteractionArea;
  videoRef: React.RefObject<any>;
  onClick: () => void;
  primaryColor: string;
}) => {
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const updateDimensions = () => {
      const player = videoRef.current;
      if (player) {
        // Handle different player types
        let element: HTMLVideoElement | null = null;

        if ("getBoundingClientRect" in player) {
          // Direct HTML element
          element = player;
        }

        if (element) {
          const rect = element.getBoundingClientRect();
          setVideoDims({ width: rect.width, height: rect.height });
        }
      }
    };

    // Update dimensions initially and on resize
    updateDimensions();
    window.addEventListener("resize", updateDimensions);

    // Also update when the video loads or changes
    const timer = setTimeout(updateDimensions, 100);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, [videoRef, area]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!area.hasNextButton) onClick();
  };

  switch (area.type) {
    case "box":
    case "oval":
      return (
        <div
          onClick={handleClick}
          className={`absolute pointer-events-auto ${!area.hasNextButton ? "cursor-pointer" : ""}`}
          style={{
            ...getHighlightStyle(area),
            borderRadius: area.type === "oval" ? "50%" : "0.5rem",
            boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.8)",
            border: `4px dashed ${primaryColor}`,
            transform: "translate3d(0, 0, 0)",
          }}
        />
      );
    case "polygon":
      if (videoDims.width === 0 || !area.points || area.points.length !== 4) return null;
      const maskId = `mask-${area.id}`;
      const polygonPointsForMask = area.points.map((p) => `${p.x},${p.y}`).join(" ");
      const svgPointsForBorder = area.points.map((p) => `${p.x * videoDims.width},${p.y * videoDims.height}`).join(" ");
      return (
        <>
          <svg width="0" height="0" className="absolute">
            <defs>
              <mask id={maskId} maskUnits="objectBoundingBox" maskContentUnits="objectBoundingBox">
                <rect x="0" y="0" width="1" height="1" fill="white" />
                <polygon points={polygonPointsForMask} fill="black" />
              </mask>
            </defs>
          </svg>
          <div
            className="absolute inset-0 bg-black/80 pointer-events-none"
            style={{ mask: `url(#${maskId})`, WebkitMask: `url(#${maskId})`, transform: "translate3d(0, 0, 0)" }}
          />
          <div
            onClick={handleClick}
            className={`absolute inset-0 w-full h-full pointer-events-auto ${
              !area.hasNextButton ? "cursor-pointer" : ""
            }`}
            style={{ transform: "translate3d(0, 0, 0)" }}
          >
            <svg width="100%" height="100%" className="overflow-visible">
              <defs>
                <style>{`@keyframes dash { to { stroke-dashoffset: -20; } } .animated-polygon { animation: dash 1s linear infinite; }`}</style>
              </defs>
              <polygon
                points={svgPointsForBorder}
                className="animated-polygon"
                style={{
                  fill: "none",
                  stroke: primaryColor,
                  strokeWidth: 4,
                  strokeDasharray: "10 10",
                  vectorEffect: "non-scaling-stroke",
                }}
              />
            </svg>
          </div>
        </>
      );
    default:
      return null;
  }
};

const getSpeechBubbleTargetStyle = (
  area: InteractionArea
): { left: string; top: string; width: string; height: string } => {
  switch (area.type) {
    case "box":
    case "oval": {
      const style = getHighlightStyle(area);
      return {
        left: typeof style.left === "string" ? style.left : "0px",
        top: typeof style.top === "string" ? style.top : "0px",
        width: typeof style.width === "string" ? style.width : "0px",
        height: typeof style.height === "string" ? style.height : "0px",
      };
    }
    case "polygon": {
      if (!area.points || area.points.length != 4) {
        return { left: "0px", top: "0px", width: "0px", height: "0px" };
      }
      const centroid = area.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      centroid.x /= area.points.length;
      centroid.y /= area.points.length;
      return {
        left: `${centroid.x * 100}%`,
        top: `${centroid.y * 100}%`,
        width: "0px",
        height: "0px",
      };
    }
    default:
      return { left: "0px", top: "0px", width: "0px", height: "0px" };
  }
};
// =================================================================
// MAIN COMPONENT
// =================================================================
export const TutorialVideoPlayer: React.FC<TutorialVideoPlayerProps> = ({
  videoSource,
  tutorialData,
  labels: customLabels,
  colors: customColors,
  showTimeline = true,
  key,
  fallbackUrl,
  onTutorialStart,
  onTutorialComplete,
  onNextInteraction,
}) => {
  // Set default values for customizable props
  const labels = {
    start: "Start Interactive Tutorial",
    continue: "Next",
    complete: "Tutorial Complete!",
    replay: "Play Again",
    ...customLabels,
  };

  const colors = {
    primary: "#3B82F6", // blue-500
    secondary: "#8B5CF6", // purple-500
    ...customColors,
  };

  const [hasStarted, setHasStarted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const nextStopPointIndex = useRef(0);

  const [activeStopPoint, setActiveStopPoint] = useState<StopPoint | null>(null);
  const [activeAreaIndex, setActiveAreaIndex] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [isBubbleClosing, setIsBubbleClosing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoAspectRatio, setVideoAspectRatio] = useState<string>("16 / 9");

  const isMobile = useMediaQuery("(max-width: 768px)");

  const videoUrl = useMemo(() => {
    if (!videoSource) return null;
    if (typeof videoSource === "string") return videoSource;
    return URL.createObjectURL(videoSource);
  }, [videoSource]);

  useEffect(() => {
    // Reset state when props change
    handleReplay();
  }, [videoSource, tutorialData]);

  useEffect(() => {
    return () => {
      if (videoUrl && videoSource instanceof File) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, [videoUrl, videoSource]);

  const handleProgress = useCallback(
    (player: HTMLVideoElement) => {
      if (!tutorialData || !hasStarted || activeStopPoint) return;
      const currentVideoTime = player.currentTime;
      setCurrentTime(currentVideoTime);
      if (nextStopPointIndex.current < tutorialData.stopPoints.length) {
        const nextStop = tutorialData.stopPoints[nextStopPointIndex.current];
        if (currentVideoTime >= nextStop.time) {
          setIsPlaying(false);
          player.currentTime = nextStop.time;
          setCurrentTime(nextStop.time);
          setActiveStopPoint(nextStop);
          setActiveAreaIndex(0);
        }
      }
    },
    [tutorialData, hasStarted, activeStopPoint]
  );

  const handleDuration = useCallback((duration: number) => setDuration(duration), []);

  const handleReady = useCallback((player: HTMLVideoElement) => {
    if (player && player.videoWidth && player.videoHeight > 0) {
      setVideoAspectRatio(`${player.videoWidth} / ${player.videoHeight}`);
    }
  }, []);

  const handleStart = useCallback(() => {
    setHasStarted(true);
    setIsPlaying(true);
    onTutorialStart?.();
  }, [onTutorialStart]);

  const handleVideoEnded = useCallback(() => {
    setIsFinished(true);
    setIsPlaying(false);
    if (duration > 0) setCurrentTime(duration);
    onTutorialComplete?.();
  }, [duration, onTutorialComplete]);

  const handleNextInteraction = useCallback(() => {
    if (!activeStopPoint || isBubbleClosing) return;
    onNextInteraction?.(activeStopPoint, activeAreaIndex);
    setIsBubbleClosing(true);
    setTimeout(() => {
      const nextAreaIndex = activeAreaIndex + 1;
      if (nextAreaIndex < activeStopPoint.areas.length) {
        setActiveAreaIndex(nextAreaIndex);
        setIsBubbleClosing(false);
      } else {
        setActiveStopPoint(null);
        nextStopPointIndex.current += 1;
        setIsBubbleClosing(false);
        setIsPlaying(true);
      }
    }, 300);
  }, [activeStopPoint, isBubbleClosing, activeAreaIndex, onNextInteraction]);

  const handleReplay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
      nextStopPointIndex.current = 0;
      setIsFinished(false);
      setActiveStopPoint(null);
      setHasStarted(false);
      setIsPlaying(false);
    }
  }, []);

  const renderTutorialOverlay = () => {
    if (!activeStopPoint || isBubbleClosing) return null;
    const activeArea = activeStopPoint.areas.sort((a, b) => a.order - b.order)[activeAreaIndex];
    if (!activeArea) return null;
    const speechBubbleTarget = getSpeechBubbleTargetStyle(activeArea);
    return (
      <div
        className="absolute inset-0 w-full h-full"
        onClick={!activeArea.hasNextButton ? handleNextInteraction : undefined}
      >
        <HighlightRenderer
          area={activeArea}
          videoRef={videoRef}
          onClick={handleNextInteraction}
          primaryColor={colors.primary}
        />
        <SpeechBubble
          text={activeArea.text}
          hasNextButton={activeArea.hasNextButton}
          onNext={handleNextInteraction}
          targetStyle={speechBubbleTarget}
          isClosing={isBubbleClosing}
          videoContainer={videoContainerRef.current}
          continueMessage={labels.continue}
        />
      </div>
    );
  };

  if (!videoUrl || !tutorialData) {
    return (
      <div className="w-full aspect-video bg-slate-800 rounded-lg flex items-center justify-center text-slate-400">
        Please provide both a videoSource and tutorialData prop.
      </div>
    );
  }

  if (isMobile && fallbackUrl) {
    return <FallbackPlayer videoUrl={fallbackUrl} playerKey={`fallback-${key}`} />;
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6" key={key}>
      <div className="relative group">
        <div
          ref={videoContainerRef}
          className="relative mx-auto w-full bg-black rounded-lg overflow-hidden shadow-2xl border border-white/10"
          style={{ aspectRatio: videoAspectRatio }}
        >
          <ReactPlayer
            ref={videoRef}
            src={videoUrl}
            playing={isPlaying}
            onProgress={(e) => handleReady(e.currentTarget)}
            onDurationChange={(e) => handleDuration(e.currentTarget.duration)}
            onTimeUpdate={(e) => handleProgress(e.currentTarget)}
            onEnded={handleVideoEnded}
            width="100%"
            height="100%"
            className="absolute top-0 left-0"
            key={`player-${key}`}
          />

          {!hasStarted && !isFinished && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/50 backdrop-blur-sm flex items-center justify-center">
              <button
                onClick={handleStart}
                className="flex items-center gap-3 px-10 py-5 text-white font-bold rounded-2xl text-xl transition-all duration-300 transform hover:scale-105 shadow-2xl"
                style={{ background: `linear-gradient(to right, ${colors.primary}, ${colors.secondary})` }}
              >
                <Play className="w-6 h-6" /> {labels.start}
              </button>
            </div>
          )}

          {renderTutorialOverlay()}

          {isFinished && (
            <div className="absolute inset-0 bg-gradient-to-br from-black/70 to-black/50 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col text-center items-center">
                <h3 className="text-3xl font-bold text-white mb-6">{labels.complete}</h3>
                <button
                  onClick={handleReplay}
                  className="flex items-center gap-3 px-8 py-4 bg-green-500 text-white font-bold rounded-2xl text-lg transition-all duration-300 transform hover:scale-105 shadow-2xl"
                >
                  <RefreshCw className="w-6 h-6" /> {labels.replay}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {showTimeline && tutorialData && (
        <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
          <SegmentedTimeline
            duration={duration}
            currentTime={currentTime}
            stopPoints={tutorialData.stopPoints}
            primaryColor={colors.primary}
          />
        </div>
      )}
    </div>
  );
};
