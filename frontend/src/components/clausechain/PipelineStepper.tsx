'use client'
import Link from 'next/link'
import { Check, Zap } from 'lucide-react'

const STEPS = [
  { id: 'discover', label: 'Discover', href: '/pipeline/crawl'   },
  { id: 'harvest',  label: 'Harvest',  href: '/pipeline/harvest' },
  { id: 'separate', label: 'Separate', href: null                 },
  { id: 'convert',  label: 'Convert',  href: '/pipeline/extract' },
  { id: 'ocr',      label: 'OCR',      href: '/pipeline/extract' },
  { id: 'embed',    label: 'Embed',    href: null                 },
  { id: 'map',      label: 'Map',      href: '/pipeline/map'     },
  { id: 'verify',   label: 'Verify',   href: null                 },
]

interface PipelineStepperProps {
  activeId: string
}

export default function PipelineStepper({ activeId }: PipelineStepperProps) {
  const activeIdx = STEPS.findIndex(s => s.id === activeId)

  return (
    <div className="pipeline-stepper">
      <div className="stepper-run-badge">
        <Zap size={11} />
        run-BD-001
      </div>
      <div className="stepper-track">
        {STEPS.map((step, i) => {
          const status = i < activeIdx ? 'done' : i === activeIdx ? 'active' : 'queued'
          const clickable = status === 'done' && !!step.href

          const inner = (
            <>
              <div className="ss-circle">
                {status === 'done'
                  ? <Check size={11} strokeWidth={3} />
                  : <span>{i + 1}</span>}
              </div>
              <span className="ss-label">{step.label}</span>
            </>
          )

          return (
            <span key={step.id} style={{ display: 'contents' }}>
              {clickable && step.href ? (
                <Link
                  href={step.href}
                  className={`stepper-step ss-${status} ss-clickable`}
                  style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 7 }}
                >
                  {inner}
                </Link>
              ) : (
                <div className={`stepper-step ss-${status}`}>
                  {inner}
                </div>
              )}
              {i < STEPS.length - 1 && (
                <div className={`ss-connector ${status === 'done' ? 'ss-connector-done' : ''}`} />
              )}
            </span>
          )
        })}
      </div>
    </div>
  )
}
