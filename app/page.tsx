"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { CountryFlag } from "@/components/country-flag"
import { CloudProviderBadge } from "@/components/cloud-provider-badge"
import { APIComparison } from "@/components/api-comparison"
import { AccuracyIndicator } from "@/components/accuracy-indicator"
import {
  Search,
  MapPin,
  Wifi,
  Clock,
  Shield,
  AlertCircle,
  Loader2,
  Database,
  RefreshCw,
  Eye,
  Locate,
  Globe,
  CheckCircle,
  Info,
  Lightbulb,
} from "lucide-react"

interface IPInfo {
  ip: string
  city: string
  region: string
  country: string
  country_code: string
  continent_code: string
  latitude: number
  longitude: number
  timezone: string
  utc_offset: string
  isp: string
  org: string
  as: string
  asname: string
  mobile: boolean
  proxy: boolean
  hosting: boolean
  cloud_provider?: string
  accuracy_score: number
  postal_code?: string
}

interface APIResult {
  service: string
  success: boolean
  data?: IPInfo
  error?: string
  responseTime?: number
}

interface LookupResponse {
  consolidated: IPInfo
  individual_results: APIResult[]
  total_apis: number
  successful_apis: number
}

interface ErrorResponse {
  error: string
  suggestion?: string
}

export default function IPLookupPage() {
  const [ipAddress, setIpAddress] = useState("")
  const [lookupData, setLookupData] = useState<LookupResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [detectingIP, setDetectingIP] = useState(false)
  const [error, setError] = useState("")
  const [errorSuggestion, setErrorSuggestion] = useState("")
  const [isMyIP, setIsMyIP] = useState(false)

  const validateIP = (ip: string): boolean => {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }

  const handleManualLookup = async () => {
    if (!ipAddress.trim()) {
      setError("Please enter an IP address")
      setErrorSuggestion("Try entering a public IP address like 8.8.8.8 or 1.1.1.1")
      return
    }

    if (!validateIP(ipAddress.trim())) {
      setError("Please enter a valid IP address")
      setErrorSuggestion("Make sure the IP address format is correct (e.g., 192.168.1.1 or 2001:db8::1)")
      return
    }

    setLoading(true)
    setError("")
    setErrorSuggestion("")
    setLookupData(null)
    setIsMyIP(false)

    try {
      const response = await fetch(`/api/lookup?ip=${encodeURIComponent(ipAddress.trim())}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: "Network error occurred",
        }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data: LookupResponse = await response.json()
      setLookupData(data)
    } catch (err) {
      console.error("Lookup error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setErrorSuggestion("Please verify the IP address and try again, or check your internet connection.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleManualLookup()
    }
  }

  // Dedicated function for detecting user's own IP
  const detectMyIP = async () => {
    setDetectingIP(true)
    setError("")
    setErrorSuggestion("")
    setLookupData(null)
    setIpAddress("")
    setIsMyIP(true)

    try {
      const response = await fetch("/api/lookup", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: "Network error occurred",
        }))
        setError(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        setErrorSuggestion(
          errorData.suggestion ||
            "This might be due to network restrictions or privacy settings. Try using the manual lookup feature instead.",
        )
        setIsMyIP(false)
        return
      }

      const data: LookupResponse = await response.json()
      setIpAddress(data.consolidated.ip)
      setLookupData(data)
    } catch (err) {
      console.error("Detect my IP error:", err)
      setError(err instanceof Error ? err.message : "Unable to detect your IP address")
      setErrorSuggestion(
        "This could be due to network configuration, VPN usage, or privacy settings. You can still use the manual lookup feature to analyze any IP address.",
      )
      setIsMyIP(false)
    } finally {
      setDetectingIP(false)
    }
  }

  const refreshCurrentIP = async () => {
    if (!isMyIP) return
    await detectMyIP()
  }

  // Demo function to show example IP analysis
  const showDemo = async () => {
    setIpAddress("8.8.8.8")
    setLoading(true)
    setError("")
    setErrorSuggestion("")
    setLookupData(null)
    setIsMyIP(false)

    try {
      const response = await fetch(`/api/lookup?ip=8.8.8.8`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json().catch(() => ({
          error: "Network error occurred",
        }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const data: LookupResponse = await response.json()
      setLookupData(data)
    } catch (err) {
      console.error("Demo lookup error:", err)
      setError(err instanceof Error ? err.message : "An unexpected error occurred")
      setErrorSuggestion("Please check your internet connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  const ipInfo = lookupData?.consolidated

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg neon-glow">
              <Eye className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold high-contrast-text neon-text">IP Lookup</h1>
              <p className="text-white/70 text-sm sm:text-base">Advanced IP geolocation analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
          </div>
        </div>

        {/* Main Action Section */}
        <Card className="max-w-4xl mx-auto mb-8 shadow-2xl high-contrast-card neon-glow">
          <CardHeader className="text-center pb-4">
            <CardTitle className="high-contrast-text text-2xl sm:text-3xl flex items-center justify-center gap-3">
              <Globe className="w-7 h-7 sm:w-8 sm:h-8 text-blue-400" />
              IP Geolocation Intelligence
            </CardTitle>
            <CardDescription className="text-white/70 text-base sm:text-lg">
              Discover comprehensive information about any IP address with multi-source validation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Manual Lookup - Primary Action */}
            <div className="space-y-4">
              <div className="text-center">
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">IP Address Lookup</h3>
                <p className="text-white/70 text-sm sm:text-base">
                  Enter any IPv4 or IPv6 address for detailed geolocation analysis
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  placeholder="Enter IPv4 or IPv6 address (e.g., 8.8.8.8, 2001:4860:4860::8888)"
                  value={ipAddress}
                  onChange={(e) => setIpAddress(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 text-base sm:text-lg py-2 sm:py-3 px-3 sm:px-4 bg-white/10 border-white/20 text-white placeholder-white/50 focus:border-blue-400 focus:ring-blue-400/50"
                  disabled={loading}
                />
                <Button
                  onClick={handleManualLookup}
                  disabled={loading}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 sm:px-6 py-2 sm:py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 w-full sm:w-auto"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mr-2" />
                  ) : (
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                  )}
                  Analyze IP
                </Button>
              </div>

              {/* Quick Examples */}
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="text-white/50 text-sm">Quick examples:</span>
                {["8.8.8.8", "1.1.1.1", "208.67.222.222"].map((exampleIP) => (
                  <Button
                    key={exampleIP}
                    variant="ghost"
                    size="sm"
                    onClick={() => setIpAddress(exampleIP)}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 text-xs px-2 py-1"
                  >
                    {exampleIP}
                  </Button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
              <Separator className="flex-1 bg-white/20" />
              <span className="text-white/50 text-sm font-medium">OR</span>
              <Separator className="flex-1 bg-white/20" />
            </div>

            {/* Detect My IP - Secondary Action */}
            <div className="text-center space-y-4">
              <Button
                onClick={detectMyIP}
                disabled={detectingIP}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 text-base shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                size="lg"
              >
                {detectingIP ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Detecting Your IP...
                  </>
                ) : (
                  <>
                    <Locate className="w-5 h-5 mr-2" />
                    Detect My IP Address
                  </>
                )}
              </Button>
              <p className="text-white/60 text-sm">Automatically detect and analyze your public IP address</p>
            </div>

            {/* Demo Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={showDemo}
                disabled={loading}
                className="high-contrast-card border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 transition-all duration-300"
              >
                <Lightbulb className="w-4 h-4 mr-2" />
                Try Demo (8.8.8.8)
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {(detectingIP || loading) && !lookupData && (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-6 shadow-2xl neon-glow">
              <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-white animate-spin" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 text-center">
              {detectingIP ? "Detecting Your IP Address" : "Analyzing IP Address"}
            </h2>
            <p className="text-white/70 text-base sm:text-lg text-center px-4">
              Cross-referencing {lookupData?.total_apis || 7} databases for maximum accuracy...
            </p>
            <div className="mt-4 flex items-center gap-2 text-white/60">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <Card className="max-w-4xl mx-auto mb-8 border-red-500/50 bg-red-900/20 shadow-2xl">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-red-400">
                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-base sm:text-lg">{error}</p>
                    {errorSuggestion && <p className="text-sm text-red-300 mt-1">{errorSuggestion}</p>}
                  </div>
                  <Button
                    variant="outline"
                    onClick={isMyIP ? detectMyIP : handleManualLookup}
                    disabled={detectingIP || loading}
                    className="border-red-400/50 text-red-400 hover:bg-red-400/10 hover:border-red-400"
                    size="sm"
                  >
                    {detectingIP || loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Retry
                  </Button>
                </div>

                {/* Helpful suggestions */}
                <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-blue-300 text-sm">
                      <p className="font-medium mb-2">Troubleshooting Tips:</p>
                      <ul className="space-y-1 text-blue-200">
                        <li>• Try the demo with Google DNS (8.8.8.8) to test the service</li>
                        <li>• Check if you're using a VPN or proxy that might block detection</li>
                        <li>• Use the manual lookup feature to analyze any public IP address</li>
                        <li>• Ensure you have a stable internet connection</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {lookupData && ipInfo && (
          <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Success Indicator for My IP */}
            {isMyIP && (
              <Card className="border-green-500/50 bg-green-900/20 shadow-2xl">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-green-400">
                    <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-base sm:text-lg">Your IP Address Successfully Detected!</p>
                      <p className="text-sm text-green-300 mt-1">
                        Comprehensive geolocation analysis completed using {lookupData.successful_apis} reliable data
                        sources.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={refreshCurrentIP}
                      disabled={detectingIP}
                      className="border-green-400/50 text-green-400 hover:bg-green-400/10 hover:border-green-400"
                      size="sm"
                    >
                      {detectingIP ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Accuracy Indicator */}
            <AccuracyIndicator
              score={ipInfo.accuracy_score}
              totalApis={lookupData.total_apis}
              successfulApis={lookupData.successful_apis}
            />

            {/* Main Info Card */}
            <Card className="shadow-2xl high-contrast-card neon-glow">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 high-contrast-text text-2xl sm:text-3xl">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                    <span>{isMyIP ? "Your IP Intelligence Report" : "IP Intelligence Report"}</span>
                  </div>
                  <CountryFlag countryCode={ipInfo.country_code} className="w-10 h-7 sm:w-12 sm:h-8" />
                </CardTitle>
                <CardDescription className="text-white/70 text-base sm:text-lg flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                  <span>{isMyIP ? "Your IP address:" : "Analysis for:"}</span>
                  <span className="font-mono text-blue-400 text-lg sm:text-xl break-all">{ipInfo.ip}</span>
                  {ipInfo.cloud_provider && <CloudProviderBadge provider={ipInfo.cloud_provider} />}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
                  {/* Location Info */}
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="font-bold text-xl sm:text-2xl flex items-center gap-3 high-contrast-text">
                      <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-blue-400" />
                      Geographic Location
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">IP Address:</span>
                        <Badge className="font-mono text-lg sm:text-xl px-3 sm:px-4 py-1 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white w-fit">
                          {ipInfo.ip}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Country:</span>
                        <div className="flex items-center gap-3">
                          <CountryFlag countryCode={ipInfo.country_code} className="w-6 h-4 sm:w-8 sm:h-6" />
                          <span className="font-bold text-white text-base sm:text-lg">
                            {ipInfo.country} ({ipInfo.country_code})
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Region:</span>
                        <span className="font-bold text-white text-base sm:text-lg">{ipInfo.region}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">City:</span>
                        <span className="font-bold text-white text-base sm:text-lg">{ipInfo.city}</span>
                      </div>
                      {ipInfo.postal_code && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                          <span className="text-white/70 text-base sm:text-lg font-medium">Postal Code:</span>
                          <span className="font-mono text-white text-base sm:text-lg">{ipInfo.postal_code}</span>
                        </div>
                      )}
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Coordinates:</span>
                        <span className="font-mono text-white text-base sm:text-lg">
                          {ipInfo.latitude.toFixed(4)}, {ipInfo.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Network Info */}
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="font-bold text-xl sm:text-2xl flex items-center gap-3 high-contrast-text">
                      <Wifi className="w-6 h-6 sm:w-7 sm:h-7 text-purple-400" />
                      Network Information
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">ISP:</span>
                        <span
                          className="font-bold text-white text-base sm:text-lg text-left sm:text-right break-words"
                          title={ipInfo.isp}
                        >
                          {ipInfo.isp}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Organization:</span>
                        <span
                          className="font-bold text-white text-base sm:text-lg text-left sm:text-right break-words"
                          title={ipInfo.org}
                        >
                          {ipInfo.org}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">AS Number:</span>
                        <span className="font-mono text-white text-base sm:text-lg">{ipInfo.as}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">AS Name:</span>
                        <span
                          className="font-bold text-white text-base sm:text-lg text-left sm:text-right break-words"
                          title={ipInfo.asname}
                        >
                          {ipInfo.asname}
                        </span>
                      </div>
                      {ipInfo.cloud_provider && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                          <span className="text-white/70 text-base sm:text-lg font-medium">Cloud Provider:</span>
                          <CloudProviderBadge provider={ipInfo.cloud_provider} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Separator className="my-8 sm:my-10 bg-white/20" />

                {/* Additional Info */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 sm:gap-10">
                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="font-bold text-xl sm:text-2xl flex items-center gap-3 high-contrast-text">
                      <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-green-400" />
                      Time Zone Information
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Time Zone:</span>
                        <span className="font-bold text-white text-base sm:text-lg">{ipInfo.timezone}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">UTC Offset:</span>
                        <span className="font-mono text-white text-base sm:text-lg">{ipInfo.utc_offset}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 sm:space-y-6">
                    <h3 className="font-bold text-xl sm:text-2xl flex items-center gap-3 high-contrast-text">
                      <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400" />
                      Security Analysis
                    </h3>
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Mobile Network:</span>
                        <Badge
                          className={`text-base sm:text-lg px-3 sm:px-4 py-1 sm:py-2 w-fit ${
                            ipInfo.mobile ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
                          } text-white`}
                        >
                          {ipInfo.mobile ? "Detected" : "None"}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Proxy/VPN:</span>
                        <Badge
                          className={`text-base sm:text-lg px-3 sm:px-4 py-1 sm:py-2 w-fit ${
                            ipInfo.proxy ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
                          } text-white`}
                        >
                          {ipInfo.proxy ? "Detected" : "None"}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 py-2">
                        <span className="text-white/70 text-base sm:text-lg font-medium">Hosting/Datacenter:</span>
                        <Badge
                          className={`text-base sm:text-lg px-3 sm:px-4 py-1 sm:py-2 w-fit ${
                            ipInfo.hosting ? "bg-red-600 hover:bg-red-700" : "bg-gray-600 hover:bg-gray-700"
                          } text-white`}
                        >
                          {ipInfo.hosting ? "Detected" : "None"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* API Comparison */}
            <APIComparison results={lookupData.individual_results} />

            {/* Map Card */}
            <Card className="shadow-2xl high-contrast-card neon-glow">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 high-contrast-text text-2xl sm:text-3xl">
                  <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
                  Geographic Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl flex items-center justify-center border border-white/10">
                  <div className="text-center space-y-4 sm:space-y-6 p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                      <MapPin className="w-16 h-16 sm:w-20 sm:h-20 text-blue-400" />
                      <CountryFlag countryCode={ipInfo.country_code} className="w-16 h-12 sm:w-20 sm:h-16" />
                    </div>
                    <div>
                      <p className="text-xl sm:text-2xl font-bold text-white">
                        {ipInfo.city}, {ipInfo.region}
                      </p>
                      <p className="text-2xl sm:text-3xl font-bold text-blue-400 mt-2">{ipInfo.country}</p>
                      <p className="text-base sm:text-lg text-white/70 mt-4">
                        Coordinates: {ipInfo.latitude.toFixed(4)}, {ipInfo.longitude.toFixed(4)}
                      </p>
                      {ipInfo.postal_code && (
                        <p className="text-sm sm:text-base text-white/60 mt-2">Postal Code: {ipInfo.postal_code}</p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 sm:mt-16 text-white/60">
          <p className="text-base sm:text-lg font-semibold">© 2025 Xreat IP Lookup</p>
          <p className="text-sm mt-2">
            Enhanced with iplocation.io • {lookupData?.total_apis || 7} API sources • Real-time geolocation analysis
          </p>
        </div>
      </div>
    </div>
  )
}
