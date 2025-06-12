"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Share2, Twitter, MessageCircle, Copy } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Quiz } from "@/lib/types/quiz"

interface ShareButtonProps {
  quiz: Quiz
  score?: number
  total?: number
}

export default function ShareButton({ quiz, score = 1, total = 1 }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)

  const shareText = `I just scored ${score}/${total} on "${quiz.question}" in QuizEdu! 🎓✨ #QuizEdu #Learning`
  const shareUrl = typeof window !== "undefined" ? window.location.href : ""

  const handleTwitterShare = () => {
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    window.open(twitterUrl, "_blank")
  }

  const handleWhatsAppShare = () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`
    window.open(whatsappUrl, "_blank")
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareUrl}`)
      // You could show a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "QuizEdu",
          text: shareText,
          url: shareUrl,
        })
      } catch (err) {
        console.error("Error sharing:", err)
      }
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Share2 className="w-4 h-4" />
          </Button>
        </motion.div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-gray-900 border-gray-700">
        <DropdownMenuItem onClick={handleTwitterShare} className="text-white hover:bg-gray-800">
          <Twitter className="w-4 h-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleWhatsAppShare} className="text-white hover:bg-gray-800">
          <MessageCircle className="w-4 h-4 mr-2" />
          Share on WhatsApp
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleCopyLink} className="text-white hover:bg-gray-800">
          <Copy className="w-4 h-4 mr-2" />
          Copy Link
        </DropdownMenuItem>
        {navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="text-white hover:bg-gray-800">
            <Share2 className="w-4 h-4 mr-2" />
            More Options
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
