# React Tutorial Video

[![NPM Version](https://img.shields.io/npm/v/react-interactive-video.svg)](https://www.npmjs.com/package/react-tutorial-video)
[![NPM Downloads](https://img.shields.io/npm/dm/react-interactive-video.svg)](https://www.npmjs.com/package/react-tutorial-video)
[![Bundle Size](https://img.shields.io/bundlephobia/minzip/react-interactive-video.svg)](https://bundlephobia.com/result?p=react-tutorial-video)
[![License](https://img.shields.io/npm/l/react-interactive-video.svg)](https://github.com/coconocokun/react-tutorial-video/blob/main/LICENSE)

A fully-featured React component for creating interactive video tutorials. Guide users through a video with text overlays, highlights, and guided steps, all configured through a simple JSON file. Perfect for product demos, user onboarding, and educational content.

---

### 📺 **[Live Demo & Editor](https://tutorial-movie-maker.vercel.app/)**

Check out the live demo to see the player in action and use the accompanying editor to create your own `tutorial-config.json` files!

## ✨ Features

- **JSON-Driven:** All interactions, text, and timings are controlled by a JSON file.
- **Multiple Highlight Shapes:** Supports `box`, `oval`, and `polygon` highlights to draw attention to any element.
- **Smart Speech Bubble Positioning:** Pop-ups automatically position themselves to avoid overlapping the highlighted area.
- **Customizable UI:** Easily change colors and text labels to match your application's theme.
- **Lifecycle Callbacks:** Hook into events like `onTutorialStart`, `onTutorialComplete`, and `onNextInteraction`.
- **Flexible Video Sources:** Works with video URLs (Vimeo, YouTube, etc.) or local `File` objects. (We highly recommend Vimeo, though..)
- **Segmented Timeline:** A visual progress bar that shows the tutorial's stop points.
- **Built with TypeScript:** Fully typed for a great developer experience.

## 📦 Installation

Install the package using npm:

```bash
npm install react-tutorial-video
```

## 🚀 Usage

The component requires two main props: `videoSource` and `TutorialJsonData`.
Also you **must include** the css file: `react-tutorial-video/dist/index.css`

### Basic Example

Here's a simple example using a video URL and an inline JSON object.

```jsx
import React from "react";
import { TutorialVideoPlayer, TutorialJsonData } from "react-tutorial-video";
import "react-tutorial-video/dist/index.css";

// The video you want to play
const videoUrl = "https://vimeo.com/your-video-id";

// The configuration for the tutorial steps
const TutorialJsonData: TutorialJsonData = {
  version: "1.1",
  stopPoints: [
    {
      id: "sp1",
      time: 5, // Pause the video at 5 seconds
      areas: [
        {
          id: "area1",
          type: "box",
          order: 1,
          text: 'First, click on the "File" menu to open the options.',
          hasNextButton: true,
          box: { x: 0.05, y: 0.1, width: 0.2, height: 0.08 },
        },
      ],
    },
    {
      id: "sp2",
      time: 12, // Pause again at 12 seconds
      areas: [
        {
          id: "area2",
          type: "oval",
          order: 1,
          text: 'Now, select the "Save As..." option. Notice there is no "Continue" button; clicking the highlight will proceed.',
          hasNextButton: false,
          box: { x: 0.1, y: 0.3, width: 0.3, height: 0.1 },
        },
      ],
    },
  ],
};

function MyTutorial() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <TutorialVideoPlayer videoSource={videoUrl} TutorialJsonData={TutorialJsonData} />
    </div>
  );
}

export default MyTutorial;
```

### Advanced Example with Customization

This example shows a more realistic scenario where you might load a video `File` and a JSON file, and customize the player's appearance and behavior.

```jsx
import React, { useState } from "react";
import { TutorialVideoPlayer, TutorialJsonData } from "react-tutorial-video";
import "react-tutorial-video/dist/index.css";

function AdvancedPlayer() {
  const [videoFile, setVideoFile] = (useState < File) | (null > null);
  const [jsonData, setJsonData] = (useState < TutorialJsonData) | (null > null);

  // In a real app, you would use file inputs to set these state variables.
  // For this example, we'll assume they are loaded.

  return (
    <div>
      {/* Add your file input UI here */}

      {videoFile && jsonData ? (
        <TutorialVideoPlayer
          videoSource={videoFile}
          TutorialJsonData={jsonData}
          // Customize the player's colors to a green theme
          colors={{
            primary: "#10B981", // green-500
            secondary: "#6EE7B7", // green-300
          }}
          // Customize the button and overlay text
          labels={{
            start: "Begin Lesson",
            continue: "Next Step",
            complete: "Lesson Finished!",
            replay: "Start Over",
          }}
          // Hide the timeline if you want a cleaner look
          showTimeline={true}
          // Add callbacks to track user progress
          onTutorialStart={() => console.log("Tutorial has started!")}
          onTutorialComplete={() => alert("Congratulations, you finished the tutorial!")}
          onNextInteraction={(stopPoint, areaIndex) => {
            console.log(`User advanced to step ${areaIndex + 1} at ${stopPoint.time}s`);
          }}
        />
      ) : (
        <p>Please upload a video and a tutorial JSON file.</p>
      )}
    </div>
  );
}
```

## Props API

| Prop                 | Type                        | Required | Default                                        | Description                                                                                             |
| -------------------- | --------------------------- | -------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `videoSource`        | `string \| File`            | Yes      | `undefined`                                    | The URL of the video or a `File` object from an input.                                                  |
| `TutorialJsonData`   | `TutorialJsonData`          | Yes      | `undefined`                                    | The parsed JSON object containing the tutorial steps.                                                   |
| `labels`             | `object`                    | No       | `{ start, continue, complete, replay }`        | An object with string values to override the default text for UI elements.                              |
| `colors`             | `object`                    | No       | `{ primary: '#3B82F6', secondary: '#8B5CF6' }` | An object with `primary` and `secondary` hex color strings to theme the player.                         |
| `showTimeline`       | `boolean`                   | No       | `true`                                         | If `false`, the segmented progress timeline below the video will be hidden.                             |
| `onTutorialStart`    | `() => void`                | No       | `undefined`                                    | A callback function that fires when the user clicks the initial "Start" button.                         |
| `onTutorialComplete` | `() => void`                | No       | `undefined`                                    | A callback function that fires when the video ends after all stop points have been completed.           |
| `onNextInteraction`  | `(stopPoint, area) => void` | No       | `undefined`                                    | A callback that fires every time the user clicks "Continue" or a clickable highlight to advance a step. |

### Importing Types

If you are using TypeScript, you can import the `TutorialJsonData` type for type safety.

```typescript
import type { TutorialJsonData } from "react-tutorial-video";
```

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📑 ToDo

- [ ] Add custom styling
- [ ] Remove tailwindcss dependencies
- [ ] Include editor
- [x] Fallback video
