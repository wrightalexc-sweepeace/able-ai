import React from 'react';
import Image from 'next/image';
import styles from './Logo.module.css';

const Logo = () => {
  return (
    <Image
      src="/images/ableai.jpeg"
      alt="App Logo"
      width={280}
      height={280}
      className={styles.logo}
    />
  );
};
export default Logo;