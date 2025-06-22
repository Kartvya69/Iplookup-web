"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CountryFlag } from "@/components/country-flag"
import { MapPin, AlertCircle, Loader2, Maximize2, Minimize2, ExternalLink, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"

interface IPInfo {
  ip: string
  city: string
  region: string
  country: string
  country_code: string
  latitude: number
  longitude: number
  postal_code?: string
}

interface InteractiveMapProps {
  ipInfo: IPInfo
}

declare global {
  interface Window {
    google: any
    initMap: () => void
  }
}

export function InteractiveMap({ ipInfo }: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isMapLoaded, setIsMapLoaded] = useState(false)
  const [apiKeyMissing, setApiKeyMissing] = useState(false)

  // Check if API key is available
  const hasApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY !== "YOUR_API_KEY" &&
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY.length > 10

  // Custom dark theme map styles to match the application
  const darkMapStyles = [
    {
      elementType: "geometry",
      stylers: [{ color: "#1a1a1a" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#1a1a1a" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#8ec3b9" }],
    },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#60a5fa" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#60a5fa" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#263c3f" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b9a76" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9ca5b3" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#746855" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1f2835" }],
    },
    {
      featureType: "road.highway",
      elementType: "labels.text.fill",
      stylers: [{ color: "#f3d19c" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#2f3948" }],
    },
    {
      featureType: "transit.station",
      elementType: "labels.text.fill",
      stylers: [{ color: "#60a5fa" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#515c6d" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.stroke",
      stylers: [{ color: "#17263c" }],
    },
  ]

  const loadGoogleMaps = () => {
    return new Promise<void>((resolve, reject) => {
      // Check if API key is missing
      if (!hasApiKey) {
        setApiKeyMissing(true)
        reject(new Error("Google Maps API key is missing or invalid"))
        return
      }

      // Check if Google Maps is already loaded
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]')
      if (existingScript) {
        // Wait for it to load
        const checkLoaded = setInterval(() => {
          if (window.google && window.google.maps) {
            clearInterval(checkLoaded)
            resolve()
          }
        }, 100)

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded)
          reject(new Error("Google Maps API failed to load within timeout"))
        }, 10000)
        return
      }

      // Create and load the script
      const script = document.createElement("script")
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=geometry`
      script.async = true
      script.defer = true

      script.onload = () => {
        // Double check that Google Maps loaded properly
        if (window.google && window.google.maps) {
          resolve()
        } else {
          reject(new Error("Google Maps API loaded but objects are not available"))
        }
      }

      script.onerror = (e) => {
        console.error("Google Maps script failed to load:", e)
        reject(new Error("Failed to load Google Maps API script"))
      }

      // Handle specific Google Maps API errors
      window.gm_authFailure = () => {
        setApiKeyMissing(true)
        reject(new Error("Google Maps API authentication failed - please check your API key"))
      }

      document.head.appendChild(script)
    })
  }

  const initializeMap = async () => {
    if (!mapRef.current || !ipInfo.latitude || !ipInfo.longitude) {
      setError("Invalid location data")
      setIsLoading(false)
      return
    }

    try {
      await loadGoogleMaps()

      const { latitude, longitude } = ipInfo
      const position = { lat: latitude, lng: longitude }

      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 10,
        styles: darkMapStyles,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: false, // We'll handle fullscreen ourselves
        zoomControl: true,
        mapTypeControlOptions: {
          style: window.google.maps.MapTypeControlStyle.DROPDOWN_MENU,
          position: window.google.maps.ControlPosition.TOP_RIGHT,
        },
        zoomControlOptions: {
          position: window.google.maps.ControlPosition.RIGHT_CENTER,
        },
      })

      // Create custom marker with IP info
      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: `${ipInfo.ip} - ${ipInfo.city}, ${ipInfo.country}`,
        animation: window.google.maps.Animation.DROP,
      })

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="color: #1a1a1a; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
            <div style="font-weight: bold; font-size: 16px; margin-bottom: 8px; color: #1e40af;">
              ${ipInfo.ip}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Location:</strong> ${ipInfo.city}, ${ipInfo.region}
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Country:</strong> ${ipInfo.country} (${ipInfo.country_code})
            </div>
            <div style="margin-bottom: 4px;">
              <strong>Coordinates:</strong> ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
            </div>
            ${ipInfo.postal_code ? `<div><strong>Postal Code:</strong> ${ipInfo.postal_code}</div>` : ""}
          </div>
        `,
      })

      // Show info window on marker click
      marker.addListener("click", () => {
        infoWindow.open(map, marker)
      })

      // Auto-open info window initially
      setTimeout(() => {
        infoWindow.open(map, marker)
      }, 1000)

      mapInstanceRef.current = map
      markerRef.current = marker
      setIsMapLoaded(true)
      setIsLoading(false)
    } catch (err) {
      console.error("Error initializing map:", err)
      if (apiKeyMissing) {
        setError("Google Maps API key is missing or invalid")
      } else {
        setError("Failed to load interactive map. Please check your internet connection.")
      }
      setIsLoading(false)
    }
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Trigger map resize after fullscreen toggle
    setTimeout(() => {
      if (mapInstanceRef.current) {
        window.google.maps.event.trigger(mapInstanceRef.current, "resize")
      }
    }, 100)
  }

  const centerMap = () => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setCenter(markerRef.current.getPosition())
      mapInstanceRef.current.setZoom(12)
    }
  }

  const openGoogleMapsExternal = () => {
    const url = `https://www.google.com/maps?q=${ipInfo.latitude},${ipInfo.longitude}&z=12`
    window.open(url, "_blank")
  }

  useEffect(() => {
    // Only try to initialize map if we have valid coordinates
    const isValidCoordinates = ipInfo.latitude !== 0 || ipInfo.longitude !== 0
    if (isValidCoordinates) {
      initializeMap()
    } else {
      setIsLoading(false)
    }
  }, [ipInfo])

  // Validate coordinates
  const isValidCoordinates = ipInfo.latitude !== 0 || ipInfo.longitude !== 0

  if (!isValidCoordinates) {
    return (
      <Card className="shadow-2xl high-contrast-card neon-glow">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 high-contrast-text text-2xl sm:text-3xl">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            Geographic Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-500/50 bg-yellow-900/20">
            <AlertCircle className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-200">
              Location coordinates are not available for this IP address. This may occur with certain types of networks
              or privacy-protected IPs.
            </AlertDescription>
          </Alert>

          {/* Fallback static visualization */}
          <div className="mt-6 aspect-video bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl flex items-center justify-center border border-white/10">
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
                <Badge className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold">{ipInfo.ip}</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card
      className={`shadow-2xl high-contrast-card neon-glow transition-all duration-300 ${
        isFullscreen ? "fixed inset-4 z-50 max-w-none" : ""
      }`}
    >
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400" />
            <div>
              <CardTitle className="high-contrast-text text-2xl sm:text-3xl">
                {isMapLoaded ? "Interactive Location Map" : "Geographic Visualization"}
              </CardTitle>
              <CardDescription className="text-white/70 flex items-center gap-2 mt-1">
                <CountryFlag countryCode={ipInfo.country_code} className="w-5 h-4" />
                {ipInfo.city}, {ipInfo.region}, {ipInfo.country}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={openGoogleMapsExternal}
              className="high-contrast-card border-white/30 hover:border-white/50 text-white hover:text-blue-400"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            {isMapLoaded && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={centerMap}
                  className="high-contrast-card border-white/30 hover:border-white/50 text-white hover:text-blue-400"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="high-contrast-card border-white/30 hover:border-white/50 text-white hover:text-blue-400"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error || apiKeyMissing ? (
          <div className="space-y-4">
            <Alert className="border-red-500/50 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                {apiKeyMissing ? (
                  <div className="space-y-2">
                    <p className="font-semibold">Google Maps API Key Required</p>
                    <p className="text-sm">To enable the interactive map, you need to set up a Google Maps API key.</p>
                  </div>
                ) : (
                  error
                )}
              </AlertDescription>
            </Alert>

            {apiKeyMissing && (
              <Alert className="border-blue-500/50 bg-blue-900/20">
                <Settings className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  <div className="space-y-3">
                    <p className="font-semibold">Setup Instructions:</p>
                    <ol className="text-sm space-y-1 list-decimal list-inside">
                      <li>
                        Go to the{" "}
                        <a
                          href="https://console.cloud.google.com/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Google Cloud Console
                        </a>
                      </li>
                      <li>Create a new project or select an existing one</li>
                      <li>Enable the "Maps JavaScript API"</li>
                      <li>Create an API key in the "Credentials" section</li>
                      <li>
                        Set the environment variable:{" "}
                        <code className="bg-black/30 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key</code>
                      </li>
                    </ol>
                    <div className="flex gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open("https://console.cloud.google.com/", "_blank")}
                        className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Google Cloud Console
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          window.open(
                            "https://developers.google.com/maps/documentation/javascript/get-api-key",
                            "_blank",
                          )
                        }
                        className="border-blue-400/50 text-blue-400 hover:bg-blue-400/10"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        API Key Guide
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Fallback static visualization */}
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
                  <div className="mt-4 space-y-2">
                    <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-mono">{ipInfo.ip}</Badge>
                    <p className="text-white/70 text-sm">
                      {ipInfo.latitude.toFixed(4)}, {ipInfo.longitude.toFixed(4)}
                    </p>
                  </div>
                  <Button
                    onClick={openGoogleMapsExternal}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in Google Maps
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Location Info Bar */}
            <div className="flex flex-wrap items-center gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-mono">{ipInfo.ip}</Badge>
              <div className="flex items-center gap-2 text-white/70">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">
                  {ipInfo.latitude.toFixed(4)}, {ipInfo.longitude.toFixed(4)}
                </span>
              </div>
              {ipInfo.postal_code && (
                <Badge variant="outline" className="border-white/30 text-white/70">
                  {ipInfo.postal_code}
                </Badge>
              )}
            </div>

            {/* Map Container */}
            <div
              className={`relative rounded-xl overflow-hidden border border-white/10 ${
                isFullscreen ? "h-[calc(100vh-200px)]" : "aspect-video"
              }`}
            >
              {isLoading && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 to-purple-900/30 flex items-center justify-center z-10">
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-400 animate-spin mx-auto" />
                    <p className="text-white/70">Loading interactive map...</p>
                  </div>
                </div>
              )}
              <div
                ref={mapRef}
                className="w-full h-full"
                style={{ minHeight: isFullscreen ? "calc(100vh - 200px)" : "400px" }}
              />
            </div>

            {/* Map Controls Info */}
            {isMapLoaded && (
              <div className="text-xs text-white/50 text-center space-y-1">
                <p>🖱️ Click and drag to pan • 🔍 Scroll to zoom • 📍 Click marker for details</p>
                <p>Use the controls in the top-right corner to change map type and view options</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
