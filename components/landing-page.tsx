"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import InstallPWAInstructions from "./install-pwa-instructions"
import {
  Users,
  CreditCard,
  Globe,
  CheckCircle,
  ArrowRight,
  DollarSign,
  BarChart,
  Smartphone,
} from "lucide-react"

export default function LandingPage() {
  const { t, i18n } = useTranslation()
  const [language, setLanguage] = useState(i18n.language)
  const router = useRouter()

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-500 text-white p-1.5 rounded-lg">
              <DollarSign size={20} />
            </div>
            <span className="text-xl font-bold text-blue-900">BuddyBill</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Tabs defaultValue={language} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fr" onClick={() => changeLanguage("fr")}>
                  🇫🇷 FR
                </TabsTrigger>
                <TabsTrigger value="en" onClick={() => changeLanguage("en")}>
                  🇬🇧 EN
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <Button asChild variant="default" size="sm">
              <Link href="/signin">
                {t("login")}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 md:py-20">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <Badge className="mb-4">{t("new")}</Badge>
              <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
                {t("hero.title")}
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                {t("hero.subtitle")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button asChild size="lg" className="gap-2">
                  <Link href="/signup">
                    {t("hero.cta")} <ArrowRight size={18} />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/dashboard/demo">
                    {t("hero.demo")}
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -z-10 inset-0 bg-blue-100 rounded-full blur-3xl opacity-30"></div>
              <div className="bg-white border rounded-2xl shadow-xl overflow-hidden">
                <Image 
                  src="/screenshots/mobile-dashboard.png" 
                  alt="BuddyBill App" 
                  width={390} 
                  height={844}
                  className="w-full h-auto"
                  priority
                />
              </div>
            </div>
          </div>
        </section>

        {/* PWA Installation */}
        <section className="py-8 bg-blue-50">
          <div className="container mx-auto px-4">
            <InstallPWAInstructions />
          </div>
        </section>

        {/* Problem & Solution */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              {t("problem.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("problem.description")}
            </p>
          </div>
          
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-red-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-red-700 mb-4">
                {t("problem.challenges.title")}
              </h3>
              <ul className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-red-500 mt-1">❌</span>
                    <span>{t(`problem.challenges.item${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-green-50 p-6 rounded-xl">
              <h3 className="text-xl font-semibold text-green-700 mb-4">
                {t("problem.solution.title")}
              </h3>
              <ul className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 h-5 w-5 mt-0.5 shrink-0" />
                    <span>{t(`problem.solution.item${i}`)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-16 bg-blue-50">
          <div className="container mx-auto px-4 text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              {t("features.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("features.subtitle")}
            </p>
          </div>
          
          <div className="container mx-auto px-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Users className="h-8 w-8" />, key: "groups" },
              { icon: <Globe className="h-8 w-8" />, key: "currency" },
              { icon: <CreditCard className="h-8 w-8" />, key: "expenses" },
              { icon: <BarChart className="h-8 w-8" />, key: "balance" },
              { icon: <Smartphone className="h-8 w-8" />, key: "mobile" },
              { icon: <CheckCircle className="h-8 w-8" />, key: "simple" }
            ].map((feature, i) => (
              <Card key={i} className="border-none shadow-lg">
                <CardContent className="pt-6">
                  <div className="bg-blue-100 text-blue-700 p-3 rounded-full w-fit mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {t(`features.${feature.key}.title`)}
                  </h3>
                  <p className="text-gray-600">
                    {t(`features.${feature.key}.description`)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("howItWorks.subtitle")}
            </p>
          </div>
          
          <div className="container mx-auto px-4 max-w-4xl">
            <div className="relative">
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-blue-200 hidden md:block"></div>
              
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex flex-col md:flex-row gap-8 mb-12">
                  <div className="flex-shrink-0 flex items-center justify-center">
                    <div className="bg-blue-500 text-white h-16 w-16 rounded-full flex items-center justify-center text-xl font-bold z-10">
                      {step}
                    </div>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-xl font-semibold mb-2">
                      {t(`howItWorks.steps.step${step}.title`)}
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {t(`howItWorks.steps.step${step}.description`)}
                    </p>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <p className="text-sm italic text-blue-700">
                        {t(`howItWorks.steps.step${step}.tip`)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="container mx-auto px-4 text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              {t("testimonials.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {t("testimonials.subtitle")}
            </p>
          </div>
          
          <div className="container mx-auto px-4 grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-white">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-1 text-yellow-400 mb-4">
                    {"★★★★★".split("").map((star, i) => (
                      <span key={i}>{star}</span>
                    ))}
                  </div>
                  <p className="italic text-gray-600 mb-6">
                    "{t(`testimonials.quotes.${i}.text`)}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 h-10 w-10 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-semibold">
                        {t(`testimonials.quotes.${i}.name`).charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {t(`testimonials.quotes.${i}.name`)}
                      </p>
                      <p className="text-sm text-gray-500">
                        {t(`testimonials.quotes.${i}.role`)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-blue-600 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">
              {t("cta.title")}
            </h2>
            <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">
              {t("cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary" className="gap-2">
                <Link href="/signup">
                  {t("cta.primary")} <ArrowRight size={18} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="text-white border-white hover:bg-blue-700">
                <Link href="/dashboard/demo">
                  {t("cta.secondary")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-white p-1.5 rounded-lg">
                  <DollarSign size={18} className="text-blue-600" />
                </div>
                <span className="text-xl font-bold">BuddyBill</span>
              </div>
              <p className="text-gray-400 mb-4">
                {t("footer.tagline")}
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">{t("footer.product.title")}</h3>
              <ul className="space-y-2">
                {["features", "pricing", "demo", "security"].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-gray-400 hover:text-white transition">
                      {t(`footer.product.${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">{t("footer.company.title")}</h3>
              <ul className="space-y-2">
                {["about", "blog", "careers", "contact"].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-gray-400 hover:text-white transition">
                      {t(`footer.company.${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">{t("footer.legal.title")}</h3>
              <ul className="space-y-2">
                {["terms", "privacy", "cookies"].map((item) => (
                  <li key={item}>
                    <Link href={`/${item}`} className="text-gray-400 hover:text-white transition">
                      {t(`footer.legal.${item}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-500">
            <p>© {new Date().getFullYear()} BuddyBill. {t("footer.copyright")}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
