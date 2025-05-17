import React from 'react';
import { WorkerData } from '@/app/components/onboarding/WorkerCard';

export interface OnboardingStep {
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
  workerData?: WorkerData;
}