'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader2 } from 'lucide-react'

interface VirtualScrollerProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => React.ReactNode
  itemHeight?: number
  containerHeight?: number
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => Promise<void>
  className?: string
}

/**
 * Virtual scrolling component for rendering large lists efficiently
 * Only renders items in the viewport + buffer
 */
export function VirtualScroller<T>({
  items,
  renderItem,
  itemHeight = 80,
  containerHeight = 600,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  className = '',
}: VirtualScrollerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 })

  const BUFFER = 5 // Render extra items above/below viewport for smoother scrolling

  // Calculate visible items based on scroll position
  useEffect(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - BUFFER)
    const end = Math.min(
      items.length,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + BUFFER
    )

    setVisibleRange({ start, end })

    // Check if we need to load more
    if (
      hasMore &&
      onLoadMore &&
      !isLoading &&
      end >= items.length - 5 // Load when near the bottom
    ) {
      onLoadMore().catch(console.error)
    }
  }, [scrollTop, itemHeight, containerHeight, items.length, hasMore, isLoading, onLoadMore])

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.target as HTMLDivElement
      setScrollTop(target.scrollTop)
    },
    []
  )

  const visibleItems = items.slice(visibleRange.start, visibleRange.end)
  const offsetY = visibleRange.start * itemHeight

  return (
    <div
      ref={containerRef}
      className={`overflow-y-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Spacer for items above viewport */}
      <div style={{ height: visibleRange.start * itemHeight }} />

      {/* Visible items */}
      <div>
        {visibleItems.map((item, index) => (
          <div key={visibleRange.start + index} style={{ height: itemHeight }}>
            {renderItem(item, visibleRange.start + index)}
          </div>
        ))}
      </div>

      {/* Spacer for items below viewport */}
      <div style={{ height: Math.max(0, (items.length - visibleRange.end) * itemHeight) }} />

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="animate-spin text-slate-500" />
        </div>
      )}
    </div>
  )
}

/**
 * Alternative: Infinite scroll component with pagination
 */
export function InfiniteScrollList<T>({
  items,
  renderItem,
  onLoadMore,
  isLoading = false,
  hasMore = false,
  className = '',
}: Omit<VirtualScrollerProps<T>, 'itemHeight' | 'containerHeight'> & {
  onLoadMore?: () => Promise<void>
}) {
  const observerTarget = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && onLoadMore) {
          onLoadMore().catch(console.error)
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [hasMore, isLoading, onLoadMore])

  return (
    <div className={className}>
      {items.map((item, index) => (
        <div key={index}>{renderItem(item, index)}</div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="animate-spin text-slate-500" />
        </div>
      )}

      {/* Intersection observer target */}
      {hasMore && <div ref={observerTarget} className="h-10" />}
    </div>
  )
}
