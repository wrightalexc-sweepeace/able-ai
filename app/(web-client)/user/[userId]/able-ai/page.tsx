// app/user/[userId]/able-ai/page.tsx
'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Loader from '@/app/components/shared/Loader';
import { useAuth } from '@/context/AuthContext';

interface SuggestedAction {
  text: string;
  linkKey?: string;
}

interface Suggestion {
  id: string; // Now mandatory
  title: string;
  description: string;
  suggestedActions?: SuggestedAction[];
}

export default function AIChatPage({ params }: { params: { userId: string } }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const linkKeyRoutes: { [key: string]: string } = {
    PROFILE_EDIT: `/user/${params.userId}/profile/edit`, // Example: Navigate to profile edit page
    VIEW_OFFERS: `/user/${params.userId}/offers`, // Example: Navigate to offers page (could be worker or buyer specific)
    POST_GIG: `/user/${params.userId}/gigs/new`, // Example: Navigate to new gig posting page
    BROWSE_GIGS: `/user/${params.userId}/gigs/browse`, // Example: Navigate to gig browsing page
    // Add other linkKeys from your AI agent's prompt as needed
    // e.g., LEARN_SKILL_PHOTOGRAPHY: `/learn/photography` (if not user-specific)
  };
  const searchParams = useSearchParams();
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);

  const authUserId = user?.uid;
  const pageUserId = params.userId;

  useEffect(() => {
    if (!loading) {
      if (user) {
        if (authUserId !== pageUserId) {
          router.replace("/signin");
          return;
        }
      } else {
        router.replace("/signin");
      }
    }
  }, [user, loading, authUserId, pageUserId, pathname, router]);

  useEffect(() => {
    // Try to get suggestion from URL first
    const suggestionParam = searchParams.get('suggestion');
    
    if (suggestionParam) {
      try {
        const savedSuggestion = localStorage.getItem('lastAISuggestion');
        if (savedSuggestion) {
            try {
            setSuggestion(JSON.parse(savedSuggestion));
            } catch (e) {
            console.error('Failed to parse saved suggestion:', e);
            }
        } else {
            const decodedSuggestion = JSON.parse(decodeURIComponent(suggestionParam));
            setSuggestion(decodedSuggestion);
        }
      } catch (e) {
        console.error('Failed to parse suggestion:', e);
      }
    } else {
      // If no URL param, try to get from localStorage
      const savedSuggestion = localStorage.getItem('lastAISuggestion');
      if (savedSuggestion) {
        try {
          setSuggestion(JSON.parse(savedSuggestion));
        } catch (e) {
          console.error('Failed to parse saved suggestion:', e);
        }
      }
    }
  }, [searchParams]);

  const handleActionClick = (action: SuggestedAction) => {
    if (action.linkKey) {
      const route = linkKeyRoutes[action.linkKey];
      if (route) {
        console.log(`Navigating to: ${route} for linkKey: ${action.linkKey}`);
        router.push(route);
      } else {
        console.warn(`Unknown linkKey: ${action.linkKey}. No route defined.`);
        alert(`Action: '${action.text}' - This suggested navigation path ('${action.linkKey}') is not configured yet.`);
      }
    } else {
      // TODO: Implement sending action.text to chat input
      console.log(`Action text for chat: ${action.text}`);
      alert(`Action: Send '${action.text}' to chat. Chat input to be implemented.`);
    }
  };

  if (loading || !user || (authUserId && authUserId !== pageUserId)) {
    return <Loader />;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">AI Assistant</h1>
      
      {suggestion ? (
        <div className="bg-gray-800 p-4 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-2">{suggestion.title}</h2>
          <p className="text-gray-300">{suggestion.description}</p>
          {suggestion.suggestedActions && suggestion.suggestedActions.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-700">
              <h3 className="text-md font-semibold mb-2 text-gray-400">Suggested Actions:</h3>
              <div className="flex flex-wrap gap-2">
                {suggestion.suggestedActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => handleActionClick(action)}
                    className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-3 rounded-md text-sm transition-colors duration-150 ease-in-out"
                  >
                    {action.text}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <p>No active suggestion. Start a new conversation with the AI.</p>
      )}
      
      {/* Add your chat interface here */}
      <div className="mt-6">
        <p>AI Chat Interface will be implemented here.</p>
      </div>
    </div>
  );
}
