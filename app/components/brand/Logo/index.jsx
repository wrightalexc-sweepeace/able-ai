import React from 'react';
import Image from 'next/image';
import styles from './Logo.module.css';

const Logo = () => {
  return (
    <Image
      src="/images/ableai2.jpeg"
      alt="App Logo"
      width={250}
      height={260}
      className={styles.logo}
    />
  );
};
export default Logo;