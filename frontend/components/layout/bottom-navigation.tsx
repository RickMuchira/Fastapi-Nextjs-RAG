"use client"

import { useRouter, usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { Home, BookOpen, User } from "lucide-react"

const navItems = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BookOpen, label: "Topics", path: "/topics" },
  { icon: User, label: "Profile", path: "/profile" },
]

export default function BottomNavigation() {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-sm border-t border-white/10 z-50"
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.path

          return (
            <motion.button
              key={item.path}
              onClick={() => router.push(item.path)}
              className="flex flex-col items-center py-2 px-4 relative"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Icon className={`w-6 h-6 ${isActive ? "text-purple-500" : "text-gray-400"}`} />
              <span className={`text-xs mt-1 ${isActive ? "text-purple-500" : "text-gray-400"}`}>{item.label}</span>

              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-1/2 w-8 h-0.5 bg-purple-500 rounded-full"
                  layoutId="activeTab"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  style={{ x: "-50%" }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
