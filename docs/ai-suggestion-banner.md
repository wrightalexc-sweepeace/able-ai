# AI Suggestion Banner Integration Plan

## Overview
The AiSuggestionBanner will use an AI model (e.g., Gemini) to generate contextual suggestions for users based on their public profile, calendar, and business data.

## Roles & Target Pages
- **Worker:** `app/user/[userId]/worker/page.tsx`
- **Buyer:** `app/user/[userId]/buyer/page.tsx`

## Data Available to the AI Agent

### For Both Roles (from `userPublicProfile`):
- `uid` (not for display, only for context)
- `appRole`, `lastRoleUsed`, `isBuyerMode`, `isWorkerMode`
- `canBeBuyer`, `canBeGigWorker`
- `lastViewVisitedBuyer`, `lastViewVisitedWorker`
- (Optionally) `displayName`, `email`, `photoURL` (**do not use in suggestions for privacy**)

### For Worker:
- Profile completion status (inferred from profile/gigfolio)
- Skills, experience, gigfolio data (from profile page)
- Calendar/availability (if available)
- Recent gig activity (if available)
- Upcoming offers or shifts (if available)

### For Buyer:
- Recent hiring activity
- Number of available workers nearby (from platform data)
- Calendar (upcoming gigs)
- Payments history (summary, not details)
- Referral status

## PII & Privacy
- **Do not include:** user name, email, address, or any direct identifiers in suggestions.
- **OK to include:** aggregate stats, generic location context (e.g., "in your area"), role-based tips, platform trends.

## Prompt Examples

### Worker Example
```
You are an AI assistant for gig workers. Given the user's profile, skills, and recent activity (but no PII), suggest 1-3 actionable tips to help them get more gigs or improve their profile. Suggestions should be concise, impersonal, and privacy-safe.

Context:
- Profile completion: 80%
- Skills: Bartending, Waiter
- Availability: Next Tuesday open
- Recent activity: No gigs accepted in last 2 weeks

Return a JSON array of suggestions, each with a 'title' and 'description'.
```

### Buyer Example
```
You are an AI assistant for buyers. Given the user's recent hiring activity and platform trends (but no PII), suggest 1-3 ways to find great workers or manage gigs more efficiently. Suggestions should be concise, impersonal, and privacy-safe.

Context:
- Last gig posted: 3 weeks ago
- 10 new bartenders joined within 5 miles
- No upcoming gigs scheduled

Return a JSON array of suggestions, each with a 'title' and 'description'.
```

## Expected Output Schema
```json
[
  { "title": "Update Your Availability", "description": "Add more available dates to increase your chances of getting gigs." },
  { "title": "Complete Your Profile", "description": "Profiles with more details get 2x more offers." }
]
```

## Gemini Library Integration Example
```ts
import { getAI, getGenerativeModel, Schema } from "@firebase/ai";

const ai = getAI(firebaseApp, { backend: new GoogleAIBackend() });

const suggestionSchema = Schema.array(
  Schema.object({
    title: Schema.string(),
    description: Schema.string(),
  })
);

const model = getGenerativeModel(ai, {
  model: "gemini-2.5-flash-preview-05-20",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: suggestionSchema,
  },
});

const prompt = `You are an AI assistant for [worker|buyer]. Given the following context, suggest 1-3 actionable, privacy-safe tips. Return a JSON array of suggestions, each with a title and description.\n\nContext: ${JSON.stringify(context)}`;

const result = await model.generateContent(prompt);
console.log(result.response.text());
```

## Quick Test Prompt for Chat UI
```
SYSTEM: You are an AI assistant for [worker|buyer]. Given the user's context (no PII), suggest 1-3 actionable, privacy-safe tips as a JSON array.
USER: {context here}
```

## Future Extensibility
- Add more context (e.g., platform trends, seasonal demand).
- Personalize suggestions based on engagement (e.g., "You haven't posted a gig in a while").
- Support multi-language output.
- Integrate with notification system for timely suggestions.

## Integration Plan for `app/user/[userId]/worker/page.tsx` and `app/user/[userId]/buyer/page.tsx`
1. **Export the AI Instance**
   - In `app/lib/firebase/clientApp.ts`, export the `ai` instance.

2. **Create the Agent File**
   - In `app/lib/agents/`, create `suggestionBannerAgent.ts`.

3. **Implement the Agent Function**
   - Import `ai`, define the model and schema as above, and export a function (e.g., `generateSuggestions`).

4. **Use the Agent in the Page**
   - In the dashboard page, import and use the agent function:
     ```ts
     import { generateSuggestions } from "@/app/lib/agents/suggestionBannerAgent";
     // ...
     const suggestions = await generateSuggestions(context);
     // Use suggestions[0].description for the AiSuggestionBanner message
     ```

5. **Extend as Needed**
   - Add support for more context fields, richer suggestions, or multi-turn interactions as your product evolves. 