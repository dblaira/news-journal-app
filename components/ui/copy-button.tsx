'use client'

import { useState, useCallback } from 'react'
import { Copy, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface CopyButtonProps {
  value: string
  className?: string
  /** Size of the icon in pixels. Defaults to 16. */
  iconSize?: number
  /** Accessible label for the button. */
  label?: string
}

export function CopyButton({
  value,
  className,
  iconSize = 16,
  label = 'Copy to clipboard',
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback for older browsers / insecure contexts
      const textarea = document.createElement('textarea')
      textarea.value = value
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }, [value])

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip open={copied ? true : undefined}>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={label}
            className={cn(
              'inline-flex items-center justify-center rounded-md transition-colors',
              'hover:bg-neutral-100 active:bg-neutral-200',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 focus-visible:ring-offset-2',
              'disabled:pointer-events-none disabled:opacity-50',
              'h-8 w-8',
              className,
            )}
          >
            {copied ? (
              <Check size={iconSize} className="text-green-600" />
            ) : (
              <Copy size={iconSize} className="text-neutral-500" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {copied ? 'Copied!' : label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
