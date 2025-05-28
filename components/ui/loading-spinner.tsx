import { Sword } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  text?: string
}

export function LoadingSpinner({ size = "md", text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  }

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
  }

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div
        className={`${sizeClasses[size]} bg-gradient-to-br from-yasuke-crimson to-yasuke-gold rounded-full flex items-center justify-center animate-pulse`}
      >
        <Sword className={`${iconSizes[size]} text-white animate-spin`} />
      </div>
      {text && <p className="text-muted-foreground text-sm">{text}</p>}
    </div>
  )
}
