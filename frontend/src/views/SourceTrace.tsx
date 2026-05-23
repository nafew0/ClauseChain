'use client'
import { useState } from 'react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import PipelineStepper from '@/components/clausechain/PipelineStepper'
import { TRACE_HIGHLIGHTS, TraceHighlight } from '@/lib/clausechain/data'
import { CheckCircle, Clock } from 'lucide-react'

const PILLARS_ALL = Array.from(new Set(TRACE_HIGHLIGHTS.map(t => t.pillar)))

const SOURCE_TEXT_CONTEXT = `CHAPTER V — CRIMES AND PUNISHMENTS

Section 12. Lawful basis for processing

(1) No person shall process personal data without the explicit consent of the data subject, except as provided under sections 14, 15 and 18 of this Act.

Section 14. Purpose limitation

(1) Data collected for a specific purpose shall not be used for any other purpose without the express consent of the data subject, unless required by law.

Section 21. Rights of data subjects

(1) A data subject shall have the right to obtain confirmation of whether personal data concerning them is being processed, and where that is the case, access to that data.

Section 26. Data localization

(1) Any person who, intentionally or knowingly without lawful authority, collects, sells, takes possession of, supplies or uses any person's identity-related information, shall not save such data, including biometric information, photographs, financial records or registry information, outside the geographic boundaries of Bangladesh.

Section 29. Cross-border transfers

(1) Cross-border transfer of personal data may be permitted subject to the prior approval of the competent authority and the existence of adequate safeguards.

Section 35. Breach notification

(1) The controller shall notify the supervisory authority of a personal data breach without undue delay and, where feasible, not later than seventy-two hours after having become aware of it.`

function buildExtractedContent(highlights: TraceHighlight[], activeId: string | null, onHover: (id: string | null) => void) {
  // Build annotated extracted text
  return (
    <div className="trace-text-body">
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 16 }}>
        BD-DSA-2018 · Extracted clauses · {highlights.length} spans
      </div>
      {highlights.map(h => (
        <div key={h.id} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, fontWeight: 600, color: 'var(--cc-ink-500)' }}>{h.ref}</span>
            <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-ink-400)' }}>p.{h.page}</span>
            <span className={`trace-span ${activeId === h.id ? 'active' : ''}`}
              style={{ fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: h.color + '20', color: h.color, cursor: 'pointer' }}
              onMouseEnter={() => onHover(h.id)}
              onMouseLeave={() => onHover(null)}
            >
              Pillar {h.pillar} · {h.textLabel}
            </span>
            {h.status === 'verified'
              ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#047857', background: '#ECFDF5', padding: '2px 6px', borderRadius: 999 }}><CheckCircle size={10} /> verified</span>
              : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#B45309', background: '#FFFBEB', padding: '2px 6px', borderRadius: 999 }}><Clock size={10} /> pending</span>
            }
          </div>
          <span
            className={`trace-span ${activeId === h.id ? 'active' : ''} ${h.matchType === 'fuzzy' ? 'fuzzy' : ''}`}
            style={{
              background: h.color + (h.matchType === 'approximate' ? '18' : '22'),
              color: 'var(--cc-ink-900)',
              lineHeight: 1.75,
              display: 'block',
              padding: '8px 10px',
              borderRadius: 6,
              fontSize: 14,
              border: activeId === h.id ? `2px solid ${h.color}` : `1px solid ${h.color}40`,
              transition: 'border-color 150ms',
              cursor: 'pointer',
            }}
            onMouseEnter={() => onHover(h.id)}
            onMouseLeave={() => onHover(null)}
          >
            {h.extractedText}
          </span>
          <div style={{ display: 'flex', gap: 10, marginTop: 4, fontSize: 11, color: 'var(--cc-ink-400)', fontFamily: 'var(--cc-font-mono)' }}>
            <span>conf {h.confidence.toFixed(2)}</span>
            <span>·</span>
            <span>{h.matchType}</span>
          </div>
        </div>
      ))}
    </div>
  )
}

function buildSourceDocument(highlights: TraceHighlight[], activeId: string | null, onHover: (id: string | null) => void) {
  // Annotate the source text with color highlights
  let processedText = SOURCE_TEXT_CONTEXT
  const activeHighlight = highlights.find(h => h.id === activeId)

  return (
    <div className="trace-source-body">
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', marginBottom: 16, fontFamily: 'var(--cc-font-display)' }}>
        BD-DSA-2018 · Source document
      </div>
      {SOURCE_TEXT_CONTEXT.split('\n\n').map((para, pi) => {
        // Check if any highlight matches part of this paragraph
        const matchedHighlight = highlights.find(h => {
          const firstWords = h.extractedText.slice(0, 30)
          return para.includes(firstWords.slice(0, 20))
        })

        if (matchedHighlight) {
          const isActive = activeId === matchedHighlight.id
          return (
            <div
              key={pi}
              style={{ marginBottom: 16 }}
            >
              {para.split('\n').map((line, li) => {
                const isHighlightLine = matchedHighlight.extractedText.slice(0, 25).includes(line.slice(0, 20)) || (line.length > 20 && matchedHighlight.extractedText.includes(line.slice(0, 20)))
                return (
                  <div
                    key={li}
                    className={`trace-bbox ${matchedHighlight.matchType === 'fuzzy' ? 'fuzzy' : ''} ${isActive ? 'active' : ''}`}
                    style={{
                      display: 'block',
                      background: isHighlightLine ? matchedHighlight.color + (isActive ? '30' : '18') : 'transparent',
                      color: 'inherit',
                      borderRadius: 3,
                      marginBottom: 2,
                      padding: '1px 3px',
                      cursor: 'pointer',
                    }}
                    onMouseEnter={() => onHover(matchedHighlight.id)}
                    onMouseLeave={() => onHover(null)}
                  >
                    {line || <br />}
                  </div>
                )
              })}
            </div>
          )
        }

        return (
          <div key={pi} style={{ marginBottom: 16 }}>
            {para.split('\n').map((line, li) => (
              <div key={li} style={{ marginBottom: 2 }}>{line || <br />}</div>
            ))}
          </div>
        )
      })}
    </div>
  )
}

