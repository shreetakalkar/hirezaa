"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signInWithEmailAndPassword } from "firebase/auth"
import { doc, getDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Briefcase, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface UserData {
  id: string
  name: string
  email: string
  role: "job_seeker" | "recruiter"
  company?: string
  position?: string
  createdAt: any
  updatedAt: any
  isActive?: boolean
}

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError("Please fill in all fields.")
      setLoading(false)
      return
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError("Please enter a valid email address.")
      setLoading(false)
      return
    }

    try {
      // First, authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password.trim())
      const firebaseUser = userCredential.user

      // Then verify user exists in our Firestore users collection
      const userDocRef = doc(db, "users", firebaseUser.uid)
      const userDocSnap = await getDoc(userDocRef)

      if (!userDocSnap.exists()) {
        // User doesn't exist in our database
        await auth.signOut() // Sign out the user
        setError("Account not found in our database. Please contact support or register again.")
        setLoading(false)
        return
      }

      const userData = userDocSnap.data() as UserData

      // Check if user account is active (if you have this field)
      if (userData.isActive === false) {
        await auth.signOut()
        setError("Your account has been deactivated. Please contact support.")
        setLoading(false)
        return
      }

      // Verify user role is valid
      if (!userData.role || !["job_seeker", "recruiter"].includes(userData.role)) {
        await auth.signOut()
        setError("Invalid user role. Please contact support.")
        setLoading(false)
        return
      }

      // Check email verification (optional)
      if (!firebaseUser.emailVerified) {
        toast({
          title: "Email not verified",
          description: "Please check your email and verify your account.",
          variant: "destructive"
        })
        // You can choose to allow or block unverified users
        // For now, we'll allow but show a warning
      }

      // Success - redirect based on user role
      toast({
        title: "Welcome back!",
        description: `Successfully logged in as ${userData.role.replace('_', ' ')}.`,
      })

      // Redirect based on user role
      if (userData.role === "recruiter") {
        router.push("/recruiter")
      } else if (userData.role === "job_seeker") {
        router.push("/job-seeker")
      } else {
        router.push("/dashboard") // fallback
      }

    } catch (error: any) {
      console.error("Login error:", error)
      
      // Handle specific Firebase Auth errors
      let errorMessage = "An unexpected error occurred. Please try again."
      
      if (error.code) {
        errorMessage = mapFirebaseError(error.code)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      setError(errorMessage)
      
      // If user was signed in but verification failed, sign them out
      if (auth.currentUser) {
        await auth.signOut()
      }
    } finally {
      setLoading(false)
    }
  }

  // Map Firebase authentication errors to user-friendly messages
  const mapFirebaseError = (code: string) => {
    const errorMap: { [key: string]: string } = {
      "auth/invalid-email": "Please enter a valid email address.",
      "auth/user-disabled": "This account has been disabled. Please contact support.",
      "auth/user-not-found": "No account found with this email address.",
      "auth/wrong-password": "Incorrect password. Please try again.",
      "auth/too-many-requests": "Too many failed attempts. Please try again later or reset your password.",
      "auth/invalid-credential": "Invalid email or password. Please check your credentials.",
      "auth/network-request-failed": "Network error. Please check your connection and try again.",
      "auth/weak-password": "Password is too weak. Please choose a stronger password.",
    }
    return errorMap[code] || "Authentication failed. Please try again."
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                <Briefcase className="h-8 w-8 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Hirezaa
              </span>
            </div>
            <div>
              <CardTitle className="text-2xl font-semibold text-gray-900">Welcome Back</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Sign in to access your account and continue your journey
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                    Password
                  </Label>
                  <Link 
                    href="/auth/forgot-password" 
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                  >
                    Forgot Password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12 transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold transition-all duration-200 shadow-lg hover:shadow-xl" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying Account...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">New to Hirezaa?</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                Don&apos;t have an account?{" "}
                <Link 
                  href="/auth/register" 
                  className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            By signing in, you agree to our{" "}
            <Link href="/terms" className="text-blue-600 hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  )
}