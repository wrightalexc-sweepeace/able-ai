import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { saveWorkerProfileFromOnboardingAction, getPrivateWorkerProfileAction } from '@/actions/user/gig-worker-profile';
import { useAuth } from '@/context/AuthContext';
import { VALIDATION_CONSTANTS } from '@/app/constants/validation';
import styles from './ManualProfileForm.module.css';
import LocationPickerBubble from './LocationPickerBubble';
import VideoRecorderOnboarding from './VideoRecorderOnboarding';
import { ref, uploadBytesResumable, getDownloadURL, getStorage } from "firebase/storage";
import { firebaseApp } from "@/lib/firebase/clientApp";
import { geminiAIAgent } from '@/lib/firebase/ai';
import { getAI } from '@firebase/ai';
import { Schema } from '@firebase/ai';

// Helper: generate a compact random code and build a recommendation URL
function generateRandomCode(length = 8): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Avoid ambiguous chars
  let result = "";
  const array = new Uint32Array(length);
  if (typeof window !== 'undefined' && window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += alphabet[array[i] % alphabet.length];
    }
  } else {
    for (let i = 0; i < length; i++) {
      result += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
  }
  return result;
}

function buildRecommendationLink(workerProfileId: string | null): string {
  const origin = typeof window !== 'undefined' && window.location?.origin ? window.location.origin : 'http://localhost:3000';
  
  if (!workerProfileId) {
    throw new Error('Worker profile ID is required to build recommendation link');
  }
  
  // Use the worker profile ID (UUID) for the recommendation URL
  return `${origin}/worker/${workerProfileId}/recommendation`;
}

interface FormData {
  about: string;
  experience: string;
  skills: string;
  qualifications: string; // Add qualifications field
  equipment: string;
  hourlyRate: number;
  location: any; // Changed to any for LocationPickerBubble
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
    frequency?: string;
    ends?: string;
    startDate?: string;
    endDate?: string;
    occurrences?: number;
  };
  videoIntro: string | null;
  references: string;
  jobTitle?: string; // AI extracted job title
}

interface ManualProfileFormProps {
  onSubmit: (formData: FormData) => void;
  onSwitchToAI: () => void;
  initialData?: Partial<FormData>;
  workerProfileId?: string | null;
}

// Export validation function for external use (basic validation only)
export const validateWorkerProfileData = (formData: FormData): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  let isValid = true;

  // Only validate about, experience, skills, and equipment
  const fieldsToValidate = ['about', 'experience', 'skills', 'equipment'];
  
  fieldsToValidate.forEach(fieldName => {
    const value = formData[fieldName as keyof FormData];
    
    switch (fieldName) {
      case 'about':
        if (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH) {
          errors.about = `About section must be at least ${VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH} characters`;
          isValid = false;
        }
        break;
      case 'experience':
        if (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_EXPERIENCE_LENGTH) {
          errors.experience = `Experience section must be at least ${VALIDATION_CONSTANTS.WORKER.MIN_EXPERIENCE_LENGTH} characters`;
          isValid = false;
        }
        break;
      case 'skills':
        if (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH) {
          errors.skills = `Skills section must be at least ${VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH} characters`;
          isValid = false;
        }
        break;
      case 'equipment':
        if (!value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_EQUIPMENT_LENGTH) {
          errors.equipment = `Equipment section must be at least ${VALIDATION_CONSTANTS.WORKER.MIN_EQUIPMENT_LENGTH} characters`;
          isValid = false;
        }
        break;
    }
  });

  return { isValid, errors };
};

