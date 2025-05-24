"use client"

import { motion } from "framer-motion"

/**
 * Three bouncing dots shown **outside** the chat history
 * whenever `isLoading` is true.  No extra text.
 */
export default function TypingIndicator() {
  const dotAnim = {
    y: [0, -6, 0],
    opacity: [0.4, 1, 0.4],
  }
  const dotTransition = {
    duration: 0.8,
    repeat: Infinity,
    ease: "easeInOut",
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex gap-1 px-4 py-2"
    >
      {[0, 0.15, 0.3].map((delay) => (
        <motion.span
          key={delay}
          className="w-2 h-2 rounded-full bg-purple-400"
          animate={dotAnim}
          transition={{ ...dotTransition, delay }}
        />
      ))}
    </motion.div>
  )
}
