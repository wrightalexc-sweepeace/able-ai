"use client";

import React, { ChangeEvent, KeyboardEvent } from 'react';
import MessageBubble from '@/app/components/onboarding/MessageBubble';
import InputBubble from '@/app/components/onboarding/InputBubble';
import TextAreaBubble from '@/app/components/onboarding/TextAreaBubble';
import FileUploadBubble from '@/app/components/onboarding/FileUploadBubble';
import CalendarBubble from '@/app/components/onboarding/CalendarBubble';
import MapLinkBubble from '@/app/components/onboarding/MapLinkBubble';
import StripeLinkBubble from '@/app/components/onboarding/StripeLinkBubble';
import ShareLinkBubble from '@/app/components/onboarding/ShareLinkBubble';
import TermsAgreementBubble from '@/app/components/onboarding/TermsAgreementBubble';

interface OnboardingStepsProps {
    chatMessages: any[];
    formData: any;
    isSubmitting: boolean;
    currentFocusedInputName: string | null;
    handleInputChange: (name: string, value: any) => void;
    handleInputSubmit: (stepId: number, inputName?: string) => void;
    handleFileSelected: (inputName: string, file: File | null, stepId: number) => void;
    BOT_AVATAR_SRC: string;
    isViewQA: boolean;
    setCurrentFocusedInputName: (name: string | null) => void;
    user: any;
}

const OnboardingSteps: React.FC<OnboardingStepsProps> = ({
    chatMessages,
    formData,
    isSubmitting,
    currentFocusedInputName,
    handleInputChange,
    handleInputSubmit,
    handleFileSelected,
    BOT_AVATAR_SRC,
    isViewQA,
    setCurrentFocusedInputName,
    user
}) => {
  return (
    <>
      {chatMessages.map((step) => {
        const key = `step-${step.id}-${step.senderType || step.type}-${step.inputName || Math.random()}`;

        if (step.type === 'botMessage') {
          return <MessageBubble key={key} text={step.content as string} senderType="bot" avatarSrc={BOT_AVATAR_SRC} />;
        }
        if (step.type === 'userResponseDisplay') {
             return <MessageBubble key={key} text={step.content as string} senderType="user" showAvatar={false} />;
        }
        
        if (!isViewQA && !step.isComplete) {
            const commonInputProps = {
                id: step.inputName || `step-control-${step.id}`,
                name: step.inputName,
                label: step.inputLabel,
                disabled: isSubmitting,
                onFocus: () => setCurrentFocusedInputName(step.inputName || `step-control-${step.id}`),
            };

            if (step.type === 'userInput') {
              const inputSpecificProps = {
                ...commonInputProps,
                value: formData[step.inputName!] || '',
                placeholder: step.inputPlaceholder,
                onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleInputChange(step.inputName!, e.target.value),
                onBlur: () => { if(formData[step.inputName!]) handleInputSubmit(step.id, step.inputName!); },
                onKeyPress: (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
                  if (e.key === 'Enter' && (step.inputType === 'text' || step.inputType === 'email' || step.inputType === 'number')) {
                    e.preventDefault(); handleInputSubmit(step.id, step.inputName!);
                  }
                }
              };
              if (step.inputType === 'textarea') {
                return <TextAreaBubble key={key} {...inputSpecificProps} rows={3} />;
              }
              if (step.inputType !== 'file' && step.inputType !== 'date') {
                return <InputBubble key={key} {...inputSpecificProps} type={step.inputType as 'text' | 'email' | 'number' | 'password' | 'tel'} />;
              }
            }

            if (step.type === 'fileUpload') {
              return (
                <FileUploadBubble
                  key={key}
                  {...commonInputProps}
                  label={step.fileLabel || step.inputLabel}
                  multiple={step.fileMultiple}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => handleFileSelected(step.inputName!, e.target.files ? e.target.files[0] : null, step.id) }
                />
              );
            }
            if (step.type === 'videoRecord') {
               return <MessageBubble key={key} text={`[Video Recorder Placeholder: ${step.videoPrompt}]`} />;
            }
            if (step.type === 'datePicker') {
               return <MessageBubble key={key} text={`[Calendar Picker Placeholder: ${step.inputLabel}]`} />;
            }
             if (step.type === 'terms') {
              return <TermsAgreementBubble key={key} {...commonInputProps} termsContent={step.termsContent} linkToTermsPage={step.linkToTermsPage} isChecked={!!formData[step.inputName!]} onCheckedChange={(isChecked) => { handleInputChange(step.inputName!, isChecked); setTimeout(() => handleInputSubmit(step.id, step.inputName!),0); }} />
            }
            if (step.type === 'mapLink') {
                return <MapLinkBubble key={key} {...commonInputProps} />;
            }
            if (step.type === 'stripeLink') {
                return <StripeLinkBubble key={key} {...commonInputProps} stripeLink={step.stripeLink} />;
            }
        }
        
        if (step.type === 'shareLink') {
            let linkContent = step.content;
            if(typeof linkContent === 'function'){
                linkContent = linkContent(user?.uid);
            }
            return <ShareLinkBubble key={key} label="Your Recommendation Link:" linkUrl={linkContent as string} />
        }

        return null;
      })}
    </>
  );
};

export default OnboardingSteps;