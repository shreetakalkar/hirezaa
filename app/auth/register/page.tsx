"use client"

import type React from "react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { createUserWithEmailAndPassword, sendEmailVerification, updateProfile } from "firebase/auth"
import { doc, setDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Briefcase, Loader2, Eye, EyeOff, AlertCircle, CheckCircle, User, Building } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { UserRole } from "@/lib/types"

interface FormData {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: UserRole
  company: string
  position: string
  phone: string
  agreeToTerms: boolean
}

export default function RegisterPage() {
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get("role") as UserRole) || "job_seeker"

  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: defaultRole,
    company: "",
    position: "",
    phone: "",
    agreeToTerms: false,
  })

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [emailExists, setEmailExists] = useState(false)
  const [checkingEmail, setCheckingEmail] = useState(false)

  const router = useRouter()
  const { toast } = useToast()

  const checkEmailExists = async (email: string) => {
    if (!email.trim()) return false
    setCheckingEmail(true)
    try {
      const usersRef = collection(db, "users")
      const q = query(usersRef, where("email", "==", email.toLowerCase().trim()))
      const querySnapshot = await getDocs(q)
      const exists = !querySnapshot.empty
      setEmailExists(exists)
      return exists
    } catch (error) {
      console.error("Error checking email:", error)
      return false
    } finally {
      setCheckingEmail(false)
    }
  }

  const handleEmailBlur = () => {
    if (formData.email.trim()) checkEmailExists(formData.email)
  }

  const validatePassword = (password: string) => {
    const minLength = 8
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    const errors = []
    if (password.length < minLength) errors.push(`At least ${minLength} characters`)
    if (!hasUpperCase) errors.push("One uppercase letter")
    if (!hasLowerCase) errors.push("One lowercase letter")
    if (!hasNumbers) errors.push("One number")
    if (!hasSpecialChar) errors.push("One special character")

    return {
      isValid: errors.length === 0,
      errors,
      strength: password.length === 0 ? 0 : Math.max(1, 5 - errors.length),
    }
  }

  const passwordValidation = validatePassword(formData.password)

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return "bg-red-500"
    if (strength <= 2) return "bg-orange-500"
    if (strength <= 3) return "bg-yellow-500"
    if (strength <= 4) return "bg-blue-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 1) return "Very Weak"
    if (strength <= 2) return "Weak"
    if (strength <= 3) return "Fair"
    if (strength <= 4) return "Good"
    return "Strong"
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (!formData.name.trim()) throw new Error("Please enter your full name.")
      if (!formData.email.trim()) throw new Error("Please enter your email address.")
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) throw new Error("Please enter a valid email address.")
      if (await checkEmailExists(formData.email)) throw new Error("An account with this email already exists.")
      if (!passwordValidation.isValid) throw new Error(`Password must include: ${passwordValidation.errors.join(", ")}`)
      if (formData.password !== formData.confirmPassword) throw new Error("Passwords do not match.")
      if (formData.role === "recruiter" && !formData.company.trim()) throw new Error("Please enter your company name.")
      if (formData.role === "recruiter" && !formData.position.trim()) throw new Error("Please enter your position.")
      if (!formData.agreeToTerms) throw new Error("Please agree to the Terms of Service and Privacy Policy.")

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email.trim().toLowerCase(),
        formData.password
      )

      const firebaseUser = userCredential.user

      await updateProfile(firebaseUser, { displayName: formData.name.trim() })

      const userData = {
        id: firebaseUser.uid,
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        role: formData.role,
        phone: formData.phone.trim() || "",
        isActive: true,
        emailVerified: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: null,
        profileComplete: formData.role === "job_seeker" ? false : true,
        ...(formData.role === "recruiter" && {
          company: formData.company.trim(),
          position: formData.position.trim(),
          jobsPosted: 0,
          applicationsReceived: 0,
        }),
        ...(formData.role === "job_seeker" && {
          skills: [],
          experience: "",
          education: "",
          resume: null,
          applicationsSubmitted: 0,
          profileViews: 0,
        }),
      }

      await setDoc(doc(db, "users", firebaseUser.uid), userData)

      await sendEmailVerification(firebaseUser)
      toast({
        title: "Verification email sent!",
        description: "Please check your email to verify your account.",
      })

      toast({
        title: "Account created!",
        description: `Welcome to Hirezaa, ${formData.name}!`,
      })

      router.push(formData.role === "recruiter" ? "/recruiter" : "/job-seeker")
    } catch (error: any) {
      console.error("Registration error:", error)
      let errorMessage = "An unexpected error occurred. Please try again."
      if (error.message) errorMessage = error.message
      else if (error.code) {
        const errorMap = {
          "auth/email-already-in-use": "An account with this email already exists.",
          "auth/invalid-email": "Please enter a valid email address.",
          "auth/operation-not-allowed": "Email/password accounts are not enabled.",
          "auth/weak-password": "Password is too weak. Please choose a stronger password.",
          "auth/network-request-failed": "Network error. Please check your connection.",
        }
        errorMessage = errorMap[error.code as keyof typeof errorMap] || errorMessage
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
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
              <CardTitle className="text-2xl font-semibold text-gray-900">Create Your Account</CardTitle>
              <CardDescription className="text-gray-600 mt-2">
                Join thousands of professionals on Hirezaa
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
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">
                  Full Name
                </Label>
                <Input
                  id="name"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
                  Email Address
                </Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    onBlur={handleEmailBlur}
                    required
                    className={`h-11 pr-10 transition-colors ${
                      emailExists
                        ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                        : "border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                    }`}
                    disabled={loading || checkingEmail}
                  />
                  {checkingEmail && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                  )}
                  {emailExists && (
                    <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-red-500" />
                  )}
                </div>
                {emailExists && (
                  <p className="text-sm text-red-600">This email is already registered. Try signing in instead.</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-sm font-semibold text-gray-700">
                  I am a
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                  disabled={loading}
                >
                  <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Select your role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="job_seeker">
                      <div className="flex items-center">
                        <User className="h-4 w-4 mr-2" />
                        Job Seeker
                      </div>
                    </SelectItem>
                    <SelectItem value="recruiter">
                      <div className="flex items-center">
                        <Building className="h-4 w-4 mr-2" />
                        Recruiter
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.role === "recruiter" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="company" className="text-sm font-semibold text-gray-700">
                      Company Name
                    </Label>
                    <Input
                      id="company"
                      placeholder="Enter your company name"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      required
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="position" className="text-sm font-semibold text-gray-700">
                      Your Position
                    </Label>
                    <Input
                      id="position"
                      placeholder="e.g. HR Manager, Talent Acquisition"
                      value={formData.position}
                      onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                      required
                      className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                      disabled={loading}
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-sm font-semibold text-gray-700">
                  Phone Number <span className="text-gray-400">(Optional)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-semibold text-gray-700">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
                {formData.password && (
                  <div className="flex items-center gap-2 text-xs">
                    <div className="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${getPasswordStrengthColor(passwordValidation.strength)} transition-all duration-300`}
                        style={{ width: `${(passwordValidation.strength / 5) * 100}%` }}
                      />
                    </div>
                    <span className={passwordValidation.strength <= 2 ? "text-red-600" : "text-green-600"}>
                      {getPasswordStrengthText(passwordValidation.strength)}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    required
                    className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 pr-12 transition-colors"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 transition-colors"
                    disabled={loading}
                  >
                    {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => setFormData({ ...formData, agreeToTerms: !!checked })}
                  disabled={loading}
                />
                <Label htmlFor="agreeToTerms" className="text-sm text-gray-700 leading-tight">
                  I agree to the{" "}
                  <Link href="/terms" className="text-blue-600 hover:underline">
                    Terms of Service
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </Link>
                </Label>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  "Create Account"
                )}
              </Button>
            </form>

            <div className="text-center mt-6">
              <p className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link href="/auth/login" className="text-blue-600 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}