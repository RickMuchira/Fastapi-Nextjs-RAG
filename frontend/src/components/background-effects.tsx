"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { FileText } from "lucide-react"
import { SparklesCore } from "@/components/sparkles"

export default function BackgroundEffects() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      <SparklesCore
        id="sparkles"
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={15}
        className="w-full h-full"
        particleColor="#888"
      />
      <FloatingPaper />
    </div>
  )
}

function FloatingPaper() {
  const [papers, setPapers] = useState<{ id: number; x: number; y: number; rotation: number; scale: number }[]>([])

  useEffect(() => {
    // Create 10 random paper icons
    const newPapers = Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      scale: 0.8 + Math.random() * 0.4,
    }))

    setPapers(newPapers)
  }, [])

  return (
    <>
      {papers.map((paper) => (
        <motion.div
          key={paper.id}
          className="absolute text-muted-foreground/20"
          style={{
            left: `${paper.x}%`,
            top: `${paper.y}%`,
          }}
          initial={{ rotate: paper.rotation, scale: paper.scale }}
          animate={{
            y: [0, -20, 0],
            rotate: [paper.rotation, paper.rotation + 10, paper.rotation],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "reverse",
          }}
          whileHover={{ scale: paper.scale * 1.2, opacity: 0.8 }}
        >
          <FileText size={24 + (paper.id % 3) * 8} />
        </motion.div>
      ))}
    </>
  )
}