export default function SourceTrace() {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [pillarFilter, setPillarFilter] = useState<string | null>(null)

  const filtered = pillarFilter
    ? TRACE_HIGHLIGHTS.filter(h => h.pillar === pillarFilter)
    : TRACE_HIGHLIGHTS

  const verified = TRACE_HIGHLIGHTS.filter(h => h.status === 'verified').length
  const pending = TRACE_HIGHLIGHTS.filter(h => h.status === 'pending').length

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline' }, { label: 'Source Trace' }]}>
      <PipelineStepper activeId="verify" />

      <div style={{ padding: '20px 32px 60px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, marginBottom: 16 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 700, fontSize: 22, color: 'var(--cc-ink-950)', margin: 0 }}>Source Trace</h1>
            <p style={{ fontSize: 13, color: 'var(--cc-ink-500)', marginTop: 4 }}>BD-DSA-2018 · {TRACE_HIGHLIGHTS.length} spans · {verified} verified · {pending} pending</p>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="flex items-center gap-2 px-4 h-9 rounded-[10px] text-sm font-medium border border-cc-ink-300 bg-white text-cc-ink-900 hover:bg-cc-ink-50 transition-colors">
              Export
            </button>
            <a href="/ledger" className="flex items-center gap-2 px-4 h-9 rounded-[10px] text-sm font-medium bg-cc-teal-600 text-white hover:bg-[#0E9F92] transition-colors" style={{ textDecoration: 'none' }}>
              Commit to ledger →
            </a>
          </div>
        </div>

        {/* Legend / pillar filter */}
        <div className="legend-bar">
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cc-ink-500)' }}>Filter:</span>
          <div
            className={`legend-item ${pillarFilter === null ? 'active' : ''}`}
            style={{ color: 'var(--cc-ink-700)', background: 'var(--cc-ink-100)' }}
            onClick={() => setPillarFilter(null)}
          >
            All spans
          </div>
          {TRACE_HIGHLIGHTS.map(h => (
            <div
              key={h.id}
              className={`legend-item ${pillarFilter === h.pillar ? 'active' : ''}`}
              style={{ color: h.color, background: h.color + '18' }}
              onClick={() => setPillarFilter(pillarFilter === h.pillar ? null : h.pillar)}
            >
              <span className="legend-dot" style={{ background: h.color }} />
              {h.pillar} · {h.textLabel}
            </div>
          ))}
        </div>

        {/* Dual panel */}
        <div className="trace-layout">
          {/* Left: Extracted text */}
          <div className="trace-panel">
            <div className="trace-panel-header">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cc-teal-600)' }} />
              Extracted text · {filtered.length} spans
            </div>
            {buildExtractedContent(filtered, activeId, setActiveId)}
          </div>

          {/* Divider */}
          <div className="trace-panel-divider" />

          {/* Right: Source document */}
          <div className="trace-panel">
            <div className="trace-panel-header">
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#F59E0B' }} />
              Source document · BD-DSA-2018
            </div>
            {buildSourceDocument(TRACE_HIGHLIGHTS, activeId, setActiveId)}
          </div>
        </div>

        {/* Active span detail bar */}
        {activeId && (() => {
          const h = TRACE_HIGHLIGHTS.find(t => t.id === activeId)
          if (!h) return null
          return (
            <div style={{ marginTop: 16, background: 'white', border: `2px solid ${h.color}`, borderRadius: 14, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: h.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, fontWeight: 700, color: h.color }}>{h.ref}</span>
                <span style={{ fontSize: 12, color: 'var(--cc-ink-600)', margin: '0 8px' }}>·</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cc-ink-900)' }}>Pillar {h.pillar} — {h.textLabel}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--cc-ink-500)' }}>
                <span>page {h.page}</span>
                <span>·</span>
                <span>conf {h.confidence.toFixed(2)}</span>
                <span>·</span>
                <span>{h.matchType}</span>
                <span>·</span>
                <span style={{ color: h.status === 'verified' ? '#047857' : '#B45309', fontWeight: 500 }}>{h.status}</span>
              </div>
            </div>
          )
        })()}
      </div>
    </WorkspaceShell>
  )
}
