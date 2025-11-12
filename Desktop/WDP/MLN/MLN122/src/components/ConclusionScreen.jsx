// src/components/ConclusionScreen.jsx - PHIÊN BẢN NÂNG CẤP

import React from 'react';
import { motion } from 'framer-motion';
import styles from '../assets/styles/ConclusionScreen.module.css';

// Import ảnh nền (giống trang bìa) và ảnh chủ đạo
import backgroundImage from '../assets/images/background_cover.png'; 
import futureMap from '../assets/images/conclusion.png'; 



const ConclusionScreen = () => {
  const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }};
  const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { staggerChildren: 0.2, delayChildren: 0.3 } }};
  
  // Áp dụng style ảnh nền
  const containerStyle = { backgroundImage: `url(${backgroundImage})` };


  return (
    <motion.div
      className={styles.container}
      style={containerStyle} // Thêm style ảnh nền
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* --- BẮT ĐẦU CARD NỘI DUNG --- */}
      <motion.div className={styles.contentCard} variants={itemVariants}>
        <motion.img 
          src={futureMap} 
          alt="Việt Nam hướng tới tương lai" 
          className={styles.futureMap}
          variants={itemVariants}
        />
        
        <motion.h1 className={styles.title} variants={itemVariants}>
          HÀNH TRÌNH TIẾP NỐI
        </motion.h1>

        <motion.p className={styles.conclusionText} variants={itemVariants}>
          Hành trình hội nhập của Việt Nam là một câu chuyện về tầm nhìn và sự kiên định. 
          Với nền tảng vững chắc đã xây dựng, tương lai đang được định hình bởi 
          đổi mới sáng tạo, kinh tế xanh và khát vọng vươn tầm trên bản đồ kinh tế toàn cầu.
        </motion.p>

      
        <motion.div className={styles.credits} variants={itemVariants}>
          <a href="#sources">Nguồn Tham Khảo & Dữ Liệu</a>
        </motion.div>

      </motion.div>
      {/* --- KẾT THÚC CARD NỘI DUNG --- */}
    </motion.div>
  );
};

export default ConclusionScreen;