import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";

const PageLoading = ({ isVisible, message = "正在生成精讲内容..." }) => {
  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        className="page-loading-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
      >
        <motion.div
          className="page-loading-container"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          {/* 主要内容区 */}
          <div className="loading-content">
            {/* 中心loading区域 */}
            <div className="center-loading">
              {/* 外圈旋转环 */}
              <motion.div
                className="outer-ring"
                animate={{ rotate: 360 }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                <div className="ring-gradient"></div>
              </motion.div>

              {/* 中心图标 */}
              <motion.div
                className="center-icon"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <Brain size={40} />
              </motion.div>
            </div>
          </div>

          {/* 底部提示 */}
          <motion.div
            className="loading-tips"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <p>AI 正在深度分析您的文本内容</p>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PageLoading;
