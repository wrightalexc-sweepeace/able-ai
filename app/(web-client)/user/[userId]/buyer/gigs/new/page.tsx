"use client";

import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import ChatBotLayout from "@/app/components/onboarding/ChatBotLayout";
import MessageBubble from "@/app/components/onboarding/MessageBubble";
import InputBubble from "@/app/components/onboarding/InputBubble"; // Corrected path
import TextAreaBubble from "@/app/components/onboarding/TextAreaBubble"; // Corrected path
// import FileUploadBubble from '@/app/components/onboarding/FileUploadBubble'; // Corrected path - Uncomment if used
import WorkerCard, { WorkerData } from "@/app/components/onboarding/WorkerCard"; // Import shared WorkerCard and WorkerData
import MapLinkBubble from '@/app/components/onboarding/MapLinkBubble';
import LocationPickerBubble from "@/app/components/onboarding/LocationPickerBubble";
import CalendarPickerBubble from "@/app/components/onboarding/CalendarPickerBubble";

import Loader from "@/app/components/shared/Loader";

import pageStyles from "./page.module.css";
import { useAuth } from "@/context/AuthContext";
import { StepInputConfig } from "@/app/types/form";
import { geminiAIAgent } from '@/lib/firebase/ai';
import { useFirebase } from '@/context/FirebaseContext';
import { Schema } from '@firebase/ai';

interface OnboardingStep {
  id: number;
  type:
    | "botMessage"
    | "userInput"
    | "userResponseDisplay"
    | "workerCard"
    | "terms"
    | "fileUpload"
    | "datePicker"
    | "discountCode";
  senderType?: "bot" | "user";
  content?: string | React.ReactNode; // For message-like steps or labels for non-input steps
  inputConfig?: StepInputConfig; // Configuration for input fields if the step type involves input
  isComplete?: boolean;
  dependsOn?: number;
  value?: any; // Stores the submitted value of the input for this step
  workerData?: WorkerData;
}

// WorkerData interface and WorkerCard component removed - now imported

const baseInitialSteps: OnboardingStep[] = [
  {
    id: 1,
    type: "botMessage",
    content:
      "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!",
  },
  {
    id: 2,
    type: "userInput",
    inputConfig: {
      type: "text",
      name: "gigDescription",
      placeholder: "e.g., Bartender for a wedding reception",
      label: "Gig Description:",
    },
  },
  {
    id: 3,
    type: "botMessage",
    content:
      "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?",
    dependsOn: 1,
  },
  {
    id: 4,
    type: "userInput",
    inputConfig: {
      type: "textarea",
      name: "additionalInstructions",
      placeholder: "e.g., Cocktail making experience would be ideal",
      label: "Additional Instructions:",
      rows: 3,
    },
    dependsOn: 2,
  },
  {
    id: 5,
    type: "botMessage",
    content:
      "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!",
    dependsOn: 3,
  },
  {
    id: 6,
    type: "userInput",
    inputConfig: {
      type: "number",
      name: "hourlyRate",
      placeholder: "£15",
      label: "Hourly Rate:",
    },
    dependsOn: 4,
  },
  {
    id: 7,
    type: "botMessage",
    content:
      "Where is the gig? What time and day do you need someone and for how long?",
    dependsOn: 5,
  },
  {
    id: 8,
    type: "userInput",
    inputConfig: {
      type: "text",
      name: "gigLocation",
      placeholder: "e.g., The Green Tavern, Rye Lane, Peckham, SE15 5AR",
      label: "Gig Location:",
    },
    dependsOn: 6,
  },
  {
    id: 9,
    type: "userInput", // Or "datePicker" if it has distinct UI/logic beyond a standard input
    inputConfig: {
      type: "date",
      name: "gigDate",
      label: "Date of Gig:",
    },
    dependsOn: 8,
  },
  {
    id: 10,
    type: "discountCode", // This implies a specific UI or handling logic, not a standard input field
    content: "I have a discount code 2FREEABLE",
    dependsOn: 9,
  },
  {
    id: 11,
    type: "botMessage",
    content: "Thankyou! We will apply your discount code",
    dependsOn: 10,
  },
  {
    id: 12,
    type: "botMessage",
    content:
      "Here are our incredible available gig workers ready to accept your gig. Click on their profile for an indepth look at their gigfolio or simply book now",
    dependsOn: 10,
  },
  {
    id: 13,
    type: "workerCard",
    dependsOn: 12,
    workerData: {
      name: "Benji Asamoah",
      title: "Bartender",
      gigs: 15,
      experience: "3 years experience",
      keywords: "lively, professional and hardworking",
      hourlyRate: 15,
      totalHours: 6,
      totalPrice: 98.68,
      ableFees: "6.5% +VAT",
      stripeFees: "1.5% + 20p",
      imageSrc: "/images/benji.jpeg", // Replace with actual image URL
    },
  },
  {
    id: 14,
    type: "workerCard",
    dependsOn: 12, // Should depend on the previous message, not the previous card for parallel display
    workerData: {
      name: "Jessica Hersey",
      title: "Bartender",
      gigs: 11,
      experience: "2 years experience",
      keywords: "reliable, friendly and experienced",
      hourlyRate: 15,
      totalHours: 6,
      totalPrice: 85.55,
      ableFees: "6.5% +VAT",
      stripeFees: "1.5% + 20p",
      imageSrc: "/images/jessica.jpeg", // Replace with actual image URL
    },
  },
];