// Export AI content validation function for external use
export const validateContentWithAI = async (field: string, value: string): Promise<{ isValid: boolean; error?: string; sanitized?: string }> => {
  if (!value || value.trim().length === 0) {
    return { isValid: true, sanitized: value };
  }

  try {
    const ai = getAI();
    if (!ai) {
      console.log('AI not available, skipping content validation');
      return { isValid: true, sanitized: value };
    }

    let prompt = '';
    let schema: any;

    if (field === 'about') {
      prompt = `Validate this worker's self-description. Check if it's professional and relevant for gig work. Reject if it contains:
      - Personal names of celebrities, athletes, or fictional characters
      - Jokes, memes, or inappropriate content
      - Non-professional information
      - Gibberish or random text
      
      If valid, return the cleaned version. If invalid, explain why it's inappropriate.
      
      Description: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else if (field === 'skills') {
      prompt = `Validate this skills list. Check if it contains only professional skills relevant to gig work. Reject if it contains:
      - Personal names of celebrities, athletes, or fictional characters
      - Jokes, memes, or inappropriate content
      - Non-professional skills
      - Random text or gibberish
      
      If valid, return the cleaned list. If invalid, explain why it's inappropriate.
      
      Skills: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else if (field === 'experience') {
      prompt = `Validate this experience description. Check if it's professional and relevant. Reject if it contains:
      - Personal names of celebrities, athletes, or fictional characters
      - Jokes, memes, or inappropriate content
      - Non-professional information
      - Gibberish or random text
      
      If valid, return the cleaned version. If invalid, explain why it's inappropriate.
      
      Experience: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else if (field === 'equipment') {
      prompt = `Validate this equipment list. Check if it contains only professional equipment relevant to gig work. Reject if it contains:
      - Personal names of celebrities, athletes, or fictional characters
      - Jokes, memes, or inappropriate content
      - Non-professional items
      - Random text or gibberish
      
      If valid, return the cleaned list. If invalid, explain why it's inappropriate.
      
      Equipment: "${value}"`;
      
      schema = Schema.object({
        properties: {
          isValid: Schema.boolean(),
          reason: Schema.string(),
          sanitized: Schema.string()
        },
        required: ["isValid", "reason", "sanitized"]
      });
    } else {
      return { isValid: true, sanitized: value };
    }

    const result = await geminiAIAgent(
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
      { prompt, responseSchema: schema },
      ai,
      VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
    );

    if (result.ok) {
      const data = result.data as any;
      return {
        isValid: data.isValid,
        error: data.isValid ? undefined : data.reason,
        sanitized: data.sanitized || value
      };
    } else {
      console.error('AI content validation failed:', result);
      return { isValid: true, sanitized: value }; // Fallback to allow submission
    }
  } catch (error) {
    console.error('AI content validation error:', error);
    return { isValid: true, sanitized: value }; // Fallback to allow submission
  }
};

const ManualProfileForm: React.FC<ManualProfileFormProps> = ({
  onSubmit,
  onSwitchToAI,
  initialData = {},
  workerProfileId = null
}) => {
  const { user } = useAuth();
 
  
  const [formData, setFormData] = useState<FormData>({
    about: '',
    experience: '',
    skills: '',
    qualifications: '', // Add qualifications field
    equipment: '',
    hourlyRate: 0,
    location: null,
    availability: {
      days: [],
      startTime: '09:00',
      endTime: '17:00',
      frequency: 'weekly',
      ends: 'never',
      startDate: new Date().toISOString().split('T')[0], // Today's date
      endDate: undefined,
      occurrences: undefined
    },
    videoIntro: null,
    references: workerProfileId ? buildRecommendationLink(workerProfileId) : '',
    ...initialData
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(0);

  const weekDays = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  // Update references field when workerProfileId becomes available
  useEffect(() => {
    if (workerProfileId && !formData.references) {
      setFormData(prev => ({
        ...prev,
        references: buildRecommendationLink(workerProfileId)
      }));
    }
  }, [workerProfileId, formData.references]);

  // Check if user already has a worker profile and build recommendation link if available
  useEffect(() => {
    const fetchExistingProfile = async () => {
      if (user?.claims?.role === "GIG_WORKER" && user?.token && !formData.references) {
        try {
          const result = await getPrivateWorkerProfileAction(user.token);
          if (result.success && result.data?.id) {
            // User already has a worker profile, build the recommendation link
            setFormData(prev => ({
              ...prev,
              references: buildRecommendationLink(result.data.id as string)
            }));
          }
        } catch (error) {
          console.error('Failed to fetch existing worker profile:', error);
          // If we can't fetch the existing profile, set a placeholder
          setFormData(prev => ({
            ...prev,
            references: "Recommendation link will be generated after profile creation"
          }));
        }
      }
    };

    fetchExistingProfile();
  }, [user?.claims?.role, user?.token, formData.references]);

  // Calculate progress based on filled fields (only the validated fields)
  useEffect(() => {
    const validatedFields = ['about', 'experience', 'skills', 'equipment'];
 
    const filledFields = validatedFields.filter(field => {
      const value = formData[field as keyof FormData];
      return value && typeof value === 'string' && value.trim().length >= VALIDATION_CONSTANTS.WORKER[`MIN_${field.toUpperCase()}_LENGTH` as keyof typeof VALIDATION_CONSTANTS.WORKER];
    });
    
    setProgress((filledFields.length / validatedFields.length) * 100);
  }, [formData]);

  const validateField = (name: keyof FormData, value: any): string => {

    switch (name) {
      case 'about':
        return value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH ? `Please provide at least ${VALIDATION_CONSTANTS.WORKER.MIN_ABOUT_LENGTH} characters about yourself` : '';
      case 'experience':
        return value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_EXPERIENCE_LENGTH ? `Please describe your years of experience (at least ${VALIDATION_CONSTANTS.WORKER.MIN_EXPERIENCE_LENGTH} characters)` : '';
      case 'skills':
        return value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH ? `Please list your skills (at least ${VALIDATION_CONSTANTS.WORKER.MIN_SKILLS_LENGTH} characters)` : '';
      case 'equipment':
        return !value || value.trim().length < VALIDATION_CONSTANTS.WORKER.MIN_EQUIPMENT_LENGTH ? `Please list your equipment (at least ${VALIDATION_CONSTANTS.WORKER.MIN_EQUIPMENT_LENGTH} characters)` : '';
      case 'qualifications':
        // Qualifications are optional, but if provided, should be meaningful
        return value && value.trim().length > 0 && value.trim().length < 5 ? 'Please provide more details about your qualifications (at least 5 characters)' : '';
      case 'hourlyRate':
        return !value || value < VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE ? `Please enter a valid hourly rate (minimum £${VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE})` : '';
      case 'location':
        return !value || !value.lat || !value.lng ? 'Please select your location' : '';
      case 'availability':
        return !value.days || value.days.length === 0 ? 'Please select at least one day of availability' : '';
      case 'videoIntro':
        return !value || typeof value !== 'string' || value.trim().length === 0 ? 'Please record a video introduction' : '';
      default:
        return '';
    }
  };

  const handleInputChange = (name: keyof FormData, value: any) => {
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      

      
      return newData;
    });

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleLocationChange = (locationData: any) => {
    setFormData(prev => ({ ...prev, location: locationData }));
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleVideoRecorded = async (blob: Blob) => {
    if (!user) {
      console.error('User not authenticated for video upload');
      return;
    }

    try {
      // Upload video to Firebase Storage
      const file = new File([blob], 'video-intro.webm', { type: 'video/webm' });
      const filePath = `workers/${user.uid}/introVideo/introduction-${encodeURI(user.email ?? user.uid)}.webm`;
      const fileStorageRef = ref(getStorage(firebaseApp), filePath);
      const uploadTask = uploadBytesResumable(fileStorageRef, file);

      // Wait for upload to complete and get download URL
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on(
          "state_changed",
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            console.log("Video upload progress:", progress + "%");
          },
          (error) => {
            console.error("Video upload failed:", error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref)
              .then((url) => {
                console.log("Video uploaded successfully:", url);
                resolve(url);
              })
              .catch(reject);
          }
        );
      });

      // Store the Firebase download URL instead of the File object
      setFormData(prev => ({ ...prev, videoIntro: downloadURL }));
      
      // Clear any existing video validation errors
      setErrors(prev => ({ ...prev, videoIntro: '' }));
    } catch (error) {
      console.error("Video upload error:", error);
      setErrors(prev => ({ ...prev, videoIntro: 'Video upload failed. Please try again.' }));
    }
  };

  const handleDayToggle = (day: string) => {
    setFormData(prev => ({
      ...prev,
      availability: {
        ...prev.availability,
        days: prev.availability.days.includes(day)
          ? prev.availability.days.filter(d => d !== day)
          : [...prev.availability.days, day]
      }
    }));
  };

  // AI Content Validation function - rejects inappropriate content
  const validateContentWithAI = async (field: string, value: string): Promise<{ isValid: boolean; error?: string; sanitized?: string }> => {
    if (!value || value.trim().length === 0) {
      return { isValid: true, sanitized: value };
    }

    try {
      const ai = getAI();
      if (!ai) {
        console.log('AI not available, skipping content validation');
        return { isValid: true, sanitized: value };
      }

      let prompt = '';
      let schema: any;

      if (field === 'about') {
        prompt = `Validate this worker's self-description. Check if it's professional and relevant for gig work. Reject if it contains:
        - Personal names of celebrities, athletes, or fictional characters
        - Jokes, memes, or inappropriate content
        - Non-professional information
        - Gibberish or random text
        
        If valid, return the cleaned version. If invalid, explain why it's inappropriate.
        
        Description: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
      } else if (field === 'skills') {
        prompt = `Validate this skills list. Check if it contains only professional skills relevant to gig work. Reject if it contains:
        - Personal names of celebrities, athletes, or fictional characters
        - Jokes, memes, or inappropriate content
        - Non-professional skills
        - Random text or gibberish
        
        If valid, return the cleaned list. If invalid, explain why it's inappropriate.
        
        Skills: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
      } else if (field === 'experience') {
        prompt = `Validate this experience description. Check if it's professional and relevant. Reject if it contains:
        - Personal names of celebrities, athletes, or fictional characters
        - Jokes, memes, or inappropriate content
        - Non-professional information
        - Gibberish or random text
        
        If valid, return the cleaned version. If invalid, explain why it's inappropriate.
        
        Experience: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
      } else if (field === 'equipment') {
        prompt = `Validate this equipment list. Check if it contains only professional equipment relevant to gig work. Reject if it contains:
        - Personal names of celebrities, athletes, or fictional characters
        - Jokes, memes, or inappropriate content
        - Non-professional items
        - Random text or gibberish
        
        If valid, return the cleaned list. If invalid, explain why it's inappropriate.
        
        Equipment: "${value}"`;
        
        schema = Schema.object({
          properties: {
            isValid: Schema.boolean(),
            reason: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["isValid", "reason", "sanitized"]
        });
      } else {
        return { isValid: true, sanitized: value };
      }

      const result = await geminiAIAgent(
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        { prompt, responseSchema: schema },
        ai,
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
      );

      if (result.ok) {
        const data = result.data as any;
        return {
          isValid: data.isValid,
          error: data.isValid ? undefined : data.reason,
          sanitized: data.sanitized || value
        };
      } else {
        console.error('AI content validation failed:', result);
        return { isValid: true, sanitized: value }; // Fallback to allow submission
      }
    } catch (error) {
      console.error('AI content validation error:', error);
      return { isValid: true, sanitized: value }; // Fallback to allow submission
    }
  };

  // AI Sanitization function for specific fields (kept for job title extraction)
  const sanitizeWithAI = async (field: string, value: string): Promise<{ sanitized: string; jobTitle?: string; yearsOfExperience?: number }> => {
    if (!value || value.trim().length === 0) {
      return { sanitized: value };
    }

    try {
      const ai = getAI();
      if (!ai) {
        console.log('AI not available, returning original value');
        return { sanitized: value };
      }

      let prompt = '';
      let schema: any;

      if (field === 'about') {
        prompt = `Extract the job title from this worker's self-description. Return only the most relevant job title (e.g., "Bartender", "Chef", "Event Coordinator"). If no clear job title, return "General Worker".

Description: "${value}"`;
        
        schema = Schema.object({
          properties: {
            jobTitle: Schema.string(),
            sanitized: Schema.string()
          },
          required: ["jobTitle", "sanitized"]
        });
      } else if (field === 'skills') {
        prompt = `Clean and format this skills list. Remove duplicates, fix typos, and organize into a clean comma-separated list. Keep only relevant professional skills.

Skills: "${value}"`;
        
        schema = Schema.object({
          properties: {
            sanitized: Schema.string()
          },
          required: ["sanitized"]
        });
      } else if (field === 'experience') {
        prompt = `Extract the years of experience from this text. Look for numbers followed by "years", "yrs", or similar. Return the number of years as an integer.

Experience description: "${value}"`;
        
        schema = Schema.object({
          properties: {
            yearsOfExperience: Schema.number(),
            sanitized: Schema.string()
          },
          required: ["yearsOfExperience", "sanitized"]
        });
      } else {
        return { sanitized: value };
      }

      const result = await geminiAIAgent(
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_0_FLASH,
        { prompt, responseSchema: schema },
        ai,
        VALIDATION_CONSTANTS.AI_MODELS.GEMINI_2_5_FLASH_PREVIEW
      );

      if (result.ok) {
        const data = result.data as any;
        return {
          sanitized: data.sanitized || value,
          jobTitle: data.jobTitle,
          yearsOfExperience: data.yearsOfExperience
        };
      } else {
        console.error('AI sanitization failed:', result.error);
        return { sanitized: value };
      }
    } catch (error) {
      console.error('AI sanitization error:', error);
      return { sanitized: value };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    console.log('🔍 Starting form validation...');

    // Only validate about, experience, skills, and equipment
    const fieldsToValidate = ['about', 'experience', 'skills', 'equipment'];
    
    fieldsToValidate.forEach(fieldName => {
      const value = formData[fieldName as keyof FormData];
      const error = validateField(fieldName as keyof FormData, value);

      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
        console.log(`❌ Validation failed for ${fieldName}:`, error);
      } else {
        console.log(`✅ Validation passed for ${fieldName}`);
      }
    });

    console.log(`🔍 Form validation result: ${isValid ? 'PASSED' : 'FAILED'}`);
    if (!isValid) {
      console.log('❌ Validation errors:', newErrors);
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      console.error('User not authenticated');
      return;
    }

    // Validate form before proceeding
    if (!validateForm()) {
      console.log('❌ Form validation failed, not submitting');
      return;
    }

    console.log('✅ Form validation passed, proceeding with AI content validation');
    setIsSubmitting(true);
    
    try {
      // AI Content Validation - this will REJECT inappropriate content
      const validationErrors: Record<string, string> = {};
      let hasContentErrors = false;

      // Validate each field with AI
      const fieldsToValidate = ['about', 'experience', 'skills', 'equipment'];
      
      for (const field of fieldsToValidate) {
        const value = formData[field as keyof FormData];
        if (value && typeof value === 'string' && value.trim().length > 0) {
          console.log(`🤖 Validating ${field} content with AI...`);
          const validation = await validateContentWithAI(field, value);
          
          if (!validation.isValid) {
            console.log(`❌ AI rejected ${field}:`, validation.error);
            validationErrors[field] = validation.error || 'Content is inappropriate for professional use';
            hasContentErrors = true;
          } else {
            console.log(`✅ AI approved ${field}`);
          }
        }
      }

      // If AI found inappropriate content, show errors and stop submission
      if (hasContentErrors) {
        console.log('❌ AI content validation failed, blocking submission');
        setErrors(prev => ({ ...prev, ...validationErrors }));
        setIsSubmitting(false);
        return;
      }

      console.log('✅ AI content validation passed, proceeding with sanitization');
      
      // AI Sanitization for specific fields (only if content is valid)
      const sanitizedData = { ...formData };
      let extractedJobTitle = '';

      // Sanitize About field (extract job title)
      if (formData.about) {
        const aboutResult = await sanitizeWithAI('about', formData.about);
        sanitizedData.about = aboutResult.sanitized;
        if (aboutResult.jobTitle) {
          extractedJobTitle = aboutResult.jobTitle;
        }
      }

      // Sanitize Skills field
      if (formData.skills) {
        const skillsResult = await sanitizeWithAI('skills', formData.skills);
        sanitizedData.skills = skillsResult.sanitized;
      }

      // Sanitize Experience field (extract years)
      if (formData.experience) {
        const experienceResult = await sanitizeWithAI('experience', formData.experience);
        sanitizedData.experience = experienceResult.sanitized;
        
        // If we extracted years of experience, we could use this for other purposes
        if (experienceResult.yearsOfExperience) {
          console.log('Extracted years of experience:', experienceResult.yearsOfExperience);
        }
      }

      // Add extracted job title to the data
      if (extractedJobTitle) {
        sanitizedData.jobTitle = extractedJobTitle;
      }

      // Update form data with sanitized values
      setFormData(sanitizedData);
      
      console.log('📤 Submitting validated and sanitized data to backend:', {
        about: sanitizedData.about?.substring(0, 50) + '...',
        experience: sanitizedData.experience?.substring(0, 50) + '...',
        skills: sanitizedData.skills?.substring(0, 50) + '...',
        equipment: sanitizedData.equipment?.substring(0, 50) + '...',
        hourlyRate: sanitizedData.hourlyRate,
        hasLocation: !!sanitizedData.location,
        availabilityDays: sanitizedData.availability.days.length,
        hasVideo: !!sanitizedData.videoIntro,
        jobTitle: sanitizedData.jobTitle
      });
      
      // Submit the validated and sanitized data
      await onSubmit(sanitizedData);
    } catch (error) {
      console.error('Form submission error:', error);
      // Set error state to show user
      setErrors(prev => ({ ...prev, submit: 'Failed to submit form. Please try again.' }));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prevent implicit submit when pressing Enter in inputs
  const handleFormKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Enter') return;
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const tagName = target.tagName?.toLowerCase();
    const isTextarea = tagName === 'textarea';
    const isButton = tagName === 'button';
    const isSubmitButton = isButton && (target as HTMLButtonElement).type === 'submit';

    // Block Enter unless it's inside a textarea (new line) or the explicit submit button
    if (!isTextarea && !isSubmitButton) {
      e.preventDefault();
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h2 className={styles.formTitle}>Create Your Worker Profile</h2>
        <p className={styles.formSubtitle}>
          Fill out the form below to complete your profile setup
        </p>

        {/* Progress Bar */}
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className={styles.progressText}>{Math.round(progress)}% Complete</span>
        </div>

        {/* Switch to AI Option */}
        <button
          type="button"
          className={styles.switchButton}
          onClick={onSwitchToAI}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" fill="currentColor"/>
          </svg>
          Switch to AI-Assisted Setup
        </button>
      </div>

      <form onSubmit={handleSubmit} onKeyDown={handleFormKeyDown} className={styles.form}>
        {/* About Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>About You</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Tell us about yourself *
            </label>
            <textarea
              className={`${styles.textarea} ${errors.about ? styles.error : ''}`}
              value={formData.about}
              onChange={(e) => handleInputChange('about', e.target.value)}
              placeholder="Tell us about yourself and your background..."
              rows={4}
            />
            {errors.about && <span className={styles.errorText}>{errors.about}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Years of Experience *
            </label>
            <textarea
              className={`${styles.textarea} ${errors.experience ? styles.error : ''}`}
              value={formData.experience}
              onChange={(e) => handleInputChange('experience', e.target.value)}
              placeholder="How many years of experience do you have in your field? (e.g., 5 years in construction, 3 years in plumbing...)"
              rows={3}
            />
            {errors.experience && <span className={styles.errorText}>{errors.experience}</span>}
          </div>

                     <div className={styles.formGroup}>
             <label className={styles.label}>
               Skills *
             </label>
             <textarea
               className={`${styles.textarea} ${errors.skills ? styles.error : ''}`}
               value={formData.skills}
               onChange={(e) => handleInputChange('skills', e.target.value)}
               placeholder="List your professional skills..."
               rows={3}
             />
             {errors.skills && <span className={styles.errorText}>{errors.skills}</span>}
           </div>

           <div className={styles.formGroup}>
             <label className={styles.label}>
               Qualifications & Certifications
             </label>
             <textarea
               className={`${styles.textarea} ${errors.qualifications ? styles.error : ''}`}
               value={formData.qualifications}
               onChange={(e) => handleInputChange('qualifications', e.target.value)}
               placeholder="List your qualifications, certifications, degrees, licenses, etc..."
               rows={3}
             />
             {errors.qualifications && <span className={styles.errorText}>{errors.qualifications}</span>}
           </div>

           <div className={styles.formGroup}>
             <label className={styles.label}>
               Equipment *
             </label>
             <textarea
               className={`${styles.textarea} ${errors.equipment ? styles.error : ''}`}
               value={formData.equipment}
               onChange={(e) => handleInputChange('equipment', e.target.value)}
               placeholder="List any equipment you have that you can use for your work..."
               rows={3}
             />
             {errors.equipment && <span className={styles.errorText}>{errors.equipment}</span>}
           </div>
        </div>

        {/* Pricing & Location Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Pricing & Location</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Hourly Rate (£) *
            </label>
            <div className={styles.inputWrapper}>
              <span className={styles.currencySymbol}>£</span>
              <input
                type="number"
                className={`${styles.input} ${styles.rateInput} ${errors.hourlyRate ? styles.error : ''}`}
                value={formData.hourlyRate || ''}
                onChange={(e) => handleInputChange('hourlyRate', parseFloat(e.target.value) || 0)}
                placeholder="15"
                min={VALIDATION_CONSTANTS.WORKER.MIN_HOURLY_RATE}
                step="0.01"
              />
            </div>
            {errors.hourlyRate && <span className={styles.errorText}>{errors.hourlyRate}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Your Location *
            </label>
            <LocationPickerBubble
              value={formData.location}
              onChange={handleLocationChange}
              role="GIG_WORKER"
            />
            {errors.location && <span className={styles.errorText}>{errors.location}</span>}
          </div>
        </div>

        {/* Availability Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Weekly Availability</h3>
          <p className={styles.helpText}>Set your recurring weekly availability schedule</p>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Available Days *
            </label>
            <div className={styles.availabilityDays}>
              {weekDays.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={`${styles.dayButton} ${
                    formData.availability.days.includes(day.value) ? styles.dayButtonActive : ''
                  }`}
                  onClick={() => handleDayToggle(day.value)}
                >
                  {day.label}
                </button>
              ))}
            </div>
                         {errors.availability && <span className={styles.errorText}>{errors.availability}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Available Hours *
            </label>
            <div className={styles.timeRangeContainer}>
              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>From:</label>
                <input
                  type="time"
                  className={styles.input}
                  value={formData.availability.startTime}
                  onChange={(e) => handleInputChange('availability', {
                    ...formData.availability,
                    startTime: e.target.value
                  })}
                />
              </div>
              <div className={styles.timeInputGroup}>
                <label className={styles.timeLabel}>To:</label>
                <input
                  type="time"
                  className={styles.input}
                  value={formData.availability.endTime}
                  onChange={(e) => handleInputChange('availability', {
                    ...formData.availability,
                    endTime: e.target.value
                  })}
                />
              </div>
            </div>
            <p className={styles.helpText}>
              Your availability will be set as: {formData.availability.days.length > 0 ?
                `${formData.availability.days.map(day => weekDays.find(d => d.value === day)?.label).join(', ')} ${formData.availability.startTime} - ${formData.availability.endTime}` :
                'Please select days and times'
              }
            </p>
          </div>
        </div>

        {/* Media & References Section */}
        <div className={styles.formSection}>
          <h3 className={styles.sectionTitle}>Media & References</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              Video Introduction *
            </label>
            <VideoRecorderOnboarding
              onVideoRecorded={handleVideoRecorded}
              prompt="Record a 30-second introduction video to help clients get to know you"
            />
            {formData.videoIntro && (
              <p className={styles.helpText}>Video uploaded successfully ✓</p>
            )}
            {errors.videoIntro && <span className={styles.errorText}>{errors.videoIntro}</span>}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>
              References Link
            </label>
            <div className={styles.referencesContainer}>
              <div className={styles.referencesInfo}>
                <p className={styles.referencesDescription}>
                  Share this link with your previous employers, colleagues, or clients to collect references:
                </p>
                <div className={styles.referencesLinkContainer}>
                  <input
                    type="text"
                    className={styles.referencesLink}
                    value={formData.references}
                    readOnly
                    placeholder="Generating reference link..."
                  />
                  <button
                    type="button"
                    className={styles.copyButton}
                    onClick={() => {
                      navigator.clipboard.writeText(formData.references);
                      // You could add a toast notification here
                    }}
                    title="Copy link to clipboard"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
                <p className={styles.helpText}>
                  Send this link to people who can provide references for your work. They'll be able to submit recommendations directly through our platform.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className={styles.formActions}>
          {errors.submit && (
            <div className={styles.errorMessage}>
              {errors.submit}
            </div>
          )}
          
          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || progress < 100}
          >
            {isSubmitting ? (
              <>
                <div className={styles.spinner} />
                Creating Profile...
              </>
            ) : (
              'Complete Profile Setup'
            )}
          </button>

          {progress < 100 && (
            <p className={styles.completionNote}>
              Please fill in about, experience, skills, and equipment sections to complete your profile
            </p>
          )}
        </div>
      </form>
    </div>
  );
};

export default ManualProfileForm;
