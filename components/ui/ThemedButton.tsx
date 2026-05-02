'use client'

import { useThemeColor } from '@/hooks/useThemeColor'
import React from 'react'

interface ThemedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function ThemedButton({
  variant = 'primary',
  size = 'md',
  children,
  className = '',
  ...props
}: ThemedButtonProps) {
  const { primary, secondary, accent, hover, focus } = useThemeColor()

  const sizeClasses = {
    sm: 'px-2 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  }

  if (variant === 'primary') {
    return (
      <button
        {...props}
        className={`font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 ${sizeClasses[size]} ${className}`}
        style={{
          backgroundColor: primary,
          color: 'white',
          ...props.style,
        }}
      >
        {children}
      </button>
    )
  }

  if (variant === 'secondary') {
    return (
      <button
        {...props}
        className={`font-semibold rounded-lg transition-all border-2 hover:scale-105 active:scale-95 ${sizeClasses[size]} ${className}`}
        style={{
          borderColor: primary,
          color: primary,
          backgroundColor: secondary + '40',
          ...props.style,
        }}
      >
        {children}
      </button>
    )
  }

  // ghost variant
  return (
    <button
      {...props}
      className={`font-semibold rounded-lg transition-all hover:scale-105 active:scale-95 ${sizeClasses[size]} ${className}`}
      style={{
        color: primary,
        backgroundColor: 'transparent',
        ...props.style,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = focus + '30'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {children}
    </button>
  )
}
