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
    workerData?: WorkerData; // Added workerData to step
  }

const baseInitialSteps: OnboardingStep[] = [
    { id: 1, type: 'botMessage', content: "Hi! Tell me about yourself and what gig or gigs you need filling - we can assemble a team if you need one!" },
    { id: 2, type: 'botMessage', content: "We have some great bartenders available. Do you need any special skills or do you have instructions for your hire?", dependsOn: 1 },
    {
      id: 3, type: 'userInput', inputType: 'textarea', inputName: 'additionalInstructions',
      inputPlaceholder: 'e.g., Cocktail making experience would be ideal', inputLabel: 'Additional Instructions:', dependsOn: 2
    },
    { id: 4, type: 'botMessage', content: "How much you would like to pay per hour? We suggest £15 plus tips to keep a motivated and happy team!", dependsOn: 3 },
    {
      id: 5, type: 'userInput', inputType: 'number', inputName: 'hourlyRate',
      inputPlaceholder: '£15', inputLabel: 'Hourly Rate:', dependsOn: 4
    },
    { id: 6, type: 'botMessage', content: "Where is the gig? What time and day do you need someone and for how long?", dependsOn: 5 },
    {
      id: 7, type: 'userInput', inputType: 'text', inputName: 'gigLocation',
      inputPlaceholder: 'e.g., The Green Tavern, Rye Lane, Peckham, SE15 5AR', inputLabel: 'Gig Location:', dependsOn: 6
    },
    {
      id: 8, type: 'userInput', inputType: 'date', inputName: 'gigDate',
      inputLabel: 'Date of Gig:', dependsOn: 7
    },
    { id: 9, type: 'discountCode', content: "I have a discount code 2FREEABLE", dependsOn: 8}, // This will be rendered as a MessageBubble
    { id: 10, type: 'botMessage', content: "Thankyou! We will apply your discount code", dependsOn: 9 },
    { id: 11, type: 'botMessage', content: "Here are our incredible available gig workers ready to accept your gig. Click on their profile for an indepth look at their gigfolio or simply book now", dependsOn: 10 },
    {
          id: 12,
          type: 'workerCard',
          dependsOn: 11,
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
              imageSrc: '/images/benji.jpeg', // Replace with actual image URL
          }
      },
      {
          id: 13,
          type: 'workerCard',
          dependsOn: 11, // Should depend on the previous message, not the previous card for parallel display
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
              imageSrc: '/images/jessica.jpeg', // Replace with actual image URL
          }
      },
  ];

  export default baseInitialSteps;