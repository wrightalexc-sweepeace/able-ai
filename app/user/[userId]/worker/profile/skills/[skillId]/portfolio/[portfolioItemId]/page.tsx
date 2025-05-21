/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// useAppContext is likely needed here to check if the user is authorized
import { useAppContext } from '@/app/hooks/useAppContext';

// --- SHARED & HELPER COMPONENTS ---
import PageCloseButton from '@/app/components/shared/PageCloseButton';
import ContentCard from '@/app/components/shared/ContentCard';
import InputField from '@/app/components/form/InputField';
import SubmitButton from '@/app/components/form/SubmitButton';

import {
    Loader2,
    Save,
} from 'lucide-react';
import styles from './EditablePortfolioItemPage.module.css'; // Renamed CSS module for clarity

// --- INTERFACES ---
interface PortfolioMediaForm {
  id?: string; // Will be undefined for new items
  type: 'image' | 'video';
  thumbnailUrl: string;
  fullUrl?: string;
  caption?: string;
}

// --- MOCK FUNCTION (for fetching existing item data) ---
async function fetchPortfolioItem(workerId: string, skillId: string, itemId: string): Promise<PortfolioMediaForm | null> {
    console.log(`Fetching portfolio item: ${itemId} for worker: ${workerId}, skill: ${skillId}`);
    await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay

    // --- MOCK DATA ---
    if (itemId === "p1" && workerId === "benji-asamoah-id" && skillId === "bartender-skill-id") {
        return {
            id: "p1",
            type: 'image',
            thumbnailUrl: "/images/mock-portfolio-1.jpg",
            fullUrl: "/images/mock-portfolio-1-full.jpg",
            caption: "Mixing drinks at a wedding",
        };
    }
    if (itemId === "p3" && workerId === "benji-asamoah-id" && skillId === "bartender-skill-id") {
        return {
            id: "p3",
            type: 'video',
            thumbnailUrl: "/images/mock-video-thumb.jpg",
            fullUrl: "https://www.youtube.com/watch?v=mockvideo", // Example video URL
            caption: "Flair bartending demo",
        };
    }

    // Return null if item not found or for 'new'
    return null;
}

// --- COMPONENT ---
export default function EditablePortfolioItemPage() {
  const router = useRouter();
  const params = useParams();
  const workerId = params.userId as string; // Assuming userId from URL is the workerId
  const skillId = params.skillId as string;
  const portfolioItemId = params.portfolioItemId as string; // 'new' or item ID

  const { user: authUser, isLoading: loadingAuth } = useAppContext();
  
  const [formData, setFormData] = useState<PortfolioMediaForm>({ 
      type: 'image', // Default type
      thumbnailUrl: '',
      fullUrl: '',
      caption: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isNewItem = portfolioItemId === 'new';

  useEffect(() => {
    // Check if user is authenticated and authorized
    if (!loadingAuth && (!authUser || authUser.uid !== workerId)) {
        setError("You are not authorized.");
        setIsLoading(false);
        return;
    }

    if (!isNewItem && workerId && skillId && portfolioItemId) {
      setIsLoading(true);
      fetchPortfolioItem(workerId, skillId, portfolioItemId)
        .then(data => {
          if (data) {
            setFormData(data);
          } else {
             setError("Portfolio item not found.");
          }
        })
        .catch(err => {
          console.error("Error loading portfolio item:", err);
          setError("Could not load portfolio item.");
        })
        .finally(() => setIsLoading(false));
    } else {
      // For new items, stop loading immediately with default formData
      setIsLoading(false);
    }
  }, [workerId, skillId, portfolioItemId, isNewItem, loadingAuth, authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setFormData({ ...formData, type: e.target.value as 'image' | 'video' });
  };

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);
    setError(null); // Clear previous errors
    console.log("Saving portfolio item data:", formData);

    // TODO: Implement actual API call to save/create item
    try {
        if (isNewItem) {
            // await createPortfolioItemAPI(workerId, skillId, formData);
            console.log("Simulating create...");
        } else {
            // await updatePortfolioItemAPI(workerId, skillId, portfolioItemId, formData);
            console.log("Simulating update...");
        }
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate save delay
        console.log("Save successful!");
        // TODO: Navigate back to the editable skill page after save
        router.back();

    } catch (err) {
        console.error("Error saving portfolio item:", err);
        setError("Failed to save portfolio item.");
    } finally {
        setIsSaving(false);
    }
  };

  if (loadingAuth || isLoading) {
    return <div className={styles.pageLoadingContainer}><Loader2 className="animate-spin" size={48} /> Loading Item...</div>;
  }
  if (error) {
    return <div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div>;
  }
  // Double-check auth after loading, though initial check should cover most cases
   if (!authUser || authUser.uid !== workerId) {
      return <div className={styles.pageWrapper}><p className={styles.errorMessage}>You are not authorized.</p></div>;
   }

  return (
    <div className={styles.pageContainer}>
      
      {/* Close button */}
      <PageCloseButton onClick={() => router.back()} />

      <h1 className={styles.pageTitle}>{isNewItem ? 'Add New Portfolio Item' : 'Edit Portfolio Item'}</h1>

      <ContentCard title="Item Details">
        {/* Type Selector */}
        <div className={styles.formField}>
          <label htmlFor="itemType" className={styles.formLabel}>Item Type</label>
          <select id="itemType" name="type" value={formData.type} onChange={handleTypeChange} className={styles.selectField}>
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>

        {/* Thumbnail URL */}
         <InputField 
          label="Thumbnail URL"
          id="thumbnailUrl"
          name="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={handleInputChange}
          placeholder="e.g., /images/my-image-thumb.jpg or a direct URL"
        />

        {/* Full Media URL (Conditional based on type) */}
        <InputField 
          label={formData.type === 'image' ? "Full Image URL (Optional)" : "Video URL"}
          id="fullUrl"
          name="fullUrl"
          value={formData.fullUrl || ''}
          onChange={handleInputChange}
          placeholder={formData.type === 'image' ? "e.g., /images/my-image-full.jpg" : "e.g., https://www.youtube.com/watch?v=...'"}
        />
        {formData.type === 'video' && (
            <p className={styles.hintText}>Currently only supports public YouTube or Vimeo links.</p>
        )}

        {/* Caption */}
        <InputField 
          label="Caption (Optional)"
          id="caption"
          name="caption"
          value={formData.caption || ''}
          onChange={handleInputChange}
          placeholder="e.g., Mixing drinks at a wedding"
        />

         {/* TODO: Add actual file upload input */}

      </ContentCard>

      {/* Save Button */}
      <div className={styles.saveButtonContainer}>
          <SubmitButton onClick={handleSave} disabled={isSaving}>
              <Save size={20} /> {isSaving ? 'Saving...' : isNewItem ? 'Create Item' : 'Save Changes'}
          </SubmitButton>
      </div>

    </div> 
  );
} 