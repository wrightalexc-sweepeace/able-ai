// app/components/shared/AiSuggestionBanner.tsx
"use client";

import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  X,
  MessageSquare,
} from "lucide-react";
import { useRouter } from "next/navigation";
import styles from "./AiSuggestionBanner.module.css";

export interface SuggestedAction {
  text: string;      // User-facing text for the action, e.g., "Complete your profile"
  linkKey?: string; // An identifier for a link, e.g., "PROFILE_EDIT", to be mapped to a URL by the frontend
}

export interface Suggestion {
  id: string;
  title: string;        // e.g., "Boost Your Profile!"
  description: string;  // e.g., "Adding more details to your profile can attract more offers."
  suggestedActions?: SuggestedAction[]; // Array of 1-4 actions, for use in the AI chat page
}

interface AiSuggestionBannerProps {
  suggestions: Suggestion[];
  currentIndex: number;
  isLoading: boolean;
  error: string | null;
  dismissed: boolean; // New prop to control internal visibility
  onDismiss: () => void;
  onRefresh: () => void;
  goToNext: () => void;
  goToPrev: () => void;
  userId: string;
  className?: string;
}

export default function AiSuggestionBanner({
  suggestions,
  currentIndex,
  isLoading,
  error,
  dismissed,
  onDismiss,
  onRefresh,
  goToNext,
  goToPrev,
  userId,
  className = "",
}: AiSuggestionBannerProps) {
  const router = useRouter();
  const currentSuggestion =
    suggestions && suggestions.length > 0 && currentIndex < suggestions.length
      ? suggestions[currentIndex]
      : null;

  if (dismissed) {
    return (
      <div
        className={`${styles.suggestionBanner} ${styles.suggestionTextContainer} ${className}`}
      >
        <p className={styles.dismissedText}>AI suggestions are hidden.</p>
        <button onClick={onRefresh}>
          Show Ideas
        </button>
      </div>
    );
  }

  const handleSuggestionInteraction = () => {
    if (!userId || !currentSuggestion) return;

    // Save the current suggestion to localStorage for the chat page to pick up
    const suggestionWithTimestamp = {
      ...currentSuggestion,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(
      "lastAISuggestion",
      JSON.stringify(suggestionWithTimestamp)
    );

    // Navigate to the AI chat page with the suggestion as a URL parameter
    const encodedSuggestion = encodeURIComponent(
      JSON.stringify(suggestionWithTimestamp)
    );
    router.push(`/user/${userId}/able-ai?suggestion=${encodedSuggestion}`);
  };

  if (isLoading) {
    return (
      <div className={`${styles.suggestionTextContainer} ${className}`}>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`}>...</div>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`}>...</div>
        <div className={`${styles.skeletonLine} ${styles.skeletonLineLong}`}>...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`${styles.suggestionBanner} ${styles.error} ${className}`}
      >
        Error: {error}
        <button
          onClick={onRefresh}
          className={styles.controlButton}
          aria-label="Refresh suggestions"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    );
  }

  if (!currentSuggestion) {
    return null;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleSuggestionInteraction();
    }
  };

  // Main banner content when not dismissed
  return (
    <div
      className={`${styles.suggestionBanner} ${className}`}
      role="region"
      aria-labelledby="ai-suggestion-banner-heading"
    >
      <div className={styles.topRowContainer}>
        <div
          className={styles.suggestionTextContainer}
          onClick={handleSuggestionInteraction} // Keep this if clicking text also initiates chat
          onKeyDown={handleKeyDown} // Keep this if text is focusable for chat
          role="button" // Role and tabIndex if text itself is interactive for chat
          tabIndex={0}
          aria-live="polite"
        >
          <p className={styles.suggestionDescription}>
            {currentSuggestion.description}
          </p>
        </div>
      </div>

      <div className={styles.bottomControlsContainer}>
        <button
          onClick={onDismiss}
          className={`${styles.controlButton} ${styles.dismissButton}`}
          aria-label="Dismiss suggestions"
        >
          <X size={18} />
        </button>

        <button
          onClick={onRefresh}
          className={`${styles.controlButton} ${styles.refreshButtonIcon}`}
          aria-label="Refresh suggestions"
        >
          <RefreshCw size={18} />
        </button>

        {suggestions.length > 1 && (
          <div className={styles.inlineCarouselControls}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToPrev();
              }}
              className={styles.navButton}
              aria-label="Previous suggestion"
            >
              <ChevronLeft size={20} />
            </button>
            <span
              className={styles.suggestionCounter}
              aria-label={`Suggestion ${currentIndex + 1} of ${
                suggestions.length
              }`}
            >
              {currentIndex + 1} / {suggestions.length}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                goToNext();
              }}
              className={styles.navButton}
              aria-label="Next suggestion"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}

        <button
          onClick={handleSuggestionInteraction}
          className={`${styles.controlButton} ${styles.chatButton}`}
          aria-label="Chat about this suggestion"
        >
          <MessageSquare size={40} />{" "}
          {/* Potentially larger icon for oversized button */}
        </button>
      </div>
    </div>
  );
}
