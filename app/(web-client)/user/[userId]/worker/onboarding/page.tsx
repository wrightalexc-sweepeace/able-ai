/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect, useRef, ChangeEvent } from "react";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";

import pageStyles from "./OnboardWorkerPage.module.css";
import baseInitialSteps from "./initialSteps";
import { OnboardingStep } from "./OnboardingSteps";

import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";
import VideoRecorderBubble from "@/app/components/onboarding/VideoRecorderBubble";

import { useAuth } from "@/context/AuthContext";
import { setLastRoleUsed } from "@/lib/last-role-used";
import {
  getStorage,
  ref as storageRef,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import InputBubble from "@/app/components/onboarding/InputBubble";
import TextAreaBubble from "@/app/components/onboarding/TextAreaBubble";
import ShareLinkBubble from '@/app/components/onboarding/ShareLinkBubble';
import Loader from "@/app/components/shared/Loader";
import { geminiAIAgent } from '@/lib/firebase/ai';
import { useFirebase } from '@/context/FirebaseContext';
import { Schema } from '@firebase/ai';
import { useRouter } from "next/navigation";
import LocationPickerBubble from '@/app/components/onboarding/LocationPickerBubble';

// Define worker-specific required fields and their configs
const workerRequiredFields = [
  { name: "about", type: "textarea", label: "Tell us about yourself:", defaultPrompt: "Tell us about yourself and your background as a worker." },
  { name: "experience", type: "textarea", label: "Experience:", defaultPrompt: "How many years of experience do you have? What kind of gigs have you done?" },
  { name: "skills", type: "textarea", label: "Special Skills:", defaultPrompt: "Do you have any special skills or certifications?" },
  { name: "hourlyRate", type: "number", label: "Hourly Rate:", defaultPrompt: "What is your expected hourly rate?" },
  { name: "location", type: "text", label: "Location/Travel:", defaultPrompt: "Where are you based, and how far are you willing to travel for gigs?" },
  { name: "availability", type: "date", label: "Availability:", defaultPrompt: "When are you available to work? (Pick a date)" },
  { name: "stripe", type: "stripe", label: "Stripe Integration", defaultPrompt: "Connect your Stripe account to get paid. (You can skip this for now)" },
  { name: "videoIntro", type: "video", label: "Video Introduction:", defaultPrompt: "Record a short video introduction (or skip for now)." },
  { name: "references", type: "textarea", label: "References:", defaultPrompt: "Do you have any references or testimonials?" },
  { name: "referral", type: "referral", label: "Referral Link:", defaultPrompt: "Share your referral link (or skip for now)." },
];

const workerStepSchema = Schema.object({
  properties: {
    field: Schema.string(),
    prompt: Schema.string(),
    isComplete: Schema.boolean(),
    isClarification: Schema.boolean(),
  },
});

// Helper to robustly format summary values
function formatSummaryValue(value: any, field?: string) {
  if (field === 'location' && typeof value === 'string' && value.length > 40) {
    return value.slice(0, 37) + '...';
  }
  if (field === 'location' && typeof value === 'object' && value !== null && 'lat' in value && 'lng' in value) {
    return `Lat: ${value.lat}, Lng: ${value.lng}`;
  }
  if (typeof value === "string" && !isNaN(Date.parse(value))) {
    return new Date(value).toLocaleDateString();
  }
  if (value instanceof Date) {
    return value.toLocaleDateString();
  }
  if (typeof value === "object" && value !== null && typeof value.toISOString === "function") {
    return new Date(value).toLocaleDateString();
  }
  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }
  return String(value);
}

// Helper to extract coordinates from Google Maps URL
function extractCoordsFromGoogleMapsUrl(url: string) {
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
}

