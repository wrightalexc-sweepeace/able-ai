import React from 'react';
import Image from 'next/image'; // Import NextImage
import pageStyles from './WorkerCard.module.css'; // Will create this CSS module

// Define WorkerData interface (can be shared or moved to a types file)
export interface WorkerData {
    name: string;
    title: string;
    gigs: number;
    experience: string;
    keywords: string;
    hourlyRate: number;
    totalHours: number;
    totalPrice: number;
    ableFees: string;
    stripeFees: string;
    imageSrc: string;
}

interface WorkerCardProps {
    worker: WorkerData;
    onBook: (name: string, price: number) => void;
}

const WorkerCard: React.FC<WorkerCardProps> = ({ worker, onBook }) => {
    return (
        <div className={pageStyles.workerCard}>
            {/* Use Next/Image for optimized images */}
            <Image 
              src={worker.imageSrc} 
              alt={worker.name} 
              width={100} // Provide appropriate width
              height={100} // Provide appropriate height
              className={pageStyles.workerImage} 
              onError={(e) => { (e.target as HTMLImageElement).src = "/images/default-avatar.png"; }} // Fallback
            />
            <div className={pageStyles.workerInfo}>
                <h3>{worker.name}</h3>
                <p>{worker.title}, {worker.gigs} Able gigs, {worker.experience}</p>
                <p>Client review keywords: {worker.keywords}</p>
                <p>{worker.totalHours} hours @£{worker.hourlyRate.toFixed(2)}/hr, total £{worker.totalPrice.toFixed(2)}</p>
                <p>fees: Able {worker.ableFees}</p>
                <p>Stripe {worker.stripeFees}</p>
                <button onClick={() => onBook(worker.name, worker.totalPrice)} className={pageStyles.bookButton}>
                    Yes! Book £{worker.totalPrice.toFixed(2)}
                </button>
            </div>
        </div>
    );
};

export default WorkerCard;