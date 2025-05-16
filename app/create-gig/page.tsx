"use client";

import React, { useState, useEffect, useRef, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/hooks/useAppContext'; // Corrected path

import ChatBotLayout from '@/app/components/onboarding/ChatBotLayout'; // Corrected path
import MessageBubble from '@/app/components/onboarding/MessageBubble'; // Corrected path
import InputBubble from '@/app/components/onboarding/InputBubble'; // Corrected path
import TextAreaBubble from '@/app/components/onboarding/TextAreaBubble'; // Corrected path
// import FileUploadBubble from '@/app/components/onboarding/FileUploadBubble'; // Corrected path - Uncomment if used
import WorkerCard, { WorkerData } from '@/app/components/onboarding/WorkerCard'; // Import WorkerCard and WorkerData

import pageStyles from './CreateGigPage.module.css'; // Page-specific styles (for loading container etc.)
import workerCardStyles from '@/app/components/onboarding/WorkerCard.module.css'; // Import shared WorkerCard styles

const BOT_AVATAR_SRC = "/images/logo-placeholder.svg";

interface OnboardingStep { // Renaming to GigStep or similar might be good later if it diverges significantly
  id: number;
  type: 'botMessage' | 'userInput' | 'userResponseDisplay' | 'workerCard' | 'terms' | 'fileUpload' | 'datePicker' | 'discountCode';
  senderType?: 'bot' | 'user';
  content?: string | React.ReactNode;
  inputType?: 'text' | 'email' | 'number' | 'textarea' | 'file' | 'date';
  inputName?: string;
  inputPlaceholder?: string;
  inputLabel?: string;
  isComplete?: boolean;
  dependsOn?: number;
  value?: any;
  fileLabel?: string;
  fileMultiple?: boolean;
  workerData?: WorkerData; // Added workerData to step
}

// WorkerCard Component definition removed - now imported

const baseInitialSteps: OnboardingStep[] = [
  { id: 1, type: 'botMessage', content: "What gig or gigs you need filling - we can assemble a team if you need one!" },
  {
    id: 2, type: 'userInput', inputType: 'textarea', inputName: 'gigNeeds',
    inputPlaceholder: 'Describe your gig needs', inputLabel: 'Describe your gig needs:', dependsOn: 1
  },
  { id: 3, type: 'botMessage', content: "Thats great we have some great bartenders available. Shall we use the same instructions, pay and location as before? Is there anything else you want to pass on to the gigee?", dependsOn: 2 }, // dependsOn updated
  {
    id: 4, type: 'userInput', inputType: 'textarea', inputName: 'requirements',
    inputPlaceholder: 'Describe your requirements', inputLabel: 'Describe your requirements:', dependsOn: 3
  },
  { id: 5, type: 'botMessage', content: "What time and day do you need someone?", dependsOn: 4}, // dependsOn updated
  {
    id: 6, type: 'userInput', inputType: 'date', inputName: 'dateTime', // Consider a more specific date/time picker component
    inputLabel: 'Date, start and end time', dependsOn: 5
  },
  // Removed discount code steps as they were not in the new image for this flow
  { id: 7, type: 'botMessage', content: "Thanks for sharing all this great information, here are our incredible available gig workers ready to accept your gig. Click on their profile for an indepth look at their gigfolio or simply click to pay and book!", dependsOn: 6 }, // dependsOn updated
  {
        id: 8,
        type: 'workerCard',
        dependsOn: 7,
        workerData: {
            name: 'Benji Asamoah',
            title: 'Bartender',
            gigs: 15,
            experience: '3 years experience',
            keywords: 'lively, professional and hardworking',
            hourlyRate: 15,
            totalHours: 6,
            totalPrice: 98.68,
            ableFees: '6.5% +VAT',
            stripeFees: '1.5% + 20p',
            imageSrc: '/images/benji.jpeg',
        }
    },
    {
        id: 9,
        type: 'workerCard',
        dependsOn: 7, // Both cards depend on step 7 to appear together
        workerData: {
            name: 'Jessica Hersey',
            title: 'Bartender',
            gigs: 11,
            experience: '2 years experience',
            keywords: 'charming, peaceful and kind',
            hourlyRate: 15,
            totalHours: 6,
            totalPrice: 85.55,
            ableFees: '6.5% +VAT',
            stripeFees: '1.5% + 20p',
            imageSrc: '/images/jessica.jpeg',
        }
    },
];


export default function CreateGigPage() { // Renamed component
  const router = useRouter();
  const { isAuthenticated, isLoading: loadingAuth } = useAppContext();
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const isViewQA = useMemo(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("isViewQA") === "true";
  }, []);

  const [onboardingSteps, setOnboardingSteps] = useState<OnboardingStep[]>(baseInitialSteps.map(s => ({...s, isComplete: false})));
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [chatMessages, setChatMessages] = useState<OnboardingStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentFocusedInputName, setCurrentFocusedInputName] = useState<string | null>(null);
  const [workerName, setWorkerName] = useState<string | null>(null);
  const [workerPrice, setWorkerPrice] = useState<number | null>(null);

  useEffect(() => {
    if (isViewQA) {
      const qaFormData: Record<string, any> = {};
      baseInitialSteps.forEach(step => {
        if (step.inputName) {
          switch (step.inputType) {
            case 'file': qaFormData[step.inputName] = `sample-${step.inputName}.pdf`; break;
            case 'date': qaFormData[step.inputName] = new Date().toISOString().split('T')[0]; break;
            default: qaFormData[step.inputName] = `QA: ${step.inputLabel || step.inputName || 'Sample'}`;
          }
        }
      });
      setFormData(qaFormData);
    } else {
      setOnboardingSteps(baseInitialSteps.map(s => ({...s, isComplete: false})));
      setFormData({});
    }
  }, [isViewQA]);

  useEffect(() => {
    const newMessages: OnboardingStep[] = [];
    if (isViewQA) {
      let currentStepIdForDependency = 0;
      baseInitialSteps.forEach(step => {
        const messageToAdd = { ...step, content: step.content, isComplete: true, dependsOn: currentStepIdForDependency };
        newMessages.push(messageToAdd);
        currentStepIdForDependency = step.id;

        if (step.inputName && (step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker' || step.type === 'terms')) {
          let qaValue = formData[step.inputName];
          if (qaValue === undefined) {
             switch (step.inputType) {
                case 'file': qaValue = `sample-${step.inputName}.pdf`; break;
                case 'date': qaValue = new Date().toISOString().split('T')[0]; break;
                default: qaValue = `QA: ${step.inputLabel || step.inputName || 'Sample Answer'}`;
            }
          }
          newMessages.push({
            id: step.id + 0.5,
            type: 'userResponseDisplay',
            senderType: 'user',
            content: String(qaValue),
            isComplete: true,
            dependsOn: currentStepIdForDependency,
          });
          currentStepIdForDependency = step.id + 0.5;
        }
      });
    } else {
      let firstUncompletedInputFound = false;
      let nextFocusTargetSet = false;
      for (let i = 0; i < onboardingSteps.length; i++) {
        const step = onboardingSteps[i];
        if (step.dependsOn) {
          const dependentStep = onboardingSteps.find(s => s.id === step.dependsOn);
           if (dependentStep && !dependentStep.isComplete && step.type !== 'workerCard') {
            break;
          }
          if (step.type === 'workerCard' && dependentStep && !newMessages.some(nm => nm.id === dependentStep.id)) {
            break;
          }
        }
        newMessages.push({ ...step, value: formData[step.inputName || ''] });

        if ((step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete && !firstUncompletedInputFound) {
          firstUncompletedInputFound = true;
          if (!currentFocusedInputName && !nextFocusTargetSet) {
            setCurrentFocusedInputName(step.inputName || null);
            nextFocusTargetSet = true;
          }
        }
        if ((step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete) {
          break;
        }
      }
    }
    setChatMessages(newMessages);
  }, [onboardingSteps, formData, isViewQA]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
    if (!isViewQA && currentFocusedInputName) {
        const inputElement = document.querySelector(`[name="${currentFocusedInputName}"]`) as HTMLElement;
        inputElement?.focus();
    }
  }, [chatMessages, currentFocusedInputName, isViewQA]);

  const handleInputChange = (name: string, value: any) => {
    if (isViewQA) return;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleInputSubmit = (stepId: number, inputName: string) => {
    if (isViewQA) return;
    if (formData[inputName] === undefined || formData[inputName] === '') {
        const stepBeingSubmitted = onboardingSteps.find(s => s.id === stepId);
        if (stepBeingSubmitted?.inputType !== 'file' && stepBeingSubmitted?.inputType !== 'date') {
            return;
        }
    }
    const stepIndex = onboardingSteps.findIndex(s => s.id === stepId);
    if (stepIndex !== -1) {
      const updatedSteps = [...onboardingSteps];
      updatedSteps[stepIndex].isComplete = true;
      if (formData[inputName] !== undefined && formData[inputName] !== '') {
        const userResponseStep: OnboardingStep = {
          id: Date.now(), type: 'userResponseDisplay', senderType: 'user',
          content: formData[inputName], dependsOn: stepId, isComplete: true,
        };
        let insertAtIndex = updatedSteps.findIndex(s => s.id === stepId) + 1;
        updatedSteps.splice(insertAtIndex, 0, userResponseStep);
      }
      setOnboardingSteps(updatedSteps);
    }
    let nextFocus: string | null = null;
    const currentStepInFlowIndex = onboardingSteps.findIndex(s => s.id === stepId);
    for (let i = currentStepInFlowIndex + 1; i < onboardingSteps.length; i++) {
        const nextStepDef = onboardingSteps[i];
        if ((nextStepDef.type === 'userInput' || nextStepDef.type === 'fileUpload' || nextStepDef.type === 'datePicker') && !nextStepDef.isComplete) {
            const depStep = onboardingSteps.find(s => s.id === nextStepDef.dependsOn);
            if ((depStep && depStep.isComplete) || !nextStepDef.dependsOn) {
                nextFocus = nextStepDef.inputName || null;
                break;
            }
        }
    }
    setCurrentFocusedInputName(nextFocus);
  };

  const handleBookWorker = (name: string, price: number) => {
    if (isViewQA) return;
    setWorkerName(name);
    setWorkerPrice(price);
    const stepsToComplete = baseInitialSteps.filter(s => s.id < 7); // Mark steps before worker cards as complete
    const updatedSteps = onboardingSteps.map(os =>
        stepsToComplete.find(sc => sc.id === os.id) ? { ...os, isComplete: true } : os
    );
    const bookingResponseStep: OnboardingStep = {
        id: Date.now(), type: 'userResponseDisplay', senderType: 'user',
        content: `Booking ${name} for £${price.toFixed(2)}...`, dependsOn: 7, isComplete: true,
    };
    const lastBotMessageIndex = updatedSteps.findIndex(s => s.id === 7);
    if (lastBotMessageIndex !== -1) updatedSteps.splice(lastBotMessageIndex + 1, 0, bookingResponseStep);
    else updatedSteps.push(bookingResponseStep);
    setOnboardingSteps(updatedSteps);
    handleFinalSubmitGig(); // Renamed from handleFinalSubmit
    console.log(`Booking ${name} for £${price.toFixed(2)}`);
  };

  const handleFinalSubmitGig = async (event?: FormEvent) => { // Renamed
    if (isViewQA && !workerName) return;
    event?.preventDefault();
    setIsSubmitting(true);
    console.log("Mock Create Gig Data:", formData, "Booked Worker:", workerName, "Price:", workerPrice);
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log("Mock gig creation/booking successful!");
    const contentMessage = workerName && workerPrice
        ? `Great! ${workerName} is booked for your gig at £${workerPrice.toFixed(2)}. (Mocked)`
        : "Thanks! Your gig details are saved (Mocked).";
    const successMessageStep: OnboardingStep = { id: Date.now() + 1, type: 'botMessage', content: contentMessage };
    const allBaseStepsNowComplete = onboardingSteps.map(bs => ({...bs, isComplete: true})); // Use current onboardingSteps
    const finalOnboardingState = [...allBaseStepsNowComplete.filter(s => s.id !== successMessageStep.id), successMessageStep]; // Avoid duplicate success
    
    const finalChatMessages: OnboardingStep[] = [];
    let lastIdForDep = 0;
    finalOnboardingState.forEach(step => {
        finalChatMessages.push({...step, dependsOn: lastIdForDep});
        lastIdForDep = step.id;
        if(step.inputName && formData[step.inputName] && step.type !== 'botMessage' && step.type !== 'userResponseDisplay' && step.type !== 'workerCard'){
            finalChatMessages.push({
                id: step.id + 0.5, type: 'userResponseDisplay', senderType: 'user',
                content: String(formData[step.inputName]), isComplete: true, dependsOn: step.id,
            });
            lastIdForDep = step.id + 0.5;
        }
    });
    setChatMessages(finalChatMessages);
    setOnboardingSteps(finalOnboardingState);
    setIsSubmitting(false);
  };

  const allInteractiveStepsComplete = useMemo(() => {
    if (isViewQA) return true;
    const interactiveSteps = onboardingSteps.filter(step =>
        step.type !== 'userResponseDisplay' && step.type !== 'botMessage' && step.type !== 'workerCard' &&
        (step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker')
    );
    return interactiveSteps.every(step => step.isComplete);
  }, [onboardingSteps, isViewQA]);

  if (loadingAuth) {
    return <div className={pageStyles.loadingContainer}><p>Loading authentication...</p></div>;
  }

  return (
    // No tag prop for this page as per new design
    <>
      <ChatBotLayout ref={chatContainerRef} onScroll={(e: React.UIEvent<HTMLDivElement>) => {}}>
        {isViewQA && (
          <div style={{ background: 'rgba(255,220,220,0.8)', borderBottom: '1px solid rgba(200,0,0,0.3)', color: '#8B0000', textAlign: 'center', padding: '8px 5px', fontSize: '0.85em', fontWeight: '500' }}>
            QA Mode: Full Chat Preview
          </div>
        )}
        {isViewQA && (
          <div style={{ background: 'rgba(255,220,220,0.8)', borderBottom: '1px solid rgba(200,0,0,0.3)', color: '#8B0000', textAlign: 'center', padding: '8px 5px', fontSize: '0.85em', fontWeight: '500' }}>
            QA Mode: Full Chat Preview
          </div>
        )}
        {chatMessages.map((step) => {
          const key = `step-${step.id}-${step.senderType || step.type}-${step.inputName || Math.random()}`;

          if (step.type === 'botMessage') {
            return <MessageBubble key={key} text={step.content as string} senderType="bot" avatarSrc={BOT_AVATAR_SRC} />;
          }
          if (step.type === 'userResponseDisplay' && step.senderType === 'user') {
               return <MessageBubble key={key} text={step.content as string} senderType="user" showAvatar={false} />;
          }
          // Removed discountCode specific rendering as it's not in this flow's baseInitialSteps
          if (step.type === 'workerCard' && step.workerData) {
              return <WorkerCard key={key} worker={step.workerData} onBook={handleBookWorker} />;
          }

          if (!isViewQA && (step.type === 'userInput' || step.type === 'fileUpload' || step.type === 'datePicker') && !step.isComplete) {
            const commonProps = {
              id: step.inputName, name: step.inputName, label: step.inputLabel,
              value: formData[step.inputName!] || '', disabled: isSubmitting,
              onFocus: () => setCurrentFocusedInputName(step.inputName || null),
              onBlur: () => { if(formData[step.inputName!] || step.inputType === 'date' || step.inputType === 'file') handleInputSubmit(step.id, step.inputName!); },
              onKeyPress: (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                if (e.key === 'Enter' && (step.inputType === 'text' || step.inputType === 'email' || step.inputType === 'number')) {
                  e.preventDefault(); handleInputSubmit(step.id, step.inputName!);
                }
              }
            };
            if (step.inputType === 'textarea') {
              return <TextAreaBubble key={key} {...commonProps} placeholder={step.inputPlaceholder} rows={3} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange(step.inputName!, e.target.value)} ref={(el: HTMLTextAreaElement | null) => { if (el && currentFocusedInputName === step.inputName) el.focus(); }}/>;
            }
            // Add FileUploadBubble or CalendarPickerBubble rendering here if those inputTypes are used in this flow's baseInitialSteps
            if (step.inputType === 'text' || step.inputType === 'email' || step.inputType === 'number' || step.inputType === 'date') {
              return <InputBubble key={key} {...commonProps} type={step.inputType} placeholder={step.inputPlaceholder} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange(step.inputName!, e.target.value)} ref={(el: HTMLInputElement | null) => { if (el && currentFocusedInputName === step.inputName) el.focus(); }}/>;
            }
          }
          return null;
        })}
        {/* No generic "Confirm & Proceed" button for this flow as booking is per card */}
         {isSubmitting && !isViewQA && (
           <MessageBubble key="submitting-msg" text="Processing..." senderType="bot" avatarSrc={BOT_AVATAR_SRC} />
         )}
      </ChatBotLayout>
         <input
          type="text"
          placeholder="Type your message..."
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              const target = e.target as HTMLInputElement;
              if (isViewQA) {
                console.log('QA Mode Message:', target.value);
              } else {
                // TODO: Send message to backend
                console.log('Send message to backend:', target.value);
              }
              target.value = '';
            }
          }}
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '5px',
            marginTop: '10px',
          }}
        />
    </>
  );
}