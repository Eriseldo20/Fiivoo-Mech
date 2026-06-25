import type { SVGProps } from 'react'

/**
 * Automotive two-post lift with a raised vehicle.
 * Used as an at-a-glance marker that a job is currently up on the lift.
 */
export function CarLift({ ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {/* Lift posts */}
      <path d="M4 21V4" />
      <path d="M20 21V4" />
      {/* Top cross beam */}
      <path d="M3 4h18" />
      {/* Lift arms holding the car */}
      <path d="M4 12h3" />
      <path d="M17 12h3" />
      {/* Raised vehicle body */}
      <path d="M7 12.5h10l-1.2-2.2a1.5 1.5 0 0 0-1.3-.8H9.5a1.5 1.5 0 0 0-1.3.8L7 12.5Z" />
      <path d="M6.5 12.5h11v1.6a.9.9 0 0 1-.9.9H7.4a.9.9 0 0 1-.9-.9V12.5Z" />
      {/* Wheels */}
      <circle cx="9" cy="15.4" r="0.9" />
      <circle cx="15" cy="15.4" r="0.9" />
    </svg>
  )
}