// Define required fields and their configs
const requiredFields = [
  { name: "gigDescription", type: "text", label: "Gig Description:", defaultPrompt: "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!" },
  { name: "additionalInstructions", type: "textarea", label: "Additional Instructions:", defaultPrompt: "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?" },
  { name: "hourlyRate", type: "number", label: "Hourly Rate:", defaultPrompt: "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!" },
  { name: "gigLocation", type: "text", label: "Gig Location:", defaultPrompt: "Where is the gig? What time and day do you need someone and for how long?" },
  { name: "gigDate", type: "date", label: "Date of Gig:", defaultPrompt: "What is the date of the gig?" },
];

const gigStepSchema = Schema.object({
  properties: {
    field: Schema.string(),
    prompt: Schema.string(),
    isComplete: Schema.boolean(),
  },
});
const gigSummarySchema = Schema.object({
  properties: {
    gigDescription: Schema.string(),
    additionalInstructions: Schema.string(),
    hourlyRate: Schema.number(),
    gigLocation: Schema.string(),
    gigDate: Schema.string(),
    discountCode: Schema.string(),
    selectedWorker: Schema.string(),
  },
  optionalProperties: ["discountCode", "selectedWorker"],
});

function buildPromptFromFormData(formData: Record<string, any>, lastField: string, lastValue: any) {
  return `
You are an onboarding assistant for gig creation. Here is the conversation so far:

${Object.entries(formData)
  .map(([field, value]) => `User answered "${value}" for "${field}".`)
  .join('\n')}

The last question was about "${lastField}", and the user answered: "${lastValue}".

Your job is to:
- Respond in a friendly, helpful, and concise way, like the following examples:
  - "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!"
  - "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?"
  - "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!"
  - "Where is the gig? What time and day do you need someone and for how long?"
- If the answer is clear, confirm it and move to the next logical question (e.g., ask about pay, location, date, etc.).
- If the answer is unclear, ask for clarification.
- If all required info is collected, summarize and confirm.

Respond as a single message, as if you are the bot in a chat.`;
}

type ChatStep = {
  id: number;
  type: "bot" | "user" | "input" | "sanitized";
  content?: string;
  inputConfig?: StepInputConfig;
  isComplete?: boolean;
  sanitizedValue?: string;
  originalValue?: string;
  fieldName?: string;
};

