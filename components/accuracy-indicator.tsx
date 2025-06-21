"use client"

import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Shield } from "lucide-react"

interface AccuracyIndicatorProps {
  score: number
  totalApis: number
  successfulApis: number
}

export function AccuracyIndicator({ score, totalApis, successfulApis }: AccuracyIndicatorProps) {
  const percentage = Math.round(score * 100)

  const getAccuracyLevel = (score: number) => {
    if (score >= 0.9)
      return { level: "Excellent", color: "bg-green-500", icon: CheckCircle, glow: "shadow-green-500/50" }
    if (score >= 0.7) return { level: "Good", color: "bg-yellow-500", icon: Shield, glow: "shadow-yellow-500/50" }
    return { level: "Fair", color: "bg-red-500", icon: AlertTriangle, glow: "shadow-red-500/50" }
  }

  const accuracy = getAccuracyLevel(score)
  const Icon = accuracy.icon

  return (
    <div
      className={`flex items-center justify-between p-6 rounded-xl bg-white/5 border border-white/20 shadow-2xl ${accuracy.glow}`}
    >
      <div className="flex items-center gap-4">
        <Icon className="w-8 h-8 text-white" />
        <div>
          <h3 className="font-bold text-white text-xl">Data Accuracy Assessment</h3>
          <p className="text-white/70 text-sm">Cross-referenced validation across multiple sources</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-center">
          <Badge className={`${accuracy.color} text-white text-lg px-4 py-2 font-bold`}>
            {accuracy.level} ({percentage}%)
          </Badge>
          <p className="text-white/70 text-sm mt-1">Confidence Level</p>
        </div>
        <div className="text-center">
          <span className="text-white font-bold text-2xl">
            {successfulApis}/{totalApis}
          </span>
          <p className="text-white/70 text-sm">APIs Successful</p>
        </div>
      </div>
    </div>
  )
}
