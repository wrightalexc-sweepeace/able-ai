'use client';

import styles from './EditableSkillPage.module.css';
import { Star, Trophy, Martini } from 'lucide-react';
import CloseButton from '@/app/components/profile/CloseButton';
import SkillSplashScreen from '@/app/components/profile/SkillSplashScreen';


const profile = {
  name: "Benji",
  title: "Bartender",
  hashtags: "#Licensedbarmanager #customerservice #timemanagement #mixology",
  customerReviewsText: "Professional, charming and lively",
  ableGigs: 15,
  experienceYears: 8,
  Eph: 15,
  statistics: {
    reviews: 13,
    paymentsCollected: '£4899',
    tipsReceived: '£767'
  },
  supportingImages: [
    "/images/bar-action.svg",
    "/images/bar-action.svg",
  ],
  badges: [
    { id: "a1", icon: Trophy, textLines: ["Mixology Master"] },
    { id: "a2", icon: Star, textLines: ["Customer Favourite"] },
    { id: "a3", icon: Martini, textLines: ["Creative Cocktails"] }
   
  ],
  qualifications: [
    "Bachelor’s Degree in Graphic Design",
    "Licensed bar manager",
    "Cocktail preparation diploma"
  ],
  buyerReviews: [
    {
      name: "Alex Johnson",
      date: "2023-10-15",
      text: "Amazing skills and great personality. The cocktails were fantastic!"
    },
    {
      name: "Maria Gomez",
      date: "2023-09-20",
      text: "Very professional and friendly. Made our event a success!"
    },
    {
      name: "Chris Lee",
      date: "2023-08-05",
      text: "Highly recommended! The drinks were as delightful as the service."
    }
  ],
  recommendation: {
    name: "Dave Smith",
    date: "2023-10-15",
    text: "Brilliant bartender, great to work with!"
  }
};

const SkillProfileScreen = () => { 
  return (
    <div className={styles.container}>
      <CloseButton />
      <SkillSplashScreen profile={profile} />
    </div>
  );
};

export default SkillProfileScreen;
