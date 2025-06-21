import { type NextRequest, NextResponse } from "next/server"

interface APIResult {
  service: string
  success: boolean
  data?: any
  error?: string
  responseTime?: number
}

interface ProcessedIPInfo {
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

// Enhanced IP lookup services with postal code support
const IP_SERVICES = [
  {
    name: "ipapi.co",
    url: (ip: string) => `https://ipapi.co/${ip}/json/`,
    transform: (data: any): ProcessedIPInfo => ({
      ip: data.ip,
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country_name || "Unknown",
      country_code: data.country_code || "Unknown",
      continent_code: data.continent_code || "Unknown",
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.timezone || "Unknown",
      utc_offset: data.utc_offset || "Unknown",
      isp: data.org || "Unknown",
      org: data.org || "Unknown",
      as: data.asn || "Unknown",
      asname: data.org || "Unknown",
      mobile: false,
      proxy: false,
      hosting: false,
      accuracy_score: 0.85,
      postal_code: data.postal || undefined,
    }),
  },
  {
    name: "ip-api.com",
    url: (ip: string) =>
      `http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,zip,lat,lon,timezone,offset,isp,org,as,asname,mobile,proxy,hosting,query`,
    transform: (data: any): ProcessedIPInfo => {
      if (data.status === "fail") {
        throw new Error(data.message || "IP lookup failed")
      }
      return {
        ip: data.query,
        city: data.city || "Unknown",
        region: data.regionName || "Unknown",
        country: data.country || "Unknown",
        country_code: data.countryCode || "Unknown",
        continent_code: "Unknown",
        latitude: data.lat || 0,
        longitude: data.lon || 0,
        timezone: data.timezone || "Unknown",
        utc_offset:
          data.offset !== undefined ? `UTC${data.offset >= 0 ? "+" : ""}${Math.round(data.offset / 3600)}` : "Unknown",
        isp: data.isp || "Unknown",
        org: data.org || "Unknown",
        as: data.as || "Unknown",
        asname: data.asname || "Unknown",
        mobile: Boolean(data.mobile),
        proxy: Boolean(data.proxy),
        hosting: Boolean(data.hosting),
        accuracy_score: 0.9,
        postal_code: data.zip || undefined,
      }
    },
  },
  {
    name: "ipinfo.io",
    url: (ip: string) => `https://ipinfo.io/${ip}/json`,
    transform: (data: any): ProcessedIPInfo => ({
      ip: data.ip,
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country || "Unknown",
      country_code: data.country || "Unknown",
      continent_code: "Unknown",
      latitude: data.loc ? Number.parseFloat(data.loc.split(",")[0]) : 0,
      longitude: data.loc ? Number.parseFloat(data.loc.split(",")[1]) : 0,
      timezone: data.timezone || "Unknown",
      utc_offset: "Unknown",
      isp: data.org || "Unknown",
      org: data.org || "Unknown",
      as: data.org || "Unknown",
      asname: data.org || "Unknown",
      mobile: false,
      proxy: false,
      hosting: false,
      accuracy_score: 0.75,
      postal_code: data.postal || undefined,
    }),
  },
  {
    name: "ipgeolocation.io",
    url: (ip: string) => `https://api.ipgeolocation.io/ipgeo?apiKey=free&ip=${ip}`,
    transform: (data: any): ProcessedIPInfo => ({
      ip: data.ip,
      city: data.city || "Unknown",
      region: data.state_prov || "Unknown",
      country: data.country_name || "Unknown",
      country_code: data.country_code2 || "Unknown",
      continent_code: data.continent_code || "Unknown",
      latitude: Number.parseFloat(data.latitude) || 0,
      longitude: Number.parseFloat(data.longitude) || 0,
      timezone: data.time_zone?.name || "Unknown",
      utc_offset: data.time_zone?.offset || "Unknown",
      isp: data.isp || "Unknown",
      org: data.organization || "Unknown",
      as: data.asn || "Unknown",
      asname: data.organization || "Unknown",
      mobile: false,
      proxy: false,
      hosting: false,
      accuracy_score: 0.8,
      postal_code: data.zipcode || undefined,
    }),
  },
  {
    name: "iplocation.io",
    url: (ip: string) => `https://api.iplocation.io/?ip=${ip}`,
    transform: (data: any): ProcessedIPInfo => ({
      ip: data.ip,
      city: data.city || "Unknown",
      region: data.region || "Unknown",
      country: data.country_name || "Unknown",
      country_code: data.country_code || "Unknown",
      continent_code: "Unknown",
      latitude: Number.parseFloat(data.latitude) || 0,
      longitude: Number.parseFloat(data.longitude) || 0,
      timezone: data.timezone || "Unknown",
      utc_offset: "Unknown",
      isp: data.isp || "Unknown",
      org: data.org || "Unknown",
      as: data.asn || "Unknown",
      asname: data.org || "Unknown",
      mobile: false,
      proxy: false,
      hosting: false,
      accuracy_score: 0.8,
      postal_code: data.postal_code || undefined,
    }),
  },
  {
    name: "freegeoip.app",
    url: (ip: string) => `https://freegeoip.app/json/${ip}`,
    transform: (data: any): ProcessedIPInfo => ({
      ip: data.ip,
      city: data.city || "Unknown",
      region: data.region_name || "Unknown",
      country: data.country_name || "Unknown",
      country_code: data.country_code || "Unknown",
      continent_code: "Unknown",
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      timezone: data.time_zone || "Unknown",
      utc_offset: "Unknown",
      isp: "Unknown",
      org: "Unknown",
      as: "Unknown",
      asname: "Unknown",
      mobile: false,
      proxy: false,
      hosting: false,
      accuracy_score: 0.65,
      postal_code: data.zip_code || undefined,
    }),
  },
]

// Fallback IP detection using external services
async function detectIPFromExternalService(): Promise<string | null> {
  const ipDetectionServices = [
    "https://api.ipify.org?format=json",
    "https://ipapi.co/json/",
    "https://ip-api.com/json/?fields=query",
  ]

  for (const serviceUrl of ipDetectionServices) {
    try {
      console.log(`Trying IP detection service: ${serviceUrl}`)
      const response = await fetch(serviceUrl, {
        method: "GET",
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/2.0)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(8000),
      })

      if (!response.ok) {
        console.log(`Service ${serviceUrl} returned ${response.status}`)
        continue
      }

      const data = await response.json()
      let detectedIP: string | null = null

      // Handle different response formats
      if (data.ip) {
        detectedIP = data.ip
      } else if (data.query) {
        detectedIP = data.query
      }

      if (detectedIP && isValidPublicIP(detectedIP)) {
        console.log(`Successfully detected IP from ${serviceUrl}: ${detectedIP}`)
        return detectedIP
      }
    } catch (error) {
      console.log(`Failed to detect IP from ${serviceUrl}:`, error)
      continue
    }
  }

