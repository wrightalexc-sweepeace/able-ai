'use client';

import React, { use } from 'react';
import styles from './EditableSkillPage.module.css';
import { Star, MessageSquare, CreditCard, Coins, Award, Paperclip, Trophy, Martini } from 'lucide-react';
import Image from 'next/image';

const profile = {
  name: "Benji",
  title: "Bartender",
  hashtags: [
    "#Licensedbarmanager",
    "#customerservice",
    "#timemanagement",
    "#mixology"
  ],
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

import { useParams } from 'next/navigation';
import AwardDisplayBadge from '@/app/components/profile/AwardDisplayBadge';
import ReviewCardItem from '@/app/components/shared/ReviewCardItem';
import RecommendationCardItem from '@/app/components/shared/RecommendationCardItem';

const SkillSplashScreen = () => {
  const params = useParams();
  const skill = params?.skillId as string;

  const handleAddImage = () => {
    // Logic to handle adding an image
    // open file picker or modal to select an image
    console.log("Add image button clicked");
  }
  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Image src="/images/benji.jpeg" alt="Profile picture" width={115} height={86} className={styles.profileImage} />
        <h2 className={styles.name}>{profile.name}: {skill}</h2>
        <Star className={styles.icon} />
      </div>

      {/* Hashtags */}
      <div className={styles.hashtags}>
        {profile.hashtags}
      </div>

      {/* Customer reviews */}
      <p className={styles.review}>
        Customer reviews: {profile.customerReviewsText}
      </p>

      <table className={styles.skillDisplayTable}>
        <thead>
          <tr>
            <th>Able Gigs</th>
            <th>Experience</th>
            <th>£ph</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{profile.ableGigs}</td>
            <td>{profile.experienceYears} years</td>
            <td>£{profile.Eph}</td>
          </tr>
        </tbody>
      </table>

      {/* Statistics */}
      <div className={styles.section}>
        <h3>{profile.name}’s statistics</h3>
        <div className={styles.statistics}>
          <div className={styles.stats}>
            <Image src="/images/reviews.svg" alt="Reviews" width={27} height={32} />
            <p>{profile.statistics.reviews}<span>Customer reveiws</span></p>
          </div>
          <div className={styles.stats}>
            <Image src="/images/payments.svg" alt="Payments" width={38} height={31} />
            <p>{profile.statistics.paymentsCollected}<span>Payments collceted</span></p>
          </div>
          <div className={styles.stats}>
            <Image src="/images/tips.svg" alt="Tips" width={46} height={30} />
            <p>{profile.statistics.tipsReceived}<span>Tips received</span></p>
          </div>
        </div>
      </div>

      {/* Image placeholders */}
      <div className={styles.supportingImages}>
        <div className={styles.images}>
          { profile.supportingImages.map((image, index) => (
              <Image key={index} src={image} alt={`Supporting image ${index + 2}`} width={109} height={68} />
          ))}
        </div>
        <button className={styles.attachButton} onClick={handleAddImage}>
          <Paperclip size={29} color='#ffffff'/>
        </button>
        <input type="file" accept="image/*" className={styles.hiddenInput} />
      </div>

      {/* Badges */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Badges Awarded</h3>
        <div className={styles.badges}>
          
            {profile.badges.map((badge) => {
              return (
                <div className={styles.badge} key={badge.id}>
                  <AwardDisplayBadge
                    icon={badge.icon}
                    textLines={badge.textLines}
                  />
                </div>
            )})}   
        </div>
      </div>

      {/* Qualifications */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Qualifications and training:</h3>
        <ul className={styles.list}>
          <li>Bachelor’s Degree in Graphic Design</li>
          <li>Licensed bar manager</li>
          <li>Cocktail preparation diploma</li>
        </ul>
      </div>

      {/* Buyer Reviews */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Buyer Reviews</h3>
        {
          profile.buyerReviews.map((review, index) => (
            // <div className={styles.reviewCard} key={index}>
            //   <p><strong>{review.name} - {review.date}</strong></p>
            //   <p>“{review.text}”</p>
            // </div>
            <ReviewCardItem key={index} reviewerName={review.name} date={review.date} comment={review.text} />
          ))
        }
      </div>

      {/* Recommendations */}
      <div className={styles.section}>
        <h3 className={styles.sectionTitle}>Recommendations</h3>
        {
          profile.recommendation && (
            <RecommendationCardItem
              recommenderName={profile.recommendation.name}
              date={profile.recommendation.date}
              comment={profile.recommendation.text}
            />
          )
        }
      </div>
    </div>
  );
};

export default SkillSplashScreen;
