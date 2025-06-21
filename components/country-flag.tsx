"use client"

interface CountryFlagProps {
  countryCode: string
  className?: string
}

export function CountryFlag({ countryCode, className = "w-6 h-4" }: CountryFlagProps) {
  if (!countryCode || countryCode === "Unknown") {
    return <div className={`${className} bg-gray-200 dark:bg-gray-600 rounded`} />
  }

  // Use flag emoji or fallback to flag API
  const flagEmoji = countryCode.toUpperCase().replace(/./g, (char) => String.fromCodePoint(127397 + char.charCodeAt(0)))

  return (
    <div className={`${className} flex items-center justify-center text-lg overflow-hidden rounded`}>
      <span>{flagEmoji}</span>
    </div>
  )
}
