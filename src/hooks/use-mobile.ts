import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Derived during render from the media query — no cascading setState
  // effect. Subscription still updates on viewport changes.
  const [subscribeKey] = React.useState(0)
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // Initialize state from outside the render path to avoid a sync
    // setState cascade on mount.
    const init = window.setTimeout(() => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT), 0)
    return () => {
      mql.removeEventListener("change", onChange)
      window.clearTimeout(init)
    }
  }, [subscribeKey])

  return !!isMobile
}
