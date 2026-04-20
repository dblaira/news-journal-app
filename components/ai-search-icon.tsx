interface AiSearchIconProps {
  size?: number
  glassColor?: string
  sparkleColor?: string
  className?: string
}

export function AiSearchIcon({
  size = 18,
  glassColor = '#DC143C',
  sparkleColor = '#FFFFFF',
  className,
}: AiSearchIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: 'block' }}
    >
      {/* Open circle arc — gap at upper-right for the sparkle */}
      <path
        d="M 15 8 A 6.5 6.5 0 1 1 5.5 6.5"
        stroke={glassColor}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Handle */}
      <line
        x1="14"
        y1="16"
        x2="19.5"
        y2="21.5"
        stroke={glassColor}
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Diamond accent — signals AI, not a normal search */}
      <path
        d="M 11 1.5 L 14 4.8 L 11 8.1 L 8 4.8 Z"
        fill={sparkleColor}
        stroke={sparkleColor}
        strokeWidth="0.5"
        strokeLinejoin="round"
      />
    </svg>
  )
}