  return null
}

// Enhanced client IP detection with better accuracy
function getClientIP(request: NextRequest): string | null {
  // Try multiple headers in order of reliability
  const headers = [
    "cf-connecting-ip", // Cloudflare (most reliable)
    "x-real-ip", // Nginx proxy
    "x-forwarded-for", // Standard proxy header
    "x-client-ip", // Apache mod_proxy
    "x-cluster-client-ip", // Cluster environments
    "x-forwarded", // Less common
    "forwarded-for", // Less common
    "forwarded", // RFC 7239
    "true-client-ip", // Akamai and Cloudflare
    "x-original-forwarded-for", // Original client IP
  ]

  console.log("Available headers:", Object.fromEntries(request.headers.entries()))

  for (const header of headers) {
    const value = request.headers.get(header)
    if (value) {
      console.log(`Checking header ${header}: ${value}`)
      // Handle comma-separated IPs (take the first one)
      const ip = value.split(",")[0].trim()
      // Validate IP format and ensure it's not private
      if (isValidPublicIP(ip)) {
        console.log(`Found valid client IP from ${header}: ${ip}`)
        return ip
      } else {
        console.log(`Invalid or private IP from ${header}: ${ip}`)
      }
    }
  }

  // Fallback to request.ip if available
  if (request.ip && isValidPublicIP(request.ip)) {
    console.log(`Found client IP from request.ip: ${request.ip}`)
    return request.ip
  }

  console.log("Could not detect client IP from any header")
  return null
}

function isValidPublicIP(ip: string): boolean {
  // Check for private/local IPs that we should skip
  if (
    !ip ||
    ip.startsWith("127.") || // Loopback
    ip.startsWith("192.168.") || // Private Class C
    ip.startsWith("10.") || // Private Class A
    ip.startsWith("172.") || // Private Class B (172.16-172.31)
    ip.startsWith("169.254.") || // Link-local
    ip.startsWith("::1") || // IPv6 loopback
    ip.startsWith("fc00:") || // IPv6 private
    ip.startsWith("fe80:") || // IPv6 link-local
    ip === "localhost" ||
    ip === "0.0.0.0"
  ) {
    return false
  }

  // Validate IP format
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$/
  return ipv4Regex.test(ip) || ipv6Regex.test(ip)
}

