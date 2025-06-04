# Gemini AI Agent Utility (`geminiAIAgent`) — Developer Guide

## Overview

The `geminiAIAgent` function is a robust, reusable utility for interacting with Google Gemini models via the Firebase AI SDK. It standardizes model selection, error handling, retries, and fallback logic, ensuring a reliable and user-friendly AI experience across the Able AI platform.

---

## Purpose
- Provide a single, consistent interface for all Gemini AI calls in the app.
- Handle model selection, retries, and fallback models automatically.
- Support both standard and streaming responses (where available).
- Return results in a `{ ok, data, error }` pattern for easy UI integration.

---

## API

### Function Signature
```ts
async function geminiAIAgent<T>(
  modelName: string,
  aiOptions: GeminiAIOptions,
  fallbackModelName?: string,
  retries = 3
): Promise<GeminiAIResult<T>>
```

### Options
```ts
type GeminiAIOptions = {
  prompt: string;
  responseSchema: any; // Schema object from @firebase/ai
  isStream?: boolean; // If true, use streaming API (if available)
  generationConfig?: Record<string, any>; // Passed to model
  // ...extend as needed
};

type GeminiAIResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };
```

---

## Supported Models
- "gemini-2.5-flash-preview-05-20"
- "gemini-2.0-flash"
- (Add more as needed)

---

## Error Handling, Retry, and Fallback
- If the model is not supported, return `{ ok: false, error }` immediately.
- On error (e.g., model busy, token limit, network), retry up to `retries` times.
- If a fallback model is provided and the error is model-specific, try the fallback model.
- After all retries/fallbacks fail, return a default error message: `"Sorry, I cannot answer this time. Please retry or report this issue."`
- All errors are logged for observability.

---

## Streaming Support
- If `isStream` is true, use the streaming API (if available in the SDK).
- Otherwise, use `generateContent` as in the Firebase AI documentation.
- (Stub or extend as SDK evolves)

---

## Usage Example

### Basic Usage
```ts
import { geminiAIAgent } from "@/app/lib/firebase/ai";
import { Schema } from "@firebase/ai";

const mySchema = Schema.object({
  answer: Schema.string(),
});

const result = await geminiAIAgent(
  "gemini-2.5-flash-preview-05-20",
  {
    prompt: "What is the capital of France?",
    responseSchema: mySchema,
    isStream: false,
    generationConfig: { responseMimeType: "application/json" },
  },
  "gemini-2.0-flash"
);

if (result.ok) {
  // Use result.data
  console.log(result.data.answer);
} else {
  // Show error message
  alert(result.error);
}
```

### With Streaming (if supported)
```ts
const result = await geminiAIAgent(
  "gemini-2.5-flash-preview-05-20",
  {
    prompt,
    responseSchema: mySchema,
    isStream: true,
    generationConfig: { responseMimeType: "application/json" },
  }
);
// Handle streaming result (see implementation)
```

---

## Implementation Notes
- Place the function in `app/lib/firebase/ai.ts`.
- Import the shared `ai` instance from `clientApp.ts`.
- Use `getGenerativeModel` and `Schema` from `@firebase/ai`.
- Extend the function as the SDK and platform needs evolve.

---

## Example Integration (from docs)
```ts
const model = getGenerativeModel(ai, {
  model: "gemini-2.0-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: gigStepSchema,
  },
});
const result = await model.generateContent(prompt);
return result.response.text();
```

With `geminiAIAgent`, this logic is wrapped and enhanced for reliability and fallback.

---

## Best Practices
- Always validate the returned data against your schema.
- Use the fallback model for critical user flows.
- Log errors for monitoring and debugging.
- Update the supported models list as new Gemini versions are released.

---

## Future Extensibility
- Add richer streaming support as the SDK evolves.
- Support for multi-turn conversations and context.
- Integrate analytics for error/fallback tracking.
- Add hooks for custom error handling or logging. 