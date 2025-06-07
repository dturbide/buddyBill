"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useTranslation } from "react-i18next"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  DollarSign, 
  Globe, 
  Users, 
  CreditCard, 
  BarChart, 
  Banknote, 
  LineChart, 
  CheckCircle, 
  ArrowRight, 
  ChevronRight, 
  Sparkles, 
  Shield, 
  Settings,
  Star,
  Quote,
  Hash,
  Calendar,
  CalendarCheck,
  UserCircle,
  Lock,
  Smartphone
} from 'lucide-react'
import InstallPWAInstructions from './install-pwa-instructions'

export default function LandingPage() {
  const { t, i18n } = useTranslation(['landing', 'common'])
  const [language, setLanguage] = useState(i18n.language)
  const router = useRouter()
  
  // Animation au défilement avec IntersectionObserver
  useEffect(() => {
    // Détection du défilement pour animer les éléments
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-reveal');
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    
    // Observer tous les éléments avec la classe reveal
    const elements = document.querySelectorAll('.reveal');
    elements.forEach((el) => observer.observe(el));
    
    return () => observer.disconnect();
  }, []);

  // Fonction pour changer la langue de l'interface
  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang)
    setLanguage(lang)
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-50 via-white to-indigo-50">
      {/* Header avec effet de verre */}
      <header className="border-b border-blue-100 bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-2.5 rounded-xl group-hover:shadow-lg transition-all duration-300">
              <DollarSign size={20} strokeWidth={2.5} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-transparent bg-clip-text group-hover:from-blue-700 group-hover:to-indigo-700 transition-all duration-300">BuddyBill</span>
          </Link>
          
          <div className="flex items-center gap-4">
            <Tabs defaultValue={language} className="w-[180px]">
              <TabsList className="grid w-full grid-cols-2 bg-blue-50">
                <TabsTrigger 
                  value="fr" 
                  onClick={() => changeLanguage("fr")}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                >
                  🇫🇷 FR
                </TabsTrigger>
                <TabsTrigger 
                  value="en" 
                  onClick={() => changeLanguage("en")}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                >
                  🇬🇧 EN
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2">
              <Button asChild variant="outline" size="sm" className="border-blue-200 hover:border-blue-400 hover:bg-blue-50 transition-all duration-300">
                <Link href="/signin">
                  {t("login", {ns: 'landing'})}
                </Link>
              </Button>
              
              <Button asChild size="sm" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm hover:shadow transition-all duration-300">
                <Link href="/signup">
                  {t("signup", {ns: 'landing'})}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Section Héros avec animations et effets visuels */}
        <section className="py-20 md:py-32 relative overflow-hidden">
          {/* Éléments de fond décoratifs */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-70"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-300 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-indigo-300 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-200 rounded-full blur-2xl opacity-30"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              {/* Contenu textuel de la section héros */}
              <div className="text-center lg:text-left reveal">
                <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 hover:bg-gradient-to-r hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  {t("new", {ns: 'landing'})}
                </Badge>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">
                  <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                    {t("hero.title", {ns: 'landing'})}
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl lg:max-w-none">
                  {t("hero.subtitle", {ns: 'landing'})}
                </p>
                
                {/* Boutons CTA */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
                  <Button 
                    asChild 
                    size="lg" 
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg px-8 py-3"
                  >
                    <Link href="/signup" className="inline-flex items-center gap-2">
                      {t("hero.cta", {ns: 'landing'})}
                      <ArrowRight className="h-5 w-5" />
                    </Link>
                  </Button>
                  
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 hover:text-blue-800 transition-all duration-300 text-lg px-8 py-3"
                  >
                    <Link href="/demo" className="inline-flex items-center gap-2">
                      {t("hero.demo", {ns: 'landing'})}
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </Button>
                </div>
                
                {/* Statistiques ou indicateurs de confiance */}
                <div className="flex flex-wrap gap-8 justify-center lg:justify-start text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>{t("hero.secure", {ns: 'landing'})}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span>{t("hero.users", {ns: 'landing'})}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span>{t("hero.rating", {ns: 'landing'})}</span>
                  </div>
                </div>
              </div>
              
              {/* Illustration ou capture d'écran de l'app */}
              <div className="relative reveal">
                <div className="relative mx-auto max-w-md lg:max-w-lg">
                  {/* Effets de fond pour l'image */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 rounded-3xl blur-xl transform rotate-3"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-3xl blur-2xl transform -rotate-2"></div>
                  
                  {/* Conteneur principal de l'image */}
                  <div className="relative bg-white rounded-3xl shadow-2xl overflow-hidden border border-blue-100 transform hover:rotate-1 transition-all duration-500">
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-2">
                      <div className="bg-white rounded-2xl overflow-hidden">
                        <Image 
                          src="/screenshots/mobile-dashboard.png" 
                          alt="BuddyBill App Interface" 
                          width={400} 
                          height={800}
                          className="w-full h-auto"
                          priority
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Éléments décoratifs flottants */}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-80 animate-bounce"></div>
                  <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-green-400 to-blue-400 rounded-full opacity-70 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section PWA Installation moderne */}
        <section className="py-16 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-200 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-200 rounded-full blur-3xl opacity-20"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            <InstallPWAInstructions />
          </div>
        </section>

        {/* Section Fonctionnalités principales */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-blue-50 opacity-50"></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-indigo-200 rounded-full blur-3xl opacity-10"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* En-tête de section */}
            <div className="text-center mb-20 reveal">
              <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-200 hover:bg-gradient-to-r hover:from-blue-200 hover:to-indigo-200 transition-all duration-300 inline-flex items-center gap-2">
                <Settings className="h-4 w-4" />
                {t("features.badge", {ns: 'landing'})}
              </Badge>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-transparent bg-clip-text">
                  {t("features.title", {ns: 'landing'})}
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t("features.subtitle", {ns: 'landing'})}
              </p>
            </div>
            
            {/* Grille de fonctionnalités */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                { 
                  icon: <Users className="h-8 w-8" />, 
                  key: "groups",
                  gradient: "from-blue-500 to-cyan-500"
                },
                { 
                  icon: <Globe className="h-8 w-8" />, 
                  key: "currency",
                  gradient: "from-green-500 to-emerald-500"
                },
                { 
                  icon: <CreditCard className="h-8 w-8" />, 
                  key: "expenses",
                  gradient: "from-purple-500 to-violet-500"
                },
                { 
                  icon: <BarChart className="h-8 w-8" />, 
                  key: "balances",
                  gradient: "from-orange-500 to-red-500"
                },
                { 
                  icon: <Banknote className="h-8 w-8" />, 
                  key: "settle",
                  gradient: "from-indigo-500 to-purple-500"
                },
                { 
                  icon: <LineChart className="h-8 w-8" />, 
                  key: "reports",
                  gradient: "from-teal-500 to-cyan-500"
                }
              ].map(({icon, key, gradient}, index) => (
                <Card 
                  key={key} 
                  className="group border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden reveal bg-white/80 backdrop-blur-sm" 
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-8">
                    {/* Icône avec gradient animé */}
                    <div className={`bg-gradient-to-br ${gradient} text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 mx-auto transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-lg`}>
                      {icon}
                    </div>
                    
                    <h3 className="text-xl font-bold mb-4 text-center text-gray-900 group-hover:text-blue-900 transition-colors duration-300">
                      {t(`features.${key}.title`, {ns: 'landing'})}
                    </h3>
                    
                    <p className="text-gray-600 text-center leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {t(`features.${key}.description`, {ns: 'landing'})}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section Problèmes et Solutions */}
        <section className="py-24 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
          <div className="absolute top-12 right-12 w-64 h-64 bg-blue-300 rounded-full mix-blend-multiply blur-3xl opacity-20"></div>
          <div className="absolute bottom-12 left-12 w-64 h-64 bg-indigo-300 rounded-full mix-blend-multiply blur-3xl opacity-20"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* En-tête de section */}
            <div className="text-center mb-20 reveal">
              <Badge className="mb-6 bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border-orange-200 hover:bg-gradient-to-r hover:from-orange-200 hover:to-red-200 transition-all duration-300 inline-flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                {t("problem.badge", {ns: 'landing'})}
              </Badge>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-transparent bg-clip-text">
                  {t("problem.title", {ns: 'landing'})}
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t("problem.subtitle", {ns: 'landing'})}
              </p>
            </div>
            
            {/* Comparaison Problèmes vs Solutions */}
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Colonne des défis */}
              <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 rounded-3xl border border-red-100 shadow-lg reveal">
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-br from-red-500 to-orange-500 text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Users className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-red-700">
                    {t("problem.challenges.title", {ns: 'landing'})}
                  </h3>
                </div>
                
                <ul className="space-y-6">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex gap-4 group hover:bg-red-50 p-4 rounded-xl transition-all duration-300">
                      <div className="bg-red-200 text-red-700 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 text-red-900">
                          {t(`problem.challenges.${i}.title`, {ns: 'landing'})}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {t(`problem.challenges.${i}.description`, {ns: 'landing'})}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              
              {/* Colonne des solutions */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-3xl border border-green-100 shadow-lg reveal">
                <div className="text-center mb-8">
                  <div className="bg-gradient-to-br from-green-500 to-emerald-500 text-white p-4 rounded-2xl w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-green-700">
                    {t("problem.solutions.title", {ns: 'landing'})}
                  </h3>
                </div>
                
                <ul className="space-y-6">
                  {[0, 1, 2].map((i) => (
                    <li key={i} className="flex gap-4 group hover:bg-green-50 p-4 rounded-xl transition-all duration-300">
                      <div className="bg-green-200 text-green-700 p-3 rounded-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <CheckCircle className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-lg mb-2 text-green-900">
                          {t(`problem.solutions.${i}.title`, {ns: 'landing'})}
                        </h4>
                        <p className="text-gray-700 leading-relaxed">
                          {t(`problem.solutions.${i}.description`, {ns: 'landing'})}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4 text-center mb-12">
            <h2 className="text-3xl font-bold text-blue-900 mb-4">
              {t("howItWorks.title")}
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
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

        {/* Section Témoignages */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-50"></div>
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-purple-200 rounded-full blur-3xl opacity-10"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-200 rounded-full blur-3xl opacity-10"></div>
          
          <div className="container mx-auto px-4 relative z-10">
            {/* En-tête de section */}
            <div className="text-center mb-20 reveal">
              <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800 border-purple-200 hover:bg-gradient-to-r hover:from-purple-200 hover:to-pink-200 transition-all duration-300 inline-flex items-center gap-2">
                <Quote className="h-4 w-4" />
                {t("testimonials.badge", {ns: 'landing'})}
              </Badge>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-transparent bg-clip-text">
                  {t("testimonials.title", {ns: 'landing'})}
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                {t("testimonials.subtitle", {ns: 'landing'})}
              </p>
            </div>
            
            {/* Grille de témoignages */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[0, 1, 2].map((i) => (
                <Card key={i} className="group border border-purple-100 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden reveal bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-8">
                    {/* Note étoilée */}
                    <div className="flex gap-1 mb-6">
                      {[...Array(5)].map((_, starIndex) => (
                        <Star key={starIndex} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      ))}
                    </div>
                    
                    {/* Citation */}
                    <blockquote className="text-gray-700 mb-6 leading-relaxed italic">
                      "{t(`testimonials.quotes.${i}.text`, {ns: 'landing'})}"
                    </blockquote>
                    
                    {/* Profil de l'utilisateur */}
                    <div className="flex items-center gap-4">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 text-white p-3 rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg">
                        {t(`testimonials.quotes.${i}.name`, {ns: 'landing'}).charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">
                          {t(`testimonials.quotes.${i}.name`, {ns: 'landing'})}
                        </p>
                        <p className="text-sm text-gray-500">
                          {t(`testimonials.quotes.${i}.role`, {ns: 'landing'})}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Section CTA Finale */}
        <section className="py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 text-white relative overflow-hidden">
          {/* Éléments décoratifs de fond */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600/80 to-purple-600/80"></div>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white rounded-full blur-3xl opacity-10"></div>
          <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-yellow-300 rounded-full blur-3xl opacity-20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white rounded-full blur-2xl opacity-5"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-4xl mx-auto reveal">
              <Badge className="mb-6 bg-white/20 text-white border-white/30 hover:bg-white/30 transition-all duration-300 inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                {t("cta.badge", {ns: 'landing'})}
              </Badge>
              
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {t("cta.title", {ns: 'landing'})}
              </h2>
              
              <p className="text-xl md:text-2xl text-blue-100 mb-12 leading-relaxed max-w-2xl mx-auto">
                {t("cta.subtitle", {ns: 'landing'})}
              </p>
              
              {/* Boutons CTA */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-white text-blue-700 hover:bg-gray-100 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg px-8 py-4"
                >
                  <Link href="/signup" className="inline-flex items-center gap-2">
                    {t("cta.primary", {ns: 'landing'})}
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                
                <Button 
                  asChild 
                  variant="outline" 
                  size="lg"
                  className="border-2 border-white/30 hover:border-white hover:bg-white/10 text-white transition-all duration-300 text-lg px-8 py-4"
                >
                  <Link href="/demo" className="inline-flex items-center gap-2">
                    {t("cta.secondary", {ns: 'landing'})}
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              </div>
              
              {/* Assurance additionnelle */}
              <div className="flex flex-wrap gap-8 justify-center text-sm text-blue-100">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-400" />
                  <span>{t("cta.guarantee.free", {ns: 'landing'})}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>{t("cta.guarantee.secure", {ns: 'landing'})}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-yellow-400" />
                  <span>{t("cta.guarantee.easy", {ns: 'landing'})}</span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer moderne */}
      <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white py-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-5"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Logo et description */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-6 group">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-2.5 rounded-xl group-hover:shadow-lg transition-all duration-300">
                  <DollarSign size={20} strokeWidth={2.5} />
                </div>
                <span className="text-xl font-bold">BuddyBill</span>
              </Link>
              <p className="text-gray-400 mb-6 leading-relaxed">
                {t("footer.tagline", {ns: 'landing'})}
              </p>
              <div className="flex gap-4">
                {/* Réseaux sociaux ou liens additionnels peuvent être ajoutés ici */}
              </div>
            </div>
            
            {/* Liens Produit */}
            <div>
              <h3 className="font-bold mb-6 text-lg">{t("footer.product.title", {ns: 'landing'})}</h3>
              <ul className="space-y-3">
                {["features", "pricing", "demo", "security"].map((item) => (
                  <li key={item}>
                    <Link 
                      href={`/${item}`} 
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {t(`footer.product.${item}`, {ns: 'landing'})}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Liens Entreprise */}
            <div>
              <h3 className="font-bold mb-6 text-lg">{t("footer.company.title", {ns: 'landing'})}</h3>
              <ul className="space-y-3">
                {["about", "blog", "careers", "contact"].map((item) => (
                  <li key={item}>
                    <Link 
                      href={`/${item}`} 
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {t(`footer.company.${item}`, {ns: 'landing'})}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Liens Légal */}
            <div>
              <h3 className="font-bold mb-6 text-lg">{t("footer.legal.title", {ns: 'landing'})}</h3>
              <ul className="space-y-3">
                {["terms", "privacy", "cookies"].map((item) => (
                  <li key={item}>
                    <Link 
                      href={`/${item}`} 
                      className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center gap-2 group"
                    >
                      <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      {t(`footer.legal.${item}`, {ns: 'landing'})}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          {/* Ligne de copyright */}
          <div className="border-t border-gray-800 pt-8 text-center">
            <p className="text-gray-500 flex items-center justify-center gap-2">
              &copy; {new Date().getFullYear()} BuddyBill. {t("footer.copyright", {ns: 'landing'})}
              <span className="text-red-500">&hearts;</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
