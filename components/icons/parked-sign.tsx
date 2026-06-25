import type { SVGProps } from 'react'

/**
 * Simple "parked" sign: a rounded square with a bold red accent and a white "P".
 * Used to flag pending job cards so a mechanic can see at a glance that the
 * vehicle is parked / waiting, not yet on the lift.
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
      {/* Sign plate */}
      <rect x="6" y="6" width="36" height="36" rx="8" className="fill-red-600" />
      {/* Letter P */}
      <path
        d="M19 15h7.5a6.5 6.5 0 0 1 0 13H22v5h-3V15Zm3 3v7h4.5a3.5 3.5 0 0 0 0-7H22Z"
        className="fill-white"
      />
    </svg>
  )
}
