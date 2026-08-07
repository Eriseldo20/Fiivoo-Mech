import type { SVGProps } from 'react'

/**
 * "Parked" badge: a rounded-square outline enclosing a solid "P". Drawn as a
 * monochrome icon that tints with `currentColor` so it matches the Fiivoo
 * brand-blue status system alongside the lift marker. Flags pending job cards
 * whose vehicle is parked / waiting, not yet on the lift.
 */
export function ParkedSign({ title, ...props }: SVGProps<SVGSVGElement> & { title?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      {...props}
    >
      {title ? <title>{title}</title> : null}
      {/* Badge plate */}
      <rect
        x="7"
        y="7"
        width="34"
        height="34"
        rx="9"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
      />
      {/* Letter P */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M18 15.5h7.2a6.3 6.3 0 0 1 0 12.6H21V33h-3V15.5Zm3 3v6.6h4.2a3.3 3.3 0 0 0 0-6.6H21Z"
        fill="currentColor"
      />
    </svg>
  )
}