// Define the onboarding steps statically, following the original order and messages
const staticOnboardingSteps: ChatStep[] = [
  {
    id: 1,
    type: "bot",
    content: "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!",
  },
  {
    id: 2,
    type: "input",
    inputConfig: {
      type: "text",
      name: "gigDescription",
      label: "Gig Description:",
    },
    isComplete: false,
  },
  {
    id: 3,
    type: "bot",
    content: "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?",
  },
  {
    id: 4,
    type: "input",
    inputConfig: {
      type: "textarea",
      name: "additionalInstructions",
      placeholder: "e.g., Cocktail making experience would be ideal",
      label: "Additional Instructions:",
      rows: 3,
    },
    isComplete: false,
  },
  {
    id: 5,
    type: "bot",
    content: "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!",
  },
  {
    id: 6,
    type: "input",
    inputConfig: {
      type: "number",
      name: "hourlyRate",
      placeholder: "£15",
      label: "Hourly Rate:",
    },
    isComplete: false,
  },
  {
    id: 7,
    type: "bot",
    content: "Where is the gig? What time and day do you need someone and for how long?",
  },
  {
    id: 8,
    type: "input",
    inputConfig: {
      type: "text",
      name: "gigLocation",
      placeholder: "e.g., The Green Tavern, Rye Lane, Peckham, SE15 5AR",
      label: "Gig Location:",
    },
    isComplete: false,
  },
  {
    id: 9,
    type: "input",
    inputConfig: {
      type: "date",
      name: "gigDate",
      label: "Date of Gig:",
    },
    isComplete: false,
  },
];