// Cloud provider detection
function detectCloudProvider(isp: string, org: string, asname: string): string | undefined {
  const text = `${isp} ${org} ${asname}`.toLowerCase()

  if (text.includes("amazon") || text.includes("aws") || text.includes("ec2")) return "aws"
  if (text.includes("google") || text.includes("gcp") || text.includes("cloud platform")) return "gcp"
  if (text.includes("microsoft") || text.includes("azure")) return "azure"
  if (text.includes("digitalocean")) return "digitalocean"
  if (text.includes("cloudflare")) return "cloudflare"
  if (text.includes("linode")) return "linode"
  if (text.includes("vultr")) return "vultr"
  if (text.includes("hetzner")) return "hetzner"
  if (text.includes("ovh")) return "ovh"

  return undefined
}

// Cross-reference and validate results with postal code consolidation
function crossReferenceResults(results: ProcessedIPInfo[]): ProcessedIPInfo {
  if (results.length === 0) {
    throw new Error("No valid results to cross-reference")
  }

  // Use the result with the highest accuracy score as base
  const baseResult = results.reduce((prev, current) => (prev.accuracy_score > current.accuracy_score ? prev : current))

  // Cross-reference common fields
  const countryMatches = results.filter((r) => r.country_code === baseResult.country_code).length
  const cityMatches = results.filter((r) => r.city === baseResult.city).length
  const ispMatches = results.filter((r) => r.isp === baseResult.isp).length

  // Find the most common postal code
  const postalCodes = results.filter((r) => r.postal_code).map((r) => r.postal_code)
  const mostCommonPostalCode = postalCodes.length > 0 ? postalCodes[0] : undefined

  // Calculate confidence score based on agreement between APIs
  const totalFields = 3
  const agreementScore = (countryMatches + cityMatches + ispMatches) / (totalFields * results.length)

  // Detect cloud provider
  const cloudProvider = detectCloudProvider(baseResult.isp, baseResult.org, baseResult.asname)

  return {
    ...baseResult,
    cloud_provider: cloudProvider,
    accuracy_score: Math.min(baseResult.accuracy_score + agreementScore * 0.2, 1.0),
    postal_code: mostCommonPostalCode,
  }
}

async function callIPService(service: any, ip: string): Promise<APIResult> {
  const startTime = Date.now()

  try {
    const response = await fetch(service.url(ip), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; IP-Lookup-Tool/2.0)",
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(10000),
    })

    const responseTime = Date.now() - startTime

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const responseText = await response.text()
    const data = JSON.parse(responseText)
    const processedData = service.transform(data)

    return {
      service: service.name,
      success: true,
      data: processedData,
      responseTime,
    }
  } catch (error) {
    return {
      service: service.name,
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      responseTime: Date.now() - startTime,
    }
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const ip = searchParams.get("ip")

  try {
    // Determine target IP
    let targetIP = ip
    if (!targetIP) {
      console.log("No IP provided, attempting to detect client IP...")

      // First try to get IP from headers
      const headerIP = getClientIP(request)
      if (headerIP) {
        targetIP = headerIP
        console.log(`Using IP from headers: ${targetIP}`)
      } else {
        console.log("No IP found in headers, trying external services...")
        // Fallback to external IP detection services
        const externalIP = await detectIPFromExternalService()
        if (externalIP) {
          targetIP = externalIP
          console.log(`Using IP from external service: ${targetIP}`)
        } else {
          console.log("All IP detection methods failed")
          return NextResponse.json(
            {
              error:
                "Unable to detect your IP address automatically. Please try entering an IP address manually or check your network connection.",
              suggestion: "You can use the manual lookup feature to analyze any IP address.",
            },
            { status: 400 },
          )
        }
      }
    }

    console.log("Looking up IP:", targetIP)

    // Call all services concurrently
    const apiPromises = IP_SERVICES.map((service) => callIPService(service, targetIP))
    const apiResults = await Promise.all(apiPromises)

    console.log(
      "API Results:",
      apiResults.map((r) => ({ service: r.service, success: r.success, responseTime: r.responseTime })),
    )

    // Extract successful results
    const successfulResults = apiResults
      .filter((result) => result.success && result.data)
      .map((result) => result.data as ProcessedIPInfo)

    if (successfulResults.length === 0) {
      const errors = apiResults.map((r) => `${r.service}: ${r.error}`).join(", ")
      throw new Error(`All IP lookup services failed: ${errors}`)
    }

    // Cross-reference results for accuracy
    const consolidatedResult = crossReferenceResults(successfulResults)

    // Return both individual results and consolidated result
    return NextResponse.json({
      consolidated: consolidatedResult,
      individual_results: apiResults,
      total_apis: IP_SERVICES.length,
      successful_apis: successfulResults.length,
    })
  } catch (error) {
    console.error("IP lookup error:", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "An unexpected error occurred",
        suggestion: "Please try again or use the manual lookup feature to analyze a specific IP address.",
      },
      { status: 500 },
    )
  }
}
