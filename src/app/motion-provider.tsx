'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

const REVEAL_SELECTOR = '[data-reveal]'

export default function MotionProvider() {
  const pathname = usePathname()

  useEffect(() => {
    document.documentElement.classList.add('motion-ready')

    let observer: IntersectionObserver | null = null
    let frameId = 0

    function setupObserver() {
      const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR))

      if (elements.length === 0) return

      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue

            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          }
        },
        {
          threshold: 0.14,
          rootMargin: '0px 0px -8% 0px',
        }
      )

      for (const element of elements) {
        element.classList.remove('is-visible')
        observer.observe(element)
      }
    }

    frameId = window.requestAnimationFrame(setupObserver)

    return () => {
      window.cancelAnimationFrame(frameId)
      observer?.disconnect()
      document.documentElement.classList.remove('motion-ready')
    }
  }, [pathname])

  return null
}
