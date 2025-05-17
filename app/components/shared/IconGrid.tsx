// app/components/shared/IconGrid.jsx
import React from 'react';
import Link from 'next/link'; // For navigation
import styles from './IconGrid.module.css';

// Item interface: { label: string, icon: React.ReactNode, to: string (path) }
interface Item {
  label: string;
  icon: React.ReactNode;
  to: string;
}
const IconGrid = ({ items = [] }: { items: Item[] }) => {
  return (
    <div className={styles.grid}>
      {items.map((item) => (
        <Link href={item.to} key={item.label} className={styles.card}>
          <div className={styles.iconWrapper}>{item.icon}</div>
          <span className={styles.label}>{item.label}</span>
        </Link>
      ))}
    </div>
  );
};
export default IconGrid;