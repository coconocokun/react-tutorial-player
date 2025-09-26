// hooks/useMediaQuery.ts
import { useState, useEffect } from "react";

export const useMediaQuery = (query: string): boolean => {
  // Get the initial value on the client-side
  const [matches, setMatches] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false; // Default to false on the server
  });

  useEffect(() => {
    // Ensure this runs only on the client
    if (typeof window === "undefined") {
      return;
    }

    const mediaQueryList = window.matchMedia(query);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // The 'change' event is the modern way to listen for changes
    mediaQueryList.addEventListener("change", listener);

    // Clean up the listener when the component unmounts
    return () => {
      mediaQueryList.removeEventListener("change", listener);
    };
  }, [query]); // Re-run the effect if the query string changes

  return matches;
};
