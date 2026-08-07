import type { SVGProps } from 'react'

/**
 * Two-post automotive lift, drawn as a clean monochrome line icon that tints
 * with `currentColor` to match the Fiivoo brand-blue status system. Used to
 * flag job cards whose vehicle is actively raised on the lift.
 */
export function CarLift({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Floor */}
      <path d="M7 41h34" />
      {/* Posts */}
      <path d="M14 41V9" />
      <path d="M34 41V9" />
      {/* Overhead beam */}
      <path d="M12.5 9h23" />
      {/* Lift arms */}
      <path d="M14 28h6" />
      <path d="M34 28h-6" />
      {/* Raised vehicle body */}
      <path d="M17 28v-3.2l2.4-3.8h9.2l2.4 3.8V28" />
      <path d="M20 21.2V18.5h8v2.7" />
      {/* Wheels */}
      <circle cx="21" cy="28" r="1.7" fill="currentColor" stroke="none" />
      <circle cx="27" cy="28" r="1.7" fill="currentColor" stroke="none" />
    </svg>
  )
}
