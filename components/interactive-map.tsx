"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CountryFlag } from "@/components/country-flag"
import { MapPin, AlertCircle, Loader2, Maximize2, Minimize2, ExternalLink, Layers, RotateCcw } from "lucide-react"
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
    L: any
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
  const [currentLayer, setCurrentLayer] = useState<"street" | "satellite" | "terrain">("street")

  // Map layer configurations
  const mapLayers = {
    street: {
      name: "Street Map",
      url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      name: "Satellite",
      url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      attribution:
        '© <a href="https://www.esri.com/">Esri</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
    terrain: {
      name: "Terrain",
      url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
      attribution:
        '© <a href="https://opentopomap.org/">OpenTopoMap</a>, © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  }

  const loadLeaflet = () => {
    return new Promise<void>((resolve, reject) => {
      // Check if Leaflet is already loaded
      if (window.L) {
        resolve()
        return
      }

      // Check if scripts are already being loaded
      const existingScript = document.querySelector('script[src*="leaflet"]')
      if (existingScript) {
        // Wait for it to load
        const checkLoaded = setInterval(() => {
          if (window.L) {
            clearInterval(checkLoaded)
            resolve()
          }
        }, 100)

        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(checkLoaded)
          reject(new Error("Leaflet failed to load within timeout"))
        }, 10000)
        return
      }

      // Load CSS first
      const cssLink = document.createElement("link")
      cssLink.rel = "stylesheet"
      cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
      cssLink.crossOrigin = ""
      document.head.appendChild(cssLink)

      // Load JavaScript
      const script = document.createElement("script")
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
      script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
      script.crossOrigin = ""
      script.async = true
      script.defer = true

      script.onload = () => {
        // Double check that Leaflet loaded properly
        if (window.L) {
          resolve()
        } else {
          reject(new Error("Leaflet loaded but objects are not available"))
        }
      }

      script.onerror = (e) => {
        console.error("Leaflet script failed to load:", e)
        reject(new Error("Failed to load Leaflet library"))
      }

      document.head.appendChild(script)
    })
  }

  const createCustomIcon = () => {
    if (!window.L) return null

    return window.L.divIcon({
      className: "custom-marker",
      html: `
        <div style="
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-45deg);
          position: relative;
        ">
          <div style="
            color: white;
            font-size: 14px;
            font-weight: bold;
            transform: rotate(45deg);
          ">📍</div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    })
  }

  const initializeMap = async () => {
    if (!mapRef.current || !ipInfo.latitude || !ipInfo.longitude) {
      setError("Invalid location data")
      setIsLoading(false)
      return
    }

    try {
      await loadLeaflet()

      const { latitude, longitude } = ipInfo

      // Initialize map
      const map = window.L.map(mapRef.current, {
        center: [latitude, longitude],
        zoom: 10,
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: true,
        doubleClickZoom: true,
        dragging: true,
      })

      // Add initial tile layer
      const currentLayerConfig = mapLayers[currentLayer]
      const tileLayer = window.L.tileLayer(currentLayerConfig.url, {
        attribution: currentLayerConfig.attribution,
        maxZoom: 18,
        tileSize: 256,
        zoomOffset: 0,
      })
      tileLayer.addTo(map)

      // Create custom marker
      const customIcon = createCustomIcon()
      const marker = window.L.marker([latitude, longitude], {
        icon: customIcon,
        title: `${ipInfo.ip} - ${ipInfo.city}, ${ipInfo.country}`,
      }).addTo(map)

      // Create popup content
      const popupContent = `
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 200px; color: #1a1a1a;">
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
      `

      marker.bindPopup(popupContent)

      // Auto-open popup initially
      setTimeout(() => {
        marker.openPopup()
      }, 1000)

      // Add a circle to show approximate area
      const circle = window.L.circle([latitude, longitude], {
        color: "#3b82f6",
        fillColor: "#3b82f6",
        fillOpacity: 0.1,
        radius: 5000, // 5km radius
        weight: 2,
      }).addTo(map)

      mapInstanceRef.current = map
      markerRef.current = marker
      setIsMapLoaded(true)
      setIsLoading(false)
    } catch (err) {
      console.error("Error initializing map:", err)
      setError("Failed to load interactive map. Please check your internet connection.")
      setIsLoading(false)
    }
  }

  const changeMapLayer = (layerType: "street" | "satellite" | "terrain") => {
    if (!mapInstanceRef.current) return

    // Remove all existing tile layers
    mapInstanceRef.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.TileLayer) {
        mapInstanceRef.current.removeLayer(layer)
      }
    })

    // Add new tile layer
    const layerConfig = mapLayers[layerType]
    const tileLayer = window.L.tileLayer(layerConfig.url, {
      attribution: layerConfig.attribution,
      maxZoom: 18,
      tileSize: 256,
      zoomOffset: 0,
    })
    tileLayer.addTo(mapInstanceRef.current)

    setCurrentLayer(layerType)
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
    // Trigger map resize after fullscreen toggle
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 100)
  }

  const centerMap = () => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.setView([ipInfo.latitude, ipInfo.longitude], 12)
      markerRef.current.openPopup()
    }
  }

  const resetView = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([ipInfo.latitude, ipInfo.longitude], 10)
      if (markerRef.current) {
        markerRef.current.openPopup()
      }
    }
  }

  const openExternalMap = () => {
    const url = `https://www.openstreetmap.org/?mlat=${ipInfo.latitude}&mlon=${ipInfo.longitude}&zoom=12`
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

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
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
              <CardTitle className="high-contrast-text text-2xl sm:text-3xl">Interactive Location Map</CardTitle>
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
              onClick={openExternalMap}
              className="high-contrast-card border-white/30 hover:border-white/50 text-white hover:text-blue-400"
              title="Open in OpenStreetMap"
            >
              <ExternalLink className="w-4 h-4" />
            </Button>
            {isMapLoaded && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetView}
                  className="high-contrast-card border-white/30 hover:border-white/50 text-white hover:text-blue-400"
                  title="Reset view"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={centerMap}
                  className="high-contrast-card border-white/30 hover:border-white/50 text-white hover:text-blue-400"
                  title="Center on location"
                >
                  <MapPin className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="high-contrast-card border-white/30 hover:border-white/50 text-white hover:text-blue-400"
                  title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="space-y-4">
            <Alert className="border-red-500/50 bg-red-900/20">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">{error}</AlertDescription>
            </Alert>

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
                    onClick={openExternalMap}
                    className="mt-4 bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View in OpenStreetMap
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Location Info Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
              <div className="flex flex-wrap items-center gap-3">
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

              {/* Map Layer Controls */}
              {isMapLoaded && (
                <div className="flex items-center gap-1">
                  <Layers className="w-4 h-4 text-white/50 mr-2" />
                  {Object.entries(mapLayers).map(([key, layer]) => (
                    <Button
                      key={key}
                      variant={currentLayer === key ? "default" : "ghost"}
                      size="sm"
                      onClick={() => changeMapLayer(key as "street" | "satellite" | "terrain")}
                      className={`text-xs px-2 py-1 h-7 ${
                        currentLayer === key
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "text-white/70 hover:text-white hover:bg-white/10"
                      }`}
                    >
                      {layer.name}
                    </Button>
                  ))}
                </div>
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
                    <p className="text-white/50 text-sm">Powered by OpenStreetMap</p>
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
                <p>
                  Powered by{" "}
                  <a
                    href="https://www.openstreetmap.org/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 underline"
                  >
                    OpenStreetMap
                  </a>{" "}
                  • Free and open-source mapping
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
