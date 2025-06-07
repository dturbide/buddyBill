// No changes needed
"use client"

import { useState, useEffect, useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import type { EmblaOptionsType } from "embla-carousel"
import Autoplay from "embla-carousel-autoplay"
import { Button } from "@/components/ui/button"
import { Zap, BarChartBig, CreditCard } from "lucide-react"
import Link from "next/link"

const onboardingSlides = [
  {
    icon: Zap,
    title: "Split expenses easily",
    description: "Share bills and IOUs with friends, family, and roommates effortlessly.",
    bgColor: "bg-sky-500",
  },
  {
    icon: BarChartBig,
    title: "Track who owes what",
    description: "Get a clear overview of balances and see who needs to settle up, all in real-time.",
    bgColor: "bg-emerald-500",
  },
  {
    icon: CreditCard,
    title: "Settle up with ease",
    description: "Integrated options to record payments and clear debts quickly and simply.",
    bgColor: "bg-purple-500",
  },
]

const OPTIONS: EmblaOptionsType = { loop: true }

export default function WelcomeScreen() {
  const [emblaRef, emblaApi] = useEmblaCarousel(OPTIONS, [Autoplay({ delay: 4000, stopOnInteraction: true })])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const updateCurrentSlide = useCallback(() => {
    if (emblaApi) {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
  }, [emblaApi])

  useEffect(() => {
    if (emblaApi) {
      emblaApi.on("select", updateCurrentSlide)
      updateCurrentSlide()
    }
  }, [emblaApi, updateCurrentSlide])

  const handleSkip = () => {
    console.log("Skip onboarding")
    alert("Onboarding skipped. Navigating to login...")
  }

  return (
    <div className="w-full max-w-md h-[800px] max-h-[90vh] bg-gray-800 shadow-2xl rounded-3xl overflow-hidden flex flex-col relative">
      <div className="absolute top-4 right-4 z-20">
        <Button variant="ghost" onClick={handleSkip} className="text-white hover:bg-white/20 hover:text-white">
          Skip
        </Button>
      </div>
      <div className="overflow-hidden flex-grow" ref={emblaRef}>
        <div className="flex h-full">
          {onboardingSlides.map((slide, index) => (
            <div
              key={index}
              className={`flex-grow-0 flex-shrink-0 w-full h-full flex flex-col items-center justify-center text-center p-8 md:p-12 text-white ${slide.bgColor}`}
            >
              <slide.icon className="h-20 w-20 md:h-24 md:w-24 mb-6 text-white/80" />
              <h2 className="text-2xl md:text-3xl font-bold mb-3">{slide.title}</h2>
              <p className="text-sm md:text-base text-white/90 max-w-xs">{slide.description}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 pt-2 bg-gray-800 z-10">
        <div className="flex justify-center space-x-2 mb-6">
          {onboardingSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => emblaApi?.scrollTo(index)}
              className={`h-2 w-2 rounded-full transition-all duration-300 ${
                index === selectedIndex ? "bg-white w-6" : "bg-gray-500"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        <div className="space-y-3">
          <Link href="/signup" className="w-full">
            <Button size="lg" className="w-full bg-sky-500 hover:bg-sky-600 text-white h-12 text-base">
              Sign Up
            </Button>
          </Link>
          <Link href="/signin" className="w-full">
            <Button
              variant="outline"
              size="lg"
              className="w-full border-gray-600 bg-gray-800 text-white hover:bg-gray-700 hover:text-white h-12 text-base"
            >
              Log In
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
WelcomeScreen.defaultProps = {}
