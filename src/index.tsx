"use client";

import React, { useState, useRef, useMemo, useEffect, useLayoutEffect, useCallback } from "react";
import ReactPlayer from "react-player";
import { RefreshCw, MoveRight, Play } from "lucide-react";
import { InteractionArea, StopPoint, TutorialData } from "./types";

// Helper components (SpeechBubble, SegmentedTimeline, etc.) are moved inside or below the main component.
// For a larger library, you would place them in `src/components/` and import them.

// =================================================================
// PROPS DEFINITION
// =================================================================
export interface TutorialVideoPlayerProps {
  /** The source of the video. Can be a URL string or a File object. */
  videoSource: string | File;
  /** The parsed JSON data for the interactive tutorial. */
  tutorialData: TutorialData;
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
  labels,
  colors,
}: {
  text: string;
  hasNextButton: boolean;
  onNext: () => void;
  targetStyle: { left: string; top: string; width: string; height: string };
  isClosing: boolean;
  videoContainer: HTMLElement | null;
  labels: Required<TutorialVideoPlayerProps["labels"]>;
  colors: Required<TutorialVideoPlayerProps["colors"]>;
}) => {
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [positionStyle, setPositionStyle] = useState<React.CSSProperties>({});
  const [arrowDirection, setArrowDirection] = useState<"left" | "right" | "top" | "bottom">("left");

  // ... (useLayoutEffect logic remains the same)
  useLayoutEffect(() => {
    if (!bubbleRef.current || !videoContainer) return;
    const bubble = bubbleRef.current;
    const containerRect = videoContainer.getBoundingClientRect();
    const bubbleRect = bubble.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;
    const bubbleWidth = bubbleRect.width;
    const bubbleHeight = bubbleRect.height;
    const targetPx = {
      left: (parseFloat(targetStyle.left) / 100) * containerWidth,
      top: (parseFloat(targetStyle.top) / 100) * containerHeight,
      width: (parseFloat(targetStyle.width) / 100) * containerWidth,
      height: (parseFloat(targetStyle.height) / 100) * containerHeight,
    };
    const gap = 20;
    const targetCenterX = targetPx.left + targetPx.width / 2;
    const targetCenterY = targetPx.top + targetPx.height / 2;
    let finalLeft: number, finalTop: number;
    let finalDirection: "left" | "right" | "top" | "bottom";
    const spaceOnRight = containerWidth - (targetPx.left + targetPx.width + gap);
    const spaceOnLeft = targetPx.left - gap;
    const isTargetOnRightHalf = targetCenterX > containerWidth / 2;

    if (isTargetOnRightHalf && spaceOnLeft >= bubbleWidth) {
      finalLeft = spaceOnLeft - gap - bubbleWidth;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "left";
    } else if (!isTargetOnRightHalf && spaceOnRight >= bubbleWidth) {
      finalLeft = targetPx.left + targetPx.width + gap;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "right";
    } else if (spaceOnRight >= bubbleWidth) {
      finalLeft = targetPx.left + targetPx.width + gap;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "right";
    } else if (spaceOnLeft >= bubbleWidth) {
      finalLeft = spaceOnLeft - gap - bubbleWidth;
      finalTop = Math.max(0, Math.min(containerHeight - bubbleHeight, targetCenterY - bubbleHeight / 2));
      finalDirection = "left";
    } else if (targetPx.top - gap - bubbleHeight >= 0) {
      finalLeft = Math.max(0, Math.min(containerWidth - bubbleWidth, targetCenterX - bubbleWidth / 2));
      finalTop = targetPx.top - gap - bubbleHeight;
      finalDirection = "bottom";
    } else {
      finalLeft = Math.max(0, Math.min(containerWidth - bubbleWidth, targetCenterX - bubbleWidth / 2));
      finalTop = targetPx.top + targetPx.height + gap;
      finalDirection = "top";
    }

    setPositionStyle({ left: `${finalLeft}px`, top: `${finalTop}px` });
    setArrowDirection(finalDirection);
  }, [targetStyle, text, videoContainer]);

  // ... (getArrowClasses logic remains the same)
  const getArrowClasses = () => {
    const baseClasses = "absolute w-0 h-0 z-10";
    switch (arrowDirection) {
      case "right":
        return `${baseClasses} left-0 top-1/2 -translate-x-full -translate-y-1/2 border-l-0 border-r-[16px] border-t-[12px] border-b-[12px] border-r-slate-700 border-t-transparent border-b-transparent`;
      case "left":
        return `${baseClasses} right-0 top-1/2 translate-x-full -translate-y-1/2 border-r-0 border-l-[16px] border-t-[12px] border-b-[12px] border-l-slate-700 border-t-transparent border-b-transparent`;
      case "top":
        return `${baseClasses} left-1/2 top-0 -translate-x-1/2 -translate-y-full border-b-0 border-t-[16px] border-l-[12px] border-r-[12px] border-t-slate-700 border-l-transparent border-r-transparent`;
      case "bottom":
        return `${baseClasses} left-1/2 bottom-0 -translate-x-1/2 translate-y-full border-t-0 border-b-[16px] border-l-[12px] border-r-[12px] border-b-slate-700 border-l-transparent border-r-transparent`;
      default:
        return baseClasses;
    }
  };

  const animationClass = isClosing ? "animate-fade-out" : "animate-fade-in";

  // Note: For a real library, you'd inject CSS or use a CSS-in-JS solution instead of Tailwind classes
  // to avoid forcing Tailwind on the consumer. For simplicity, we keep them but this is a key consideration.
  return (
    <div
      ref={bubbleRef}
      className={`absolute w-80 p-6 bg-slate-700/95 backdrop-blur-sm border border-slate-600 text-white rounded-2xl shadow-2xl z-50 ${animationClass}`}
      style={positionStyle}
    >
      <div className={getArrowClasses()}></div>
      <div
        className="absolute inset-0 rounded-2xl blur-xl opacity-50 -z-10"
        style={{ background: `linear-gradient(to right, ${colors!.primary}20, ${colors!.secondary}20)` }}
      ></div>
      <div className="relative">
        <p className="mb-4 text-base leading-relaxed text-slate-100">{text}</p>
        {hasNextButton && (
          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(to right, ${colors!.primary}, ${colors!.secondary})` }}
          >
            <span>{labels!.continue}</span>
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
  // ... (Component logic is the same)
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
            <div
              key={index}
              className="relative bg-white/20 rounded-full overflow-hidden"
              style={{ width: `${segmentWidth}%` }}
            >
              <div
                className="h-full transition-all duration-300 ease-out rounded-full"
                style={{ width: `${progressInSegment}%`, backgroundColor: primaryColor }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
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
  // ... (HighlightRenderer logic is largely the same, but we pass the primary color for borders/strokes)
  const [videoDims, setVideoDims] = useState({ width: 0, height: 0 });

  useLayoutEffect(() => {
    const updateDimensions = () => {
      if (videoRef.current?.wrapper) {
        const element = videoRef.current.wrapper.firstChild;
        if (element) {
          const rect = element.getBoundingClientRect();
          setVideoDims({ width: rect.width, height: rect.height });
        }
      }
    };
    updateDimensions();
    window.addEventListener("resize", updateDimensions);
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
  // ... (This helper function remains the same)
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

  switch (area.type) {
    case "box":
    case "oval": {
      const style = getHighlightStyle(area);
      return {
        left: style.left as string,
        top: style.top as string,
        width: style.width as string,
        height: style.height as string,
      };
    }
    case "polygon": {
      if (!area.points || area.points.length != 4) return { left: "0px", top: "0px", width: "0px", height: "0px" };
      const centroid = area.points.reduce((acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }), { x: 0, y: 0 });
      centroid.x /= area.points.length;
      centroid.y /= area.points.length;
      return { left: `${centroid.x * 100}%`, top: `${centroid.y * 100}%`, width: "0px", height: "0px" };
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
  onTutorialStart,
  onTutorialComplete,
  onNextInteraction,
}) => {
  // Set default values for customizable props
  const labels = {
    start: "Start Interactive Tutorial",
    continue: "Continue",
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
    if (player) {
      if (player && player.videoWidth && player.videoHeight > 0) {
        setVideoAspectRatio(`${player.videoWidth} / ${player.videoHeight}`);
      }
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
    videoRef.current!.currentTime = 0;
    setCurrentTime(0);
    nextStopPointIndex.current = 0;
    setIsFinished(false);
    setActiveStopPoint(null);
    setHasStarted(false);
    setIsPlaying(false);
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
          labels={labels}
          colors={colors}
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

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
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

      {showTimeline && tutorialData && duration > 0 && (
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
