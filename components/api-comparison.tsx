"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Zap } from "lucide-react"

interface APIResult {
  service: string
  success: boolean
  data?: any
  error?: string
  responseTime?: number
}

interface APIComparisonProps {
  results: APIResult[]
}

export function APIComparison({ results }: APIComparisonProps) {
  const successfulCount = results.filter((r) => r.success).length
  const averageResponseTime =
    results.filter((r) => r.responseTime).reduce((acc, r) => acc + (r.responseTime || 0), 0) /
    results.filter((r) => r.responseTime).length

  return (
    <Card className="high-contrast-card shadow-2xl neon-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 high-contrast-text text-2xl">
          <Zap className="w-7 h-7 text-blue-400" />
          API Service Performance Analysis
        </CardTitle>
        <CardDescription className="text-white/70 text-lg">
          Cross-referencing {results.length} different IP lookup services • {successfulCount} successful • Avg response:{" "}
          {Math.round(averageResponseTime)}ms
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((result, index) => (
            <div
              key={index}
              className="p-6 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-white text-lg">{result.service}</h4>
                {result.success ? (
                  <CheckCircle className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm font-medium">Status:</span>
                  <Badge
                    variant={result.success ? "default" : "destructive"}
                    className={result.success ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                  >
                    {result.success ? "Success" : "Failed"}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm font-medium">Response Time:</span>
                  <span className="font-mono text-white font-bold">
                    {result.responseTime ? `${result.responseTime}ms` : "N/A"}
                  </span>
                </div>

                {result.success && result.data ? (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm font-medium">Country:</span>
                      <span className="text-white font-semibold">{result.data.country}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm font-medium">City:</span>
                      <span className="text-white font-semibold">{result.data.city}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm font-medium">ISP:</span>
                      <span className="text-white font-semibold truncate max-w-32" title={result.data.isp}>
                        {result.data.isp}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/70 text-sm font-medium">Accuracy:</span>
                      <Badge className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                        {Math.round(result.data.accuracy_score * 100)}%
                      </Badge>
                    </div>
                  </>
                ) : (
                  <div className="text-red-400 text-sm mt-3 p-2 bg-red-900/20 rounded border border-red-500/30">
                    <strong>Error:</strong> {result.error}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