// Helper to extract coordinates from Google Maps URL
function extractCoordsFromGoogleMapsUrl(url: string) {
  // Try to match @lat,lng or q=lat,lng
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  return null;
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

// Add a helper to safely extract AI response properties
type AIResponse = {
  sufficient?: boolean;
  clarificationPrompt?: string;
  sanitized?: string;
  summary?: string;
  nextField?: string;
  nextPrompt?: string;
};
function parseAIResponse(data: any): Required<AIResponse> {
  return {
    sufficient: typeof data.sufficient === 'boolean' ? data.sufficient : false,
    clarificationPrompt: typeof data.clarificationPrompt === 'string' ? data.clarificationPrompt : '',
    sanitized: typeof data.sanitized === 'string' ? data.sanitized : '',
    summary: typeof data.summary === 'string' ? data.summary : '',
    nextField: typeof data.nextField === 'string' ? data.nextField : '',
    nextPrompt: typeof data.nextPrompt === 'string' ? data.nextPrompt : '',
  };
}

export default function OnboardBuyerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const endOfChatRef = useRef<HTMLDivElement>(null);
  const { ai } = useFirebase();

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<string | null>(null);
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([{
    id: 1,
    type: "bot",
    content: "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!",
  }, {
    id: 2,
    type: "input",
    inputConfig: {
      type: "text",
      name: "gigDescription",
      label: "Gig Description:",
    },
    isComplete: false,
  }]);
  // Expanded state for summary fields
  const [expandedSummaryFields, setExpandedSummaryFields] = useState<Record<string, boolean>>({});
  // Add state for typing animation
  const [isTyping, setIsTyping] = useState(false);
  // Update state to track reformulation
  const [pendingSanitization, setPendingSanitization] = useState<null | { field: string; value: string }>(null);
  const [sanitizing, setSanitizing] = useState(false);
  const [sanitizedValue, setSanitizedValue] = useState<string | null>(null);
  const [sanitizedStepId, setSanitizedStepId] = useState<number | null>(null);
  const [reformulateField, setReformulateField] = useState<string | null>(null);

  // Helper to get next required field not in formData
  function getNextRequiredField(formData: Record<string, any>) {
    return requiredFields.find(f => !formData[f.name]);
  }

  // Helper to determine if this is the active input step
  function isActiveInputStep(step: ChatStep, idx: number) {
    // The last input step in chatSteps and not complete
    return step.type === 'input' && !step.isComplete && idx === chatSteps.length - 1 && !isTyping;
  }

  // Remove staticOnboardingSteps and requiredFields logic for dynamic AI-driven flow
  // Only the first question is hardcoded
  const FIRST_QUESTION = "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!";

  // Helper to build AI prompt for validation, sanitization, and next question
  function buildAIPrompt(conversation: ChatStep[], formData: Record<string, any>) {
    // Find the last bot question and user answer
    const lastBot = [...conversation].reverse().find(s => s.type === 'bot');
    const lastUser = [...conversation].reverse().find(s => s.type === 'user');
    const lastQuestion = lastBot?.content || '';
    const lastAnswer = lastUser?.content || '';
    return `You are an onboarding assistant for gig creation. Here is the conversation so far:\n\n${conversation.map(s => s.type === 'bot' ? `Bot: ${s.content}` : s.type === 'user' ? `User: ${s.content}` : '').filter(Boolean).join('\n')}\n\nHere is the data collected: ${JSON.stringify(formData)}\nThe last question was: "${lastQuestion}"\nThe user answered: "${lastAnswer}"\nIs this answer sufficient? If not, provide a clarification prompt. If yes, sanitize the answer and provide the next question (or summary if done). Respond as JSON: { sufficient: boolean, sanitized?: string, clarificationPrompt?: string, nextField?: string, nextPrompt?: string, summary?: string }`;
  }

  // Update handleInputSubmit to trigger AI validation/sanitization/next-question
  async function handleInputSubmit(stepId: number, inputName: string) {
    if (!formData[inputName]) return;
    // Mark input as complete and add user message
    setChatSteps((prev) => {
      const updated = prev.map((step) =>
        step.id === stepId ? { ...step, isComplete: true } : step
      );
      const userMsg: ChatStep = {
        id: Date.now(),
        type: "user",
        content: formData[inputName],
      };
      return [...updated, userMsg];
    });
    setSanitizing(true);
    setPendingSanitization({ field: inputName, value: formData[inputName] });
  }

  // After the last input, show a summary message (optionally call AI for summary)
  // useEffect(() => {
  //   if (chatSteps.length > 0 && chatSteps[chatSteps.length - 1].type === "input" && !chatSteps[chatSteps.length - 1].isComplete) {
  //     // All fields collected, show summary
  //     const summaryMsg: ChatStep = {
  //       id: Date.now() + 1,
  //       type: "bot",
  //       content: `Thank you! Here is a summary of your gig:\n${JSON.stringify(formData, null, 2)}`,
  //     };
  //     setChatSteps((prev) => [...prev, summaryMsg]);
  //   }
  // }, [chatSteps.length, formData]);

  // Replace sanitization effect with AI-driven validation/sanitization/next-question
  useEffect(() => {
    if (pendingSanitization && sanitizing) {
      (async () => {
        // Build conversation history for AI
        const conversation = chatSteps.filter(s => s.type === 'bot' || s.type === 'user');
        const aiPrompt = buildAIPrompt(conversation, formData);
        const aiSchema = Schema.object({
          properties: {
            sufficient: Schema.boolean(),
            sanitized: Schema.string(),
            clarificationPrompt: Schema.string(),
            nextField: Schema.string(),
            nextPrompt: Schema.string(),
            summary: Schema.string(),
          },
          optionalProperties: ["sanitized", "clarificationPrompt", "nextField", "nextPrompt", "summary"]
        });
        const result = await geminiAIAgent(
          "gemini-2.5-flash-preview-05-20",
          { prompt: aiPrompt, responseSchema: aiSchema },
          ai
        );
        let aiData = result.ok && result.data ? result.data : {};
        const { sufficient, clarificationPrompt, sanitized } = parseAIResponse(aiData);
        if (!sufficient) {
          // Ask for clarification
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "bot",
              content: clarificationPrompt || "Could you clarify your answer?",
            },
            {
              id: Date.now() + 2,
              type: "input",
              inputConfig: {
                type: "text",
                name: pendingSanitization.field,
                label: clarificationPrompt || "Please clarify:",
              },
              isComplete: false,
            },
          ]);
          setSanitizing(false);
          setPendingSanitization(null);
          return;
        }
        // If sufficient, show sanitized version for confirmation
        setSanitizedValue(sanitized || pendingSanitization.value);
        setSanitizedStepId(Date.now());
        setSanitizing(false);
      })();
    }
  }, [pendingSanitization, sanitizing, ai, chatSteps, formData]);

  // Update sanitized confirmation effect to use AI's next question or summary
  useEffect(() => {
    if (sanitizedValue && sanitizedStepId) {
      setChatSteps((prev) => [
        ...prev,
        {
          id: sanitizedStepId,
          type: "sanitized",
          content: sanitizedValue,
          sanitizedValue: sanitizedValue,
          originalValue: pendingSanitization?.value,
          fieldName: pendingSanitization?.field,
        },
      ]);
      setSanitizedValue(null);
      setPendingSanitization(null);
    }
  }, [sanitizedValue, sanitizedStepId, pendingSanitization]);

  function handleSanitizedConfirm(fieldName: string, sanitized: string) {
    // Update formData
    setFormData((prev) => ({ ...prev, [fieldName]: sanitized }));
    setReformulateField(null);
    setChatSteps((prev) => prev.map((step) =>
      step.type === "sanitized" && step.fieldName === fieldName ? { ...step, isComplete: true } : step
    ));
    // After confirmation, ask AI for next question or summary
    (async () => {
      const conversation = chatSteps.filter(s => s.type === 'bot' || s.type === 'user');
      const aiPrompt = buildAIPrompt(conversation, { ...formData, [fieldName]: sanitized });
      const aiSchema = Schema.object({
        properties: {
          sufficient: Schema.boolean(),
          sanitized: Schema.string(),
          clarificationPrompt: Schema.string(),
          nextField: Schema.string(),
          nextPrompt: Schema.string(),
          summary: Schema.string(),
        },
        optionalProperties: ["sanitized", "clarificationPrompt", "nextField", "nextPrompt", "summary"]
      });
      const result = await geminiAIAgent(
        "gemini-2.5-flash-preview-05-20",
        { prompt: aiPrompt, responseSchema: aiSchema },
        ai
      );
      let aiData = result.ok && result.data ? result.data : {};
      const { summary, nextField, nextPrompt } = parseAIResponse(aiData);
      if (summary) {
        setTimeout(() => {
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 1,
              type: "bot",
              content: summary,
            },
          ]);
        }, 700);
        return;
      }
      if (nextField && nextPrompt) {
        setTimeout(() => {
          setChatSteps((prev) => [
            ...prev,
            {
              id: Date.now() + 2,
              type: "bot",
              content: nextPrompt,
            },
            {
              id: Date.now() + 3,
              type: "input",
              inputConfig: {
                type: "text",
                name: nextField,
                label: nextPrompt,
              },
              isComplete: false,
            },
          ]);
        }, 700);
      }
    })();
  }

  function handleSanitizedReformulate(fieldName: string) {
    setReformulateField(fieldName);
    // Find the required field config and map to StepInputConfig (exclude defaultPrompt)
    const fieldConfig = requiredFields.find(f => f.name === fieldName);
    let inputConfig: Partial<StepInputConfig> = {};
    if (fieldConfig) {
      inputConfig = {
        name: fieldConfig.name,
        type: fieldConfig.type as StepInputConfig['type'],
        label: fieldConfig.label,
      };
      if ('placeholder' in fieldConfig && fieldConfig.placeholder) {
        (inputConfig as any).placeholder = fieldConfig.placeholder;
      }
      if ('rows' in fieldConfig && fieldConfig.rows) {
        (inputConfig as any).rows = fieldConfig.rows;
      }
    }
    setChatSteps((prev) => [
      ...prev,
      {
        id: Date.now(),
        type: "input",
        inputConfig: inputConfig as StepInputConfig,
        isComplete: false,
      },
    ]);
  }

  const handleInputChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBookWorker = (name: string, price: number) => {
    if (!user) return; // Disable booking if not logged in
    setIsSubmitting(true);
    const bookingResponseStep: ChatStep = {
      id: Date.now(),
      type: "user",
      content: `Booking ${name} for £${price.toFixed(2)}...`,
    };
    // Find index of step 11 to insert after it
    const lastBotMessageIndex = chatSteps.findIndex((s) => s.id === 11);
    if (lastBotMessageIndex !== -1) {
      setChatSteps((prev) => [...prev.slice(0, lastBotMessageIndex + 1), bookingResponseStep, ...prev.slice(lastBotMessageIndex + 1)]);
    } else {
      setChatSteps((prev) => [...prev, bookingResponseStep]);
    }
    setIsSubmitting(false);
    console.log(`Booking ${name} for £${price.toFixed(2)}`);
  };

  const handleFinalSubmit = async () => {
    if (!user) return; // Disable submission if not logged in
    setIsSubmitting(true);
    const submissionData = {
      ...formData,
      gigLocationCoords: formData.gigLocationCoords,
      workerName: null, // No longer needed
      workerPrice: null, // No longer needed
    };
    console.log("Mock Buyer Onboarding Data:", submissionData);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    console.log("Mock submission successful!");

    const contentMessage =
      "Thanks! Your request is being processed (Mocked).";

    const successMessageStep: ChatStep = {
      id: Date.now() + 1,
      type: "bot",
      content: contentMessage,
    };

    setChatSteps((prev) => [...prev, successMessageStep]);
    setIsSubmitting(false);
  };

  // Auto-scroll to the bottom (Confirm button or latest message) whenever chatSteps or isTyping changes
  useEffect(() => {
    if (endOfChatRef.current) {
      setTimeout(() => {
        endOfChatRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 0);
    }
  }, [chatSteps, isTyping]);

  if (!user) {
    return <Loader />;
  }

  return (
    <>
      <ChatBotLayout
        ref={chatContainerRef}
        onScroll={() => {}}
        onHomeClick={() => router.push(`/user/${user?.uid || "this_user"}/buyer`)}
        className={pageStyles.container}
      >
        {chatSteps.map((step, idx) => {
          const key = `step-${step.id}-${step.type}-${step.inputConfig?.name || Math.random()}`;
          if (step.type === "bot" && typeof step.content === "string" && step.content.startsWith("Thank you! Here is a summary of your gig:")) {
            // Try to extract and parse the JSON
            const match = step.content.match(/Thank you! Here is a summary of your gig:\n([\s\S]*)/);
            let summaryData = null;
            if (match) {
              try {
                summaryData = JSON.parse(match[1]);
              } catch (e) {
                summaryData = null;
              }
            }
            if (summaryData) {
              return (
                <div key={key} style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0002' }}>
                  <h3 style={{ marginTop: 0 }}>Gig Summary</h3>
                  <ul style={{ listStyle: 'none', padding: 0 }}>
                    {Object.entries(summaryData).map(([field, value]) => {
                      if (field === 'gigLocation' && typeof value === 'string' && value.length > 40) {
                        return (
                          <li key={field} style={{ marginBottom: 8 }}>
                            <strong style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                            <span
                              style={{
                                cursor: 'pointer',
                                wordBreak: 'break-all',
                                display: 'inline-block',
                                maxWidth: expandedSummaryFields[field] ? '100%' : 220,
                                whiteSpace: expandedSummaryFields[field] ? 'normal' : 'nowrap',
                                overflow: 'hidden',
                                textOverflow: expandedSummaryFields[field] ? 'clip' : 'ellipsis',
                                verticalAlign: 'bottom',
                              }}
                              title={expandedSummaryFields[field] ? 'Click to collapse' : 'Click to expand'}
                              onClick={() =>
                                setExpandedSummaryFields(prev => ({
                                  ...prev,
                                  [field]: !prev[field]
                                }))
                              }
                            >
                              {expandedSummaryFields[field] ? value : value.slice(0, 37) + '...'}
                            </span>
                          </li>
                        );
                      }
                      return (
                        <li key={field} style={{ marginBottom: 8 }}>
                          <strong style={{ textTransform: 'capitalize' }}>{field.replace(/([A-Z])/g, ' $1')}: </strong>
                          <span>
                            {value && typeof value === 'object' && 'lat' in value && 'lng' in value
                              ? `Lat: ${value.lat}, Lng: ${value.lng}`
                              : typeof value === 'object'
                                ? JSON.stringify(value)
                                : String(value)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <button
                    style={{ marginTop: 16, background: "#0f766e", color: "#fff", border: "none", borderRadius: 8, padding: "8px 16px", fontWeight: 600 }}
                    onClick={() => router.push(`/user/${user?.uid || "this_user"}/buyer/dashboard`)}
                  >
                    Confirm & Go to Dashboard
                  </button>
                </div>
              );
            }
            // Fallback to raw message if parsing fails
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="bot"
              />
            );
          }
          if (step.type === "bot") {
            return (
              <MessageBubble
                key={key}
                text={step.content as string}
                senderType="bot"
              />
            );
          }
          if (step.type === "user") {
            return (
              <MessageBubble
                key={key}
                text={typeof step.content === 'object' ? JSON.stringify(step.content) : String(step.content)}
                senderType="user"
                showAvatar={false}
              />
            );
          }
          if (step.type === "input" && !step.isComplete) {
            const inputConf = step.inputConfig!;
            // Custom UI for gigLocation
            if (inputConf.name === "gigLocation") {
              const isActive = isActiveInputStep(step, idx);
            return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <LocationPickerBubble
                    label={inputConf.label}
                    value={formData.gigLocation}
                    onChange={val => handleInputChange('gigLocation', val)}
                    showConfirm={!!formData.gigLocation && isActive}
                    onConfirm={() => handleInputSubmit(step.id, 'gigLocation')}
                  />
                </div>
              );
            }
            // Custom UI for gigDate (calendar picker)
            if (inputConf.name === "gigDate") {
              const isActive = isActiveInputStep(step, idx);
              return (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <CalendarPickerBubble
                    value={formData.gigDate ? new Date(formData.gigDate) : null}
                    onChange={date => handleInputChange('gigDate', date ? date.toISOString() : "")}
                  />
                  {isActive && formData.gigDate && (
                    <button
                      style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                      onClick={() => handleInputSubmit(step.id, 'gigDate')}
                    >
                      Confirm
                    </button>
                  )}
                </div>
              );
            }
            // Only allow supported types for InputBubble
            const allowedTypes = ["number", "text", "email", "password", "date", "tel"];
            const safeType = allowedTypes.includes(inputConf.type) ? inputConf.type : "text";
            const isActive = isActiveInputStep(step, idx);
              return (
              <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <InputBubble
                  id={inputConf.name}
                  name={inputConf.name}
                  label={inputConf.label}
                  value={formData[inputConf.name] || ""}
                  disabled={isSubmitting}
                  type={safeType as "number" | "text" | "email" | "password" | "date" | "tel"}
                  placeholder={inputConf.placeholder}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    handleInputChange(inputConf.name, e.target.value)
                  }
                  onFocus={() => setCurrentFocusedInputName(inputConf.name)}
                  onBlur={() => {}}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleInputSubmit(step.id, inputConf.name);
                    }
                  }}
                  ref={(el: HTMLInputElement | null) => {
                    if (el && currentFocusedInputName === inputConf.name) el.focus();
                  }}
                />
                {isActive && formData[inputConf.name] && (
                  <button
                    style={{ margin: '8px 0', background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                    onClick={() => handleInputSubmit(step.id, inputConf.name)}
                  >
                    Confirm
                  </button>
                )}
              </div>
            );
          }
          // Typing animation
          if (isTyping && idx === chatSteps.length - 1) {
            return <MessageBubble key={key + '-typing'} text={<TypingIndicator />} senderType="bot" />;
          }
          // Handle the new sanitized step type
          if (step.type === "sanitized" && step.fieldName) {
            return (
              <div key={key} style={{ background: '#f5f5f5', borderRadius: 8, padding: 16, margin: '16px 0', boxShadow: '0 2px 8px #0001' }}>
                <div style={{ marginBottom: 8, color: '#0f766e', fontWeight: 600 }}>This is what you wanted?</div>
                <div style={{ marginBottom: 12, fontStyle: 'italic' }}>{step.sanitizedValue}</div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    style={{ background: '#0f766e', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                    onClick={() => handleSanitizedConfirm(step.fieldName!, step.sanitizedValue!)}
                  >
                    Confirm
                  </button>
                  <button
                    style={{ background: '#fff', color: '#0f766e', border: '1px solid #0f766e', borderRadius: 8, padding: '6px 16px', fontWeight: 600 }}
                    onClick={() => handleSanitizedReformulate(step.fieldName!)}
                  >
                    Reformulate
                  </button>
                </div>
              </div>
            );
          }
          return null;
        })}
        <div ref={endOfChatRef} />
        {isSubmitting && (
          <MessageBubble
            key="submitting-msg"
            text="Processing..."
            senderType="bot"
          />
        )}
      </ChatBotLayout>
    </>
  );
}
