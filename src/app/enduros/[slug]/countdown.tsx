'use client'

import { useEffect, useState } from 'react'
import styles from './enduro.module.css'

type Parts = { days: number; hours: number; mins: number; secs: number }

function diffToParts(targetMs: number): Parts | null {
  const diff = targetMs - Date.now()
  if (diff <= 0) return null
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff % 86_400_000) / 3_600_000),
    mins: Math.floor((diff % 3_600_000) / 60_000),
    secs: Math.floor((diff % 60_000) / 1000),
  }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Compte à rebours live jusqu'au début de l'enduro. */
export function Countdown({ targetIso }: { targetIso: string }) {
  const targetMs = new Date(targetIso).getTime()
  const [parts, setParts] = useState<Parts | null>(() => diffToParts(targetMs))

  useEffect(() => {
    const id = setInterval(() => setParts(diffToParts(targetMs)), 1000)
    return () => clearInterval(id)
  }, [targetMs])

  if (!parts) {
    return <div className={styles.countdownStarted}>L’enduro a commencé</div>
  }

  const cells: [number, string][] = [
    [parts.days, 'Jours'],
    [parts.hours, 'Heures'],
    [parts.mins, 'Min'],
    [parts.secs, 'Sec'],
  ]

  return (
    <div className={styles.countdown}>
      {cells.map(([val, unit]) => (
        <div key={unit} className={styles.countdownCell}>
          <div className={styles.countdownNum}>{pad(val)}</div>
          <div className={styles.countdownUnit}>{unit}</div>
        </div>
      ))}
    </div>
  )
}