// Overhaul: static, linear, step-driven onboarding for workers
const workerSteps = [
  { name: "about", type: "textarea", label: "Tell us about yourself:", prompt: "Tell us about yourself and your background as a worker." },
  { name: "experience", type: "textarea", label: "Experience:", prompt: "How many years of experience do you have? What kind of gigs have you done?" },
  { name: "skills", type: "textarea", label: "Special Skills:", prompt: "Do you have any special skills or certifications?" },
  { name: "hourlyRate", type: "number", label: "Hourly Rate:", prompt: "What is your expected hourly rate?" },
  { name: "location", type: "text", label: "Location/Travel:", prompt: "Where are you based, and how far are you willing to travel for gigs?" },
  { name: "availability", type: "calendar", label: "Availability:", prompt: "Let me know when you are available for work in your calendar." },
  { name: "stripe", type: "stripe", label: "Stripe Integration", prompt: "Do you have a Stripe account, or are you willing to create one?" },
  { name: "videoIntro", type: "video", label: "Video Introduction:", prompt: "Please provide a video introduction." },
  { name: "references", type: "textarea", label: "References:", prompt: "Can you provide your references?" },
  { name: "referral", type: "referral", label: "Referral Link:", prompt: "Do you have any referrals?" },
];

export default function OnboardWorkerPage() {
  const { user, loading: loadingAuth } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [chatSteps, setChatSteps] = useState<any[]>([
    { id: 1, type: "bot", content: workerSteps[0].prompt },
    { id: 2, type: "input", inputConfig: { type: workerSteps[0].type, name: workerSteps[0].name, label: workerSteps[0].label }, isComplete: false }
  ]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [confirmed, setConfirmed] = useState(false);
  const [skipped, setSkipped] = useState<Record<string, boolean>>({});
  const stepCounterRef = useRef(1);
  function getNextStepId() { return stepCounterRef.current++; }

  useEffect(() => {
    setCurrentStepIdx(0);
    setFormData({});
    setConfirmed(false);
    setSkipped({});
    setChatSteps([
      { id: 1, type: "bot", content: workerSteps[0].prompt },
      { id: 2, type: "input", inputConfig: { type: workerSteps[0].type, name: workerSteps[0].name, label: workerSteps[0].label }, isComplete: false }
    ]);
  }, [user?.claims.role]);

  useEffect(() => {
    endOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatSteps]);

  const step = workerSteps[currentStepIdx];
  const isLastStep = currentStepIdx === workerSteps.length - 1;
  const showConfirm = step && !["stripe", "video", "referral"].includes(step.type) && formData[step.name] !== undefined && !confirmed;

  useEffect(() => {
    if (showConfirm && endOfChatRef.current) {
      setTimeout(() => {
        endOfChatRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 0);
    }
  }, [showConfirm]);

  if (loadingAuth) {
    return (
      <div className={pageStyles.loadingContainer}>
        <p>Loading authentication...</p>
      </div>
    );
  }
  if (!user) {
    return <Loader />;
  }

  function handleInputChange(name: string, value: any) {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setConfirmed(false);
  }

  function handleConfirm() {
    setConfirmed(true);
    setChatSteps(prev => {
      const nextIdx = currentStepIdx + 1;
      const nextStep = workerSteps[nextIdx];
      const newSteps = [...prev];
      // Add user message if not already present
      if (!prev.some(s => s.type === 'user' && s.name === step.name)) {
        newSteps.push({ id: getNextStepId(), type: 'user', name: step.name, content: formData[step.name] });
      }
      if (nextStep) {
        // Add typing indicator first
        const typingId = getNextStepId();
        newSteps.push({ id: typingId, type: 'typing' });
        // After delay, replace typing with bot message and input
        setTimeout(() => {
          setChatSteps(current => {
            // Remove typing indicator
            let filtered = current.filter(s => s.id !== typingId);
            // Remove any input or bot message for the same field (for all fields, not just next)
            filtered = filtered.filter(s => {
              if ((s.type === "input" || s.type === "calendar" || s.type === "textarea") && s.inputConfig?.name === nextStep.name) {
                return false;
              }
              if ((s.type === "calendar") && s.name === nextStep.name) {
                return false;
              }
              if (s.type === 'bot' && s.content === nextStep.prompt) {
                return false;
              }
              return true;
            });
            // Add the next bot message and input for the new field
            const stepsWithBot = [
              ...filtered,
              { id: getNextStepId(), type: 'bot', content: nextStep.prompt }
            ];
            if (["stripe", "video", "referral"].includes(nextStep.type)) {
              stepsWithBot.push({ id: getNextStepId(), type: nextStep.type, label: nextStep.label });
            } else if (nextStep.type === "calendar") {
              stepsWithBot.push({ id: getNextStepId(), type: "calendar", name: nextStep.name, label: nextStep.label });
            } else {
              stepsWithBot.push({ id: getNextStepId(), type: "input", inputConfig: { type: nextStep.type, name: nextStep.name, label: nextStep.label }, isComplete: false });
            }
            return stepsWithBot;
          });
        }, 700); // Shorter delay for more responsive feel
      }
      return newSteps;
    });
    setTimeout(() => {
      setCurrentStepIdx((idx) => idx + 1);
      setConfirmed(false);
    }, 200);
  }

  function handleSkip() {
    setSkipped((prev) => ({ ...prev, [step.name]: true }));
    setConfirmed(true);
    setChatSteps(prev => {
      const nextIdx = currentStepIdx + 1;
      const nextStep = workerSteps[nextIdx];
      const newSteps = [...prev];
      if (nextStep) {
        newSteps.push({ id: getNextStepId(), type: 'bot', content: nextStep.prompt });
        if (["stripe", "video", "referral"].includes(nextStep.type)) {
          newSteps.push({ id: getNextStepId(), type: nextStep.type, label: nextStep.label });
        } else if (nextStep.type === "calendar") {
          newSteps.push({ id: getNextStepId(), type: "calendar", name: nextStep.name, label: nextStep.label });
        } else {
          newSteps.push({ id: getNextStepId(), type: "input", inputConfig: { type: nextStep.type, name: nextStep.name, label: nextStep.label }, isComplete: false });
        }
      }
      return newSteps;
    });
    setTimeout(() => {
      setCurrentStepIdx((idx) => idx + 1);
      setConfirmed(false);
    }, 200);
  }

  function formatSummaryValue(value: any) {
    if (value && typeof value === 'object') {
      if ('lat' in value && 'lng' in value) {
        return `Lat: ${value.lat}, Lng: ${value.lng}`;
      }
      return JSON.stringify(value);
    }
    if (typeof value === "string" && !isNaN(Date.parse(value))) {
      return new Date(value).toLocaleDateString();
    }
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === "object" && value !== null && typeof value.toISOString === "function") {
      return new Date(value).toLocaleDateString();
    }
    return String(value);
  }

  if (currentStepIdx >= workerSteps.length) {
    // Show summary and confirm button
    return (
      <ChatBotLayout ref={chatContainerRef} onScroll={() => {}}>
        <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
          <h3 style={{ marginTop: 0 }}>Profile Summary</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {workerSteps.map(({ name, label }) => (
              <li key={name} style={{ marginBottom: 8 }}>
                <strong style={{ textTransform: 'capitalize' }}>{label}: </strong>
                <span>{formatSummaryValue(formData[name])}</span>
              </li>
            ))}
          </ul>
          <button
            style={{ marginTop: 16, background: "#0f766e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600 }}
            onClick={() => window.location.href = `/user/${user?.uid}/worker/dashboard`}
          >
            Confirm & Go to Dashboard
          </button>
        </div>
      </ChatBotLayout>
    );
  }

  return (
    <ChatBotLayout ref={chatContainerRef} onScroll={() => {}}>
      {chatSteps.map((step, idx) => {
        const key = step.id;
        if (step.type === "bot") {
          return <MessageBubble key={key} text={step.content} senderType="bot" />;
        }
        if (step.type === "typing") {
          return <MessageBubble key={key} text={<TypingIndicator />} senderType="bot" />;
        }
        if (step.type === "user") {
          // Always stringify objects for user messages
          const userText = typeof step.content === 'object' ? JSON.stringify(step.content) : String(step.content);
          return <MessageBubble key={key} text={userText} senderType="user" showAvatar={false} />;
        }
        if (step.type === "calendar") {
          // Only show Confirm if this is the last calendar step, not confirmed, and a date is selected
          const isActive = idx === chatSteps.length - 1 && !confirmed;
          return (
            <React.Fragment key={key}>
              <CalendarPickerBubble
                value={formData[step.name] ? new Date(formData[step.name]) : null}
                onChange={date => handleInputChange(step.name, date ? date.toISOString() : "")}
              />
              {isActive && formData[step.name] && (
                <button
                  style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                  onClick={handleConfirm}
                >
                  Confirm
                </button>
              )}
            </React.Fragment>
          );
        }
        if (step.type === "input") {
          // Custom UI for location (worker) step
          if (step.inputConfig?.name === "location") {
            // Only show Confirm if this is the last input step and not confirmed
            const isActive = idx === chatSteps.length - 1 && !confirmed;
            return (
              <TextAreaBubble
                key={key}
                {...commonProps}
                value={value}
                placeholder={inputConfig.placeholder}
                rows={3}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  handleInputChange(inputConfig.name, e.target.value)
                }
                ref={(el: HTMLTextAreaElement | null) => {
                  if (el && currentFocusedInputName === inputConfig.name)
                    el.focus();
                }}
              />
            );
          }
          if (
            inputConfig.type === "text" ||
            inputConfig.type === "email" ||
            inputConfig.type === "number"
          ) {
            const value =
              typeof rawValue === "string" || typeof rawValue === "number"
                ? rawValue
                : "";
            return (
              <InputBubble
                key={key}
                {...commonProps}
                value={value}
                type={inputConfig.type}
                placeholder={inputConfig.placeholder}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  handleInputChange(inputConfig.name, e.target.value)
                }
                ref={(el: HTMLInputElement | null) => {
                  if (el && currentFocusedInputName === inputConfig.name)
                    el.focus();
                }}
              />
            );
          }
          if (step.type === "datePicker") {
            return (
              <CalendarPickerBubble
                onChange={(date) =>
                  handleCalendarChange(date, step.id, inputConfig.name)
                }
                key={key}
              />
            );
          }
          if (step.type === "recordVideo") {
            return (
              <VideoRecorderBubble
                key={key}
                onVideoRecorded={(file) =>
                  handleVideoUpload(file, inputConfig.name, step.id)
                }
                onFileUploaded={(file) =>
                  handleVideoUpload(file, inputConfig.name, step.id)
                }
                prompt={step.content as string}
                uploadProgress={uploadProgress[inputConfig.name]}
              />
            );
          }
        }
        return null;
      })}
      {/* Confirm button for non-location, non-calendar steps */}
      {showConfirm && step?.type !== "calendar" && step?.name !== "location" && (
        <button
          style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
          onClick={handleConfirm}
        >
          Confirm
        </button>
      )}
      <div ref={endOfChatRef} />
    </ChatBotLayout>
  );
}

// Typing indicator component
const TypingIndicator: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px', color: '#0f766e', fontWeight: 600 }}>
    <span className="typing-dot" style={{ animation: 'blink 1s infinite' }}>.</span>
    <span className="typing-dot" style={{ animation: 'blink 1s infinite 0.2s' }}>.</span>
    <span className="typing-dot" style={{ animation: 'blink 1s infinite 0.4s' }}>.</span>
    <style>{`
      @keyframes blink { 0%, 80%, 100% { opacity: 0.2; } 40% { opacity: 1; } }
    `}</style>
  </div>
);
