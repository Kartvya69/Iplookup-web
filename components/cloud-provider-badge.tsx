"use client"

import { Badge } from "@/components/ui/badge"

interface CloudProviderBadgeProps {
  provider?: string
  className?: string
}

const CLOUD_PROVIDERS = {
  aws: { name: "Amazon AWS", color: "bg-orange-500", icon: "☁️" },
  gcp: { name: "Google Cloud", color: "bg-blue-500", icon: "☁️" },
  azure: { name: "Microsoft Azure", color: "bg-blue-600", icon: "☁️" },
  digitalocean: { name: "DigitalOcean", color: "bg-blue-400", icon: "🌊" },
  cloudflare: { name: "Cloudflare", color: "bg-orange-400", icon: "⚡" },
  linode: { name: "Linode", color: "bg-green-500", icon: "☁️" },
  vultr: { name: "Vultr", color: "bg-blue-700", icon: "☁️" },
  hetzner: { name: "Hetzner", color: "bg-red-500", icon: "🔥" },
  ovh: { name: "OVH", color: "bg-blue-800", icon: "☁️" },
}

export function CloudProviderBadge({ provider, className }: CloudProviderBadgeProps) {
  if (!provider || !(provider in CLOUD_PROVIDERS)) {
    return null
  }

  const providerInfo = CLOUD_PROVIDERS[provider as keyof typeof CLOUD_PROVIDERS]

  return (
    <Badge className={`${providerInfo.color} text-white hover:opacity-80 ${className}`}>
      <span className="mr-1">{providerInfo.icon}</span>
      {providerInfo.name}
    </Badge>
  )
}
