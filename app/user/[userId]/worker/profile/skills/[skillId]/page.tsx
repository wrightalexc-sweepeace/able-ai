/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
// useAppContext is likely needed here to check if the user is authorized to edit this profile
import { useAppContext } from '@/app/hooks/useAppContext';

// --- SHARED & HELPER COMPONENTS ---
import PageCloseButton from '@/app/components/shared/PageCloseButton';
import ContentCard from '@/app/components/shared/ContentCard';
import TitledItemListCard from '@/app/components/shared/TitledItemListCard';
import ReviewCardItem from '@/app/components/shared/ReviewCardItem';
import RecommendationCardItem from '@/app/components/shared/RecommendationCardItem';
import EditableList from '@/app/components/shared/EditableList';
// Need form components
import InputField from '@/app/components/form/InputField';
import SubmitButton from '@/app/components/form/SubmitButton';
// Import editable list item components
import PortfolioEditableItem from '@/app/components/skills/editable/PortfolioEditableItem';
import BadgeEditableItem from '@/app/components/skills/editable/BadgeEditableItem';
import QualificationEditableItem from '@/app/components/skills/editable/QualificationEditableItem';

import { 
    Loader2, 
    Save, // For save button icon
} from 'lucide-react';
import styles from './EditableSkillPage.module.css';

// --- INTERFACES (Adapted for editing) ---
// Reusing PortfolioMedia and SkillSpecificBadge interfaces
interface PortfolioMedia {
  id: string;
  type: 'image' | 'video';
  thumbnailUrl: string;
  fullUrl?: string; // For lightbox or separate page
  caption?: string;
}

interface SkillSpecificBadge {
  id: string;
  name: string;
  icon: React.ElementType; // Lucide icon or custom SVG
}

interface EditableSkillProfile {
  workerId: string;
  skillId: string;
  skillName: string; // e.g., "Bartender"
  skillDescription?: string; // A detailed description of the skill service
  
  // Skill-specific editable stats
  skillExperience?: string; // e.g., "8 years"
  skillEph?: number | string; // Hourly rate for this skill

  skillPortfolio: PortfolioMedia[]; // Portfolio items linked to this skill
  
  skillRelevantBadges: SkillSpecificBadge[]; // Badges linked to this skill
  
  skillRelevantQualifications: string[]; // Qualifications linked to this skill
  
  // Could add other editable fields like:
  // skillSpecificFAQ?: { question: string, answer: string }[];
  // skillSpecificNotes?: string;
}

