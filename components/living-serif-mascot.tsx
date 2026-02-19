'use client'

import { cn } from '@/lib/utils'

interface LivingSerifMascotProps {
  isProcessing?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeMap = {
  sm: { u: 'text-6xl', dot: 'w-2.5 h-2.5', dotOffset: 'mb-2.5', gap: 'gap-0.5' },
  md: { u: 'text-8xl', dot: 'w-3.5 h-3.5', dotOffset: 'mb-3.5', gap: 'gap-1' },
  lg: { u: 'text-9xl', dot: 'w-4 h-4', dotOffset: 'mb-4', gap: 'gap-1' },
  xl: { u: 'text-[12rem]', dot: 'w-5 h-5', dotOffset: 'mb-6', gap: 'gap-1.5' },
}

export function LivingSerifMascot({ isProcessing = false, size = 'lg' }: LivingSerifMascotProps) {
  const s = sizeMap[size]

  return (
    <div className={cn('flex items-end', s.gap)} role="img" aria-label="Understood mascot">
      <span
        className={cn(
          'font-serif leading-none transition-colors duration-[2000ms] ease-in-out select-none',
          s.u,
          isProcessing ? 'animate-enlightenment' : 'text-black'
        )}
        style={{ fontFamily: "var(--font-bodoni-moda), 'Bodoni Moda', serif" }}
      >
        U
      </span>

      <div className={s.dotOffset}>
        <div
          className={cn(
            'rounded-full',
            s.dot,
            isProcessing ? 'animate-heartbeat' : 'opacity-100'
          )}
          style={{ backgroundColor: '#DC143C' }}
        />
      </div>
    </div>
  )
}
