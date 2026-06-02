interface LogoProps {
  className?: string
  width?: number
}

export function Logo({ className, width = 200 }: LogoProps) {
  const height = Math.round(width * (130 / 540))
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 540 130"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="CarpStrike"
      className={className}
    >
      <path
        d="M10 70 L 70 70 L 80 70 L 88 54 L 98 90 L 108 70 L 150 70 L 165 70 L 178 38 L 192 104 L 206 70 L 250 70 L 262 70 L 275 14 L 290 120 L 305 70 L 330 70 L 345 70 L 356 50 L 367 88 L 377 70 L 430 70 L 445 70 L 456 56 L 466 84 L 476 70 L 530 70"
        stroke="#e8212b"
        strokeWidth="4"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x="270"
        y="84"
        fontFamily="'Barlow Condensed', Arial, sans-serif"
        fontSize="56"
        fontWeight="900"
        fontStyle="italic"
        fill="#0a0908"
        textAnchor="middle"
        stroke="#f4f0eb"
        strokeWidth="7"
        paintOrder="stroke"
      >
        CARP<tspan fill="#e8212b">STRIKE</tspan>
      </text>
    </svg>
  )
}
