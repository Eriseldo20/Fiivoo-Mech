import type { SVGProps } from 'react'

/**
 * Modern automotive two-post lift with a raised vehicle.
 * Used as an at-a-glance marker that a job is currently up on the lift.
 */
export function CarLift({ ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Ground line */}
      <path d="M5 42h38" />
      {/* Two-post columns */}
      <path d="M9 42V7" />
      <path d="M39 42V7" />
      {/* Top overhead beam */}
      <path d="M7 7h34" />
      {/* Lift arms reaching under the car */}
      <path d="M9 24h7" />
      <path d="M32 24h7" />
      {/* Raised vehicle cabin + hood (modern car silhouette) */}
      <path d="M13 24l3.2-5.6a3 3 0 0 1 2.6-1.5h10.4a3 3 0 0 1 2.6 1.5L35 24" />
      <path d="M13 24h22v4.5a2 2 0 0 1-2 2H15a2 2 0 0 1-2-2V24Z" />
      {/* Windshield split */}
      <path d="M24 17v7" />
      {/* Wheels */}
      <circle cx="18" cy="30.5" r="2" />
      <circle cx="30" cy="30.5" r="2" />
    </svg>
  )
}
