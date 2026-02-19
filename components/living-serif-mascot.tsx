'use client'

import { cn } from '@/lib/utils'

interface LivingSerifMascotProps {
  isProcessing?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const fontSizes = {
  sm: '4rem',
  md: '6rem',
  lg: '8rem',
  xl: '12rem',
}

export function LivingSerifMascot({ isProcessing = false, size = 'lg' }: LivingSerifMascotProps) {
  return (
    <span
      role="img"
      aria-label="Understood mascot"
      style={{
        fontFamily: "var(--font-bodoni-moda), 'Bodoni Moda', serif",
        fontSize: fontSizes[size],
        lineHeight: 1,
        userSelect: 'none',
        whiteSpace: 'nowrap',
        display: 'inline-block',
      }}
    >
      <span
        className={cn(
          'transition-colors duration-[2000ms] ease-in-out',
          isProcessing ? 'animate-enlightenment' : 'text-black'
        )}
      >
        U
      </span>
      <span
        className={cn(isProcessing ? 'animate-heartbeat' : '')}
        style={{
          display: 'inline-block',
          width: '0.09em',
          height: '0.09em',
          borderRadius: '50%',
          backgroundColor: '#DC143C',
          verticalAlign: 'baseline',
          marginLeft: '0.05em',
        }}
      />
    </span>
  )
}
