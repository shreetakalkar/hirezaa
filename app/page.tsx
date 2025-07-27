'use client'

import { AnimatePresence } from "framer-motion"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Briefcase, Users, Target, Zap, Shield, BarChart, CheckCircle, ArrowRight, Star, Award, Rocket, TrendingUp, Building2 } from "lucide-react";
import { motion } from "framer-motion";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOut equivalent
    },
  },
};

const fadeInLeft = {
  hidden: { opacity: 0, x: -30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOut equivalent
    },
  },
};

const fadeInRight = {
  hidden: { opacity: 0, x: 30 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOut equivalent
    },
  },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
};

const cardHover = {
  hover: {
    scale: 1.05,
    y: -10,
    boxShadow: "0 20px 40px rgba(99, 102, 241, 0.15)",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOut equivalent
    },
  },
};

const buttonHover = {
  hover: {
    scale: 1.05,
    boxShadow: "0 10px 25px rgba(99, 102, 241, 0.3)",
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94], // easeOut equivalent
    },
  },
};

const floatingAnimation = {
  floating: {
    y: [0, -20, 0],
    transition: {
      duration: 6,
      repeat: Infinity,
      ease: "easeInOut",
      times: [0, 0.5, 1],
    },
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-x-hidden">
      <Header />

      {/* Hero Section */}
      <motion.section
        className="relative container mx-auto px-4 py-20 sm:py-32 text-center"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-10 blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-400 to-indigo-500 rounded-full opacity-10 blur-3xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto">
          <motion.div
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-8"
            variants={fadeInUp}
          >
            <Rocket className="w-4 h-4 mr-2" />
            🚀 Revolutionizing the Future of Hiring
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-8 leading-tight"
            variants={fadeInUp}
          >
            Connect Talent with{" "}
            <span className="relative">
              Opportunity
              <motion.div
                className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 1, duration: 0.8 }}
              />
            </span>
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed"
            variants={fadeInUp}
          >
            Hirezaa is your modern job portal, revolutionizing hiring with{" "}
            <span className="font-semibold text-blue-600">AI-powered assessments</span>,{" "}
            <span className="font-semibold text-purple-600">automated screening</span>, and{" "}
            <span className="font-semibold text-indigo-600">intelligent candidate matching</span>.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center" 
            variants={fadeInUp}
          >
            <motion.div variants={buttonHover} whileHover="hover">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg"
                asChild
              >
                <Link href="/auth/register?role=job_seeker" className="flex items-center">
                  Find Your Dream Job
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div variants={buttonHover} whileHover="hover">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-8 py-4 text-lg font-semibold shadow-lg backdrop-blur-sm"
                asChild
              >
                <Link href="/auth/register?role=recruiter" className="flex items-center">
                  Hire Top Talent
                  <Users className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Trust indicators */}
          <motion.div 
            className="mt-16 flex flex-wrap justify-center items-center gap-8 opacity-70"
            variants={fadeInUp}
          >
            <div className="flex items-center text-gray-500">
              <Star className="w-5 h-5 text-yellow-400 mr-1" />
              <span className="font-medium">4.9/5 Rating</span>
            </div>
            <div className="flex items-center text-gray-500">
              <CheckCircle className="w-5 h-5 text-green-500 mr-1" />
              <span className="font-medium">50,000+ Users</span>
            </div>
            <div className="flex items-center text-gray-500">
              <Award className="w-5 h-5 text-blue-500 mr-1" />
              <span className="font-medium">Industry Leader</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <motion.section
        className="relative container mx-auto px-4 py-24"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
      >
        <div className="text-center mb-16">
          <motion.div
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full text-sm font-medium text-purple-700 mb-6"
            variants={fadeInUp}
          >
            <Zap className="w-4 h-4 mr-2" />
            Powerful Features
          </motion.div>
          
          <motion.h2 
            className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6" 
            variants={fadeInUp}
          >
            Why Choose Hirezaa?
          </motion.h2>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed" 
            variants={fadeInUp}
          >
            Cutting-edge features designed to make hiring smarter, faster, and more efficient than ever before.
          </motion.p>
        </div>

        <motion.div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto" variants={staggerContainer}>
          {[
            {
              icon: <Target className="h-14 w-14 text-blue-600 mx-auto mb-6" />,
              title: "AI-Powered Matching",
              description: "Smart algorithms connect candidates with ideal job opportunities using advanced machine learning.",
              gradient: "from-blue-500 to-blue-600",
            },
            {
              icon: <Zap className="h-14 w-14 text-purple-600 mx-auto mb-6" />,
              title: "Automated Assessments",
              description: "Effortlessly generate and evaluate technical assessments with real-time scoring and feedback.",
              gradient: "from-purple-500 to-purple-600",
            },
            {
              icon: <Shield className="h-14 w-14 text-indigo-600 mx-auto mb-6" />,
              title: "Secure Proctoring",
              description: "Ensure fairness with advanced proctoring technology and anti-cheating measures.",
              gradient: "from-indigo-500 to-indigo-600",
            },
            {
              icon: <BarChart className="h-14 w-14 text-blue-600 mx-auto mb-6" />,
              title: "Analytics Dashboard",
              description: "Gain deep insights into your hiring process and performance with comprehensive analytics.",
              gradient: "from-blue-500 to-purple-500",
            },
            {
              icon: <Users className="h-14 w-14 text-purple-600 mx-auto mb-6" />,
              title: "Bulk Shortlisting",
              description: "Automatically select top candidates based on scores and customizable criteria.",
              gradient: "from-purple-500 to-indigo-500",
            },
            {
              icon: <Briefcase className="h-14 w-14 text-indigo-600 mx-auto mb-6" />,
              title: "Easy Job Management",
              description: "Seamlessly post, manage, and track job openings with our intuitive interface.",
              gradient: "from-indigo-500 to-blue-500",
            },
          ].map((feature, index) => (
            <motion.div key={index} variants={fadeInUp}>
              <motion.div
                variants={cardHover}
                whileHover="hover"
                className={`relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-8 h-full shadow-lg hover:shadow-2xl transition-all duration-300 group overflow-hidden`}
              >
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
                
                <div className="relative z-10">
                  <motion.div
                    variants={floatingAnimation}
                    animate="floating"
                    className="mb-6"
                  >
                    {feature.icon}
                  </motion.div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors">
                    {feature.description}
                  </p>
                  
                  <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white py-24 overflow-hidden"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative container mx-auto px-4">
          <motion.div className="text-center mb-16" variants={fadeInUp}>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join thousands of successful companies and professionals
            </p>
          </motion.div>

          <motion.div className="grid md:grid-cols-4 gap-8 text-center max-w-5xl mx-auto" variants={staggerContainer}>
            {[
              { value: "50K+", label: "Active Jobs", icon: <Briefcase className="w-8 h-8 mx-auto mb-2" /> },
              { value: "100K+", label: "Job Seekers", icon: <Users className="w-8 h-8 mx-auto mb-2" /> },
              { value: "5K+", label: "Companies", icon: <Building2 className="w-8 h-8 mx-auto mb-2" /> },
              { value: "95%", label: "Success Rate", icon: <TrendingUp className="w-8 h-8 mx-auto mb-2" /> },
            ].map((stat, index) => (
              <motion.div 
                key={index} 
                variants={fadeInUp}
                className="group"
              >
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 transition-all duration-300 hover:bg-white/20"
                >
                  <div className="text-white/80 group-hover:text-white transition-colors">
                    {stat.icon}
                  </div>
                  <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
                    {stat.value}
                  </div>
                  <div className="text-blue-100 font-medium group-hover:text-white transition-colors">
                    {stat.label}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="relative container mx-auto px-4 py-32 text-center"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={staggerContainer}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full text-sm font-medium text-blue-700 mb-8"
            variants={fadeInUp}
          >
            <Rocket className="w-4 h-4 mr-2" />
            Ready to Get Started?
          </motion.div>

          <motion.h2 
            className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-8" 
            variants={fadeInUp}
          >
            Transform Your Hiring Today
          </motion.h2>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed" 
            variants={fadeInUp}
          >
            Join thousands of companies and job seekers who trust Hirezaa to build their future. 
            Start your journey with us today.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row gap-6 justify-center items-center"
            variants={fadeInUp}
          >
            <motion.div variants={buttonHover} whileHover="hover">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-4 text-xl font-semibold shadow-xl"
                asChild
              >
                <Link href="/auth/register" className="flex items-center">
                  Get Started Free
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
            </motion.div>
            
            <motion.div variants={buttonHover} whileHover="hover">
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-purple-300 text-purple-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-blue-50 px-10 py-4 text-xl font-semibold shadow-xl"
                asChild
              >
                <Link href="/contact">Contact Sales</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Footer */}
      <motion.footer
        className="relative bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white py-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-full md:col-span-1">
              <div className="flex items-center space-x-2 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg">
                  <Briefcase className="h-8 w-8 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Hirezaa
                </span>
              </div>
              <p className="text-gray-300 leading-relaxed">
                The modern job portal for the digital age. Connecting talent with opportunity through innovation.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold mb-6 text-blue-300 text-lg">For Job Seekers</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/auth/register" className="hover:text-blue-300 transition-colors">Create Profile</Link></li>
                <li><Link href="/jobs" className="hover:text-blue-300 transition-colors">Browse Jobs</Link></li>
                <li><Link href="/help" className="hover:text-blue-300 transition-colors">Career Tips</Link></li>
                <li><Link href="/resources" className="hover:text-blue-300 transition-colors">Resources</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-6 text-purple-300 text-lg">For Employers</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/auth/register?role=recruiter" className="hover:text-purple-300 transition-colors">Post Jobs</Link></li>
                <li><Link href="/pricing" className="hover:text-purple-300 transition-colors">Pricing</Link></li>
                <li><Link href="/help" className="hover:text-purple-300 transition-colors">Hiring Guide</Link></li>
                <li><Link href="/enterprise" className="hover:text-purple-300 transition-colors">Enterprise</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold mb-6 text-indigo-300 text-lg">Company</h3>
              <ul className="space-y-3 text-gray-300">
                <li><Link href="/about" className="hover:text-indigo-300 transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-indigo-300 transition-colors">Contact</Link></li>
                <li><Link href="/privacy" className="hover:text-indigo-300 transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="hover:text-indigo-300 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 mb-4 md:mb-0">
                &copy; 2025 Hirezaa. All rights reserved. Made with ❤️ for the future of work.
              </p>
              <div className="flex space-x-6 text-gray-400">
                <Link href="/sitemap" className="hover:text-blue-300 transition-colors">Sitemap</Link>
                <Link href="/security" className="hover:text-purple-300 transition-colors">Security</Link>
                <Link href="/status" className="hover:text-indigo-300 transition-colors">Status</Link>
              </div>
            </div>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}