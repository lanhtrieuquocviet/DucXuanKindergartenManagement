import { motion } from 'framer-motion';
import styles from '../assets/styles/CoverScreen.module.css';
import logoCover from '../assets/images/logo_cover.png';
import backgroundImage from '../assets/images/background_cover.png';
import { useNavigate } from 'react-router-dom';
const DecorativeLine = ({ delay }) => (
    <motion.div
        className={styles.decorativeLine}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: '100%', opacity: 1 }}
        transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    />
);

const CoverScreen = () => {
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.25 } } };
    const itemVariants = { hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1, transition: { duration: 0.7, ease: 'easeOut' } } };
    const containerStyle = { backgroundImage: `url(${backgroundImage})` };
    const navigate = useNavigate();
    const handleDiscoverClick = () => {
        // DÒNG 3: ĐIỀU HƯỚNG TỚI SCREEN 2 KHI CLICK
        navigate('/screen-2');
    };
    return (
        <motion.div
            className={styles.container}
            style={containerStyle}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {/* --- BẮT ĐẦU KHỐI BỌC MỚI --- */}
            <motion.div
                className={styles.contentWrapper}
                variants={itemVariants} // Áp dụng animation cho cả khối
            >
                <motion.img
                    src={logoCover}
                    alt="Logo E-book"
                    className={styles.lotusIcon}
                />

                <motion.h1 className={styles.title}>
                    VIỆT NAM
                </motion.h1>

                <motion.p className={styles.subtitle}>
                    HÀNH TRÌNH VƯƠN RA BIỂN LỚN
                </motion.p>

                <motion.button
                    className={styles.ctaButton}
                    onClick={handleDiscoverClick}
                >
                    KHÁM PHÁ
                </motion.button>

            </motion.div>
            {/* --- KẾT THÚC KHỐI BỌC MỚI --- */}
        </motion.div>
    );
};

export default CoverScreen;
