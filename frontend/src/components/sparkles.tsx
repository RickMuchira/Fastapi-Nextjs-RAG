"use client"

import { useRef, useEffect, useState } from "react"
import { useTheme } from "next-themes"

export const SparklesCore = ({
  id,
  background,
  minSize,
  maxSize,
  particleDensity,
  className,
  particleColor,
}: {
  id: string
  background?: string
  minSize?: number
  maxSize?: number
  particleDensity?: number
  className?: string
  particleColor?: string
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [mouse, setMouse] = useState({ x: 0, y: 0 })
  const { theme } = useTheme()

  const particles = useRef<any[]>([])
  const animationRef = useRef<number>()

  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d")
      if (ctx) {
        const handleResize = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current
            const rect = canvas.getBoundingClientRect()
            setWidth(rect.width)
            setHeight(rect.height)
            canvas.width = rect.width
            canvas.height = rect.height
          }
        }

        const handleMouseMove = (e: MouseEvent) => {
          if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect()
            setMouse({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            })
          }
        }

        handleResize()
        window.addEventListener("resize", handleResize)
        window.addEventListener("mousemove", handleMouseMove)

        return () => {
          window.removeEventListener("resize", handleResize)
          window.removeEventListener("mousemove", handleMouseMove)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (width && height) {
      particles.current = []
      const particleCount = Math.floor((width * height) / (particleDensity || 10000))

      for (let i = 0; i < particleCount; i++) {
        particles.current.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * (maxSize || 3) + (minSize || 1),
          speedX: Math.random() * 0.5 - 0.25,
          speedY: Math.random() * 0.5 - 0.25,
        })
      }
    }
  }, [width, height, minSize, maxSize, particleDensity])

  useEffect(() => {
    if (canvasRef.current && width && height) {
      const ctx = canvasRef.current.getContext("2d")
      if (!ctx) return

      const animate = () => {
        ctx.clearRect(0, 0, width, height)

        // Draw particles
        particles.current.forEach((particle) => {
          // Move particles
          particle.x += particle.speedX
          particle.y += particle.speedY

          // Wrap around edges
          if (particle.x > width) particle.x = 0
          if (particle.x < 0) particle.x = width
          if (particle.y > height) particle.y = 0
          if (particle.y < 0) particle.y = height

          // Calculate distance from mouse
          const dx = mouse.x - particle.x
          const dy = mouse.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          // Adjust particle based on mouse proximity
          if (distance < 100) {
            const angle = Math.atan2(dy, dx)
            particle.x -= Math.cos(angle) * 0.5
            particle.y -= Math.sin(angle) * 0.5
          }

          // Draw particle
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fillStyle = particleColor || (theme === "dark" ? "#ffffff" : "#000000")
          ctx.globalAlpha = 0.2
          ctx.fill()
        })

        animationRef.current = requestAnimationFrame(animate)
      }

      animate()

      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [width, height, mouse, particleColor, theme])

  return (
    <canvas
      ref={canvasRef}
      id={id}
      className={className}
      style={{
        background: background || "transparent",
      }}
    />
  )
}