// --- MOCK FUNCTION (for fetching editable data) ---
async function fetchEditableSkillProfile(workerId: string, skillId: string): Promise<EditableSkillProfile | null> {
    console.log(`Fetching editable profile for worker: ${workerId}, skill: ${skillId}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

    // --- MOCK DATA (Editable version) ---
    if (workerId === "benji-asamoah-id" && skillId === "bartender-skill-id") {
        return {
            workerId: "benji-asamoah-id",
            skillId: "bartender-skill-id",
            skillName: "Bartender",
            skillDescription: "I am an expert mixologist with 3 years of experience crafting unique cocktails for private events and parties. I specialize in creating custom drink menus and providing a high-energy bartending experience.",
            skillExperience: "3 years",
            skillEph: 25,
            skillPortfolio: [
                { id: "p1", type: 'image', thumbnailUrl: "/images/mock-portfolio-1.jpg", caption: "Mixing drinks at a wedding" },
                { id: "p2", type: 'image', thumbnailUrl: "/images/mock-portfolio-2.jpg", caption: "Bar setup for a corporate event" },
                { id: "p3", type: 'video', thumbnailUrl: "/images/mock-video-thumb.jpg", caption: "Flair bartending demo" },
            ],
            skillRelevantBadges: [
                { id: "b1", name: "Always on time", icon: Save }, // Using Save icon as example for badge icon
            ],
            skillRelevantQualifications: [
                "Licensed bar manager (Level 2)",
                "Certified Mixologist",
            ],
        };
    }
    // Return null for other IDs or if the user is not authorized
    return null;
}

// --- COMPONENT ---
export default function EditableSkillProfilePage() {
  const router = useRouter();
  const params = useParams();
  const workerIdToEdit = params.userId as string; // Assuming userId from URL is the workerId
  const skillIdToEdit = params.skillId as string;

  const { user: authUser, isLoading: loadingAuth } = useAppContext();
  
  const [editableSkillProfile, setEditableSkillProfile] = useState<EditableSkillProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  // State to hold form data (could be more granular)
  const [formData, setFormData] = useState<Partial<EditableSkillProfile>>({});

  useEffect(() => {
    // Check if user is authenticated and authorized to edit this profile
    if (!loadingAuth && (!authUser || authUser.uid !== workerIdToEdit)) {
        setError("You are not authorized to view/edit this profile.");
        setIsLoadingProfile(false);
        return;
    }

    if (workerIdToEdit && skillIdToEdit) {
      setIsLoadingProfile(true);
      fetchEditableSkillProfile(workerIdToEdit, skillIdToEdit)
        .then(data => {
          if (data) {
            setEditableSkillProfile(data);
            setFormData(data); // Initialize form data with fetched data
          }
          else setError("Skill profile not found or you are not authorized.");
        })
        .catch(err => {
          console.error("Error loading editable skill profile:", err);
          setError("Could not load skill profile for editing.");
        })
        .finally(() => setIsLoadingProfile(false));
    } else {
      setError("Worker ID or Skill ID missing.");
      setIsLoadingProfile(false);
    }
  }, [workerIdToEdit, skillIdToEdit, loadingAuth, authUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSave = async () => {
    if (!editableSkillProfile || isSaving) return;

    setIsSaving(true);
    setError(null); // Clear previous errors
    console.log("Saving skill profile data:", formData);

    // TODO: Implement actual API call to save data
    try {
        // await saveEditableSkillProfileAPI(editableSkillProfile.workerId, editableSkillProfile.skillId, formData);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate save delay
        console.log("Save successful!");
        // Optionally refetch data or show success message
    } catch (err) {
        console.error("Error saving skill profile:", err);
        setError("Failed to save skill profile.");
    } finally {
        setIsSaving(false);
    }
  };
  
  // TODO: Implement handlers for adding/removing portfolio items, qualifications, badges

  const handleRemovePortfolioItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      skillPortfolio: prev.skillPortfolio?.filter(item => item.id !== itemId) || [],
    }));
  };

  const handleRemoveBadge = (badgeId: string) => {
    setFormData(prev => ({
      ...prev,
      skillRelevantBadges: prev.skillRelevantBadges?.filter(badge => badge.id !== badgeId) || [],
    }));
  };

  const handleRemoveQualification = (index: number) => {
     setFormData(prev => ({
       ...prev,
       skillRelevantQualifications: prev.skillRelevantQualifications?.filter((_, i) => i !== index) || [],
     }));
  };

  // Placeholder add handlers (will likely open modals/forms)
  const handleAddPortfolioItem = () => {
    if (workerIdToEdit && skillIdToEdit) {
      // Navigate to the new portfolio item creation page
      router.push(`/user/${workerIdToEdit}/worker/profile/skills/${skillIdToEdit}/portfolio/new`);
    } else {
      console.error("Missing workerId or skillId for adding portfolio item.");
    }
  };
  const handleAddBadge = () => { alert("Add Badge functionality here"); };
  const handleAddQualification = () => { alert("Add Qualification functionality here"); };

  if (loadingAuth || isLoadingProfile) {
    return <div className={styles.pageLoadingContainer}><Loader2 className="animate-spin" size={48} /> Loading Profile Editor...</div>;
  }
  if (error) {
    return <div className={styles.pageWrapper}><p className={styles.errorMessage}>{error}</p></div>;
  }
  if (!editableSkillProfile || !authUser || authUser.uid !== workerIdToEdit) {
     // This case should ideally be covered by the initial auth check, but good as a fallback
     return <div className={styles.pageWrapper}><p className={styles.errorMessage}>You are not authorized to view/edit this profile.</p></div>;
  }

  return (
    <div className={styles.editableSkillPageContainer}>
      
      {/* Close button */}
      <PageCloseButton onClick={() => router.back()} />

      <h1 className={styles.pageTitle}>Edit Skill: {editableSkillProfile.skillName}</h1>

      {/* Skill Details Section */}
      <ContentCard title="Skill Details">
        {/* TODO: Add InputField for skill name if editable */}
        <InputField 
          label="Hourly Rate (£)"
          id="skillEph"
          name="skillEph"
          value={formData.skillEph !== undefined ? String(formData.skillEph) : ''}
          onChange={handleInputChange}
          type="number"
          placeholder="e.g., 25"
        />
        <InputField 
          label="Experience (e.g., 3 years)"
          id="skillExperience"
          name="skillExperience"
          value={formData.skillExperience || ''}
          onChange={handleInputChange}
          placeholder="e.g., 3 years"
        />
        {/* Use textarea for description */}
        <div className={styles.formField}>
            <label htmlFor="skillDescription" className={styles.formLabel}>Skill Description</label>
            <textarea 
                id="skillDescription"
                name="skillDescription"
                value={formData.skillDescription || ''}
                onChange={handleInputChange}
                className={styles.textareaField}
                rows={6}
                placeholder="Provide a detailed description of your service for this skill..."
            />
        </div>

        {/* TODO: Add editable list/tags for hashtags */}

      </ContentCard>

      {/* Portfolio Management Section */}
      <ContentCard title="Portfolio Items">
        <EditableList
          title=""
          items={editableSkillProfile.skillPortfolio}
          renderItem={(item: PortfolioMedia) => (
            <PortfolioEditableItem 
              key={item.id} 
              item={item} 
              onRemove={handleRemovePortfolioItem} 
              onEdit={(itemToEdit) => {
                if (workerIdToEdit && skillIdToEdit && itemToEdit.id) {
                   router.push(`/user/${workerIdToEdit}/worker/profile/skills/${skillIdToEdit}/portfolio/${itemToEdit.id}`);
                } else {
                   console.error("Missing required info to edit portfolio item.");
                }
              }}
            />
          )}
          onAddItem={handleAddPortfolioItem}
          addLabel="Add Portfolio Item"
        />
      </ContentCard>

       {/* Badges Management Section */}
       <ContentCard title="Relevant Badges">
         <EditableList
           title=""
           items={editableSkillProfile.skillRelevantBadges}
           renderItem={(badge: SkillSpecificBadge) => (
             <BadgeEditableItem 
               key={badge.id} 
               badge={badge} 
               onUnlink={handleRemoveBadge} // Using remove handler for unlinking
             />
           )}
           onAddItem={handleAddBadge}
           addLabel="Link Existing Badge"
         />
       </ContentCard>

      {/* Qualifications Management Section */}
      <ContentCard title="Relevant Qualifications">
        <EditableList
          title=""
          items={editableSkillProfile.skillRelevantQualifications}
          renderItem={(qualification: string, index: number) => (
            <QualificationEditableItem 
              key={index} 
              qualification={qualification} 
              index={index}
              onRemove={handleRemoveQualification} 
            />
          )}
          onAddItem={handleAddQualification}
          addLabel="Add Qualification"
        />
      </ContentCard>

      {/* Save Button */}
      <div className={styles.saveButtonContainer}>
          <SubmitButton onClick={handleSave} disabled={isSaving}>
              <Save size={20} /> {isSaving ? 'Saving...' : 'Save Changes'}
          </SubmitButton>
      </div>

    </div> 
  );
} 