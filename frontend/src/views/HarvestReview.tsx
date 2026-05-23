'use client'
import { useState } from 'react'
import WorkspaceShell from '@/components/clausechain/WorkspaceShell'
import PipelineStepper from '@/components/clausechain/PipelineStepper'
import { HARVESTED_DOCS, HarvestedDoc } from '@/lib/clausechain/data'
import { Layers, FileText, Globe, Hash, Filter, Zap, Trash2, Check } from 'lucide-react'

const DOC_TYPES = [
  { id: 'all',         label: 'All documents',  icon: Layers   },
  { id: 'native-pdf',  label: 'Native PDF',      icon: FileText },
  { id: 'scanned-pdf', label: 'Scanned PDF',     icon: FileText },
  { id: 'html',        label: 'HTML',            icon: Globe    },
  { id: 'docx',        label: 'DOCX',            icon: FileText },
  { id: 'markdown',    label: 'Markdown / TXT',  icon: Hash     },
  { id: 'table',       label: 'Tables',          icon: FileText },
  { id: 'other',       label: 'Other / Unknown', icon: FileText },
]

const TYPE_LABELS: Record<string, { label: string; cls: string }> = {
  'native-pdf':  { label: 'Native PDF',  cls: 'type-native-pdf'  },
  'scanned-pdf': { label: 'Scanned PDF', cls: 'type-scanned-pdf' },
  'html':        { label: 'HTML',        cls: 'type-html'        },
  'docx':        { label: 'DOCX',        cls: 'type-docx'        },
  'markdown':    { label: 'Markdown',    cls: 'type-markdown'    },
  'table':       { label: 'Table',       cls: 'type-table'       },
  'other':       { label: 'Other',       cls: 'type-other'       },
}

const FLAG_COLORS: Record<string, { label: string; color: string }> = {
  'draft':         { label: 'Draft',        color: '#F59E0B' },
  'press-release': { label: 'Press release', color: '#71717A' },
  'guideline':     { label: 'Guideline',    color: '#3B82F6' },
  'irrelevant':    { label: 'Irrelevant',   color: '#EF4444' },
}

const confColor = (c: number) => c > 0.8 ? '#10B981' : c > 0.5 ? '#F59E0B' : '#EF4444'

function HarvestCard({ doc, onToggle, isSelected, onSelect }: { doc: HarvestedDoc; onToggle: (id: string) => void; isSelected: boolean; onSelect: () => void }) {
  const tl = TYPE_LABELS[doc.type] ?? { label: doc.type, cls: 'type-other' }
  return (
    <div
      className={`harvest-card ${doc.keep ? '' : 'discarded'}`}
      style={{ cursor: 'pointer', borderColor: isSelected ? 'var(--cc-teal-500)' : '', background: isSelected ? 'var(--cc-teal-50)' : '' }}
      onClick={onSelect}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <span className={`type-badge ${tl.cls}`}>{tl.label}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} onClick={e => { e.stopPropagation(); onToggle(doc.id) }}>
          <span style={{ fontSize: 11, color: doc.keep ? 'var(--cc-teal-600)' : 'var(--cc-ink-400)', fontWeight: 500 }}>
            {doc.keep ? 'Keep' : 'Discard'}
          </span>
          <button className={`keep-toggle ${doc.keep ? 'on' : 'off'}`} onClick={e => { e.stopPropagation(); onToggle(doc.id) }} />
        </div>
      </div>

      {/* Title */}
      <div className="harvest-card-title" style={{ fontSize: 14, fontWeight: 600, color: 'var(--cc-ink-950)', marginBottom: 5, lineHeight: 1.35 }}>{doc.title}</div>

      {/* URL */}
      <div style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 11, color: 'var(--cc-ink-500)', marginBottom: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {doc.url.replace('https://', '')}
      </div>

      {/* Meta */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 10 }}>
        {doc.lang !== '—' && (
          <span style={{ fontSize: 11, color: 'var(--cc-ink-600)', background: 'var(--cc-ink-100)', padding: '2px 7px', borderRadius: 999 }}>{doc.lang}</span>
        )}
        {doc.pages && <span style={{ fontSize: 11, color: 'var(--cc-ink-500)' }}>{doc.pages} pp</span>}
        <span style={{ fontSize: 11, color: 'var(--cc-ink-500)' }}>{doc.size}</span>
        {doc.flags.map(f => {
          const fl = FLAG_COLORS[f] ?? { label: f, color: '#71717A' }
          return (
            <span key={f} style={{ fontSize: 11, fontWeight: 500, color: fl.color, background: fl.color + '18', padding: '2px 7px', borderRadius: 999 }}>{fl.label}</span>
          )
        })}
      </div>

      {/* Confidence bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)', minWidth: 68 }}>Confidence</span>
        <div style={{ flex: 1, height: 5, background: 'var(--cc-ink-100)', borderRadius: 999, overflow: 'hidden' }}>
          <div style={{ height: '100%', background: confColor(doc.confidence), width: `${doc.confidence * 100}%`, borderRadius: 999, transition: 'width 400ms ease' }} />
        </div>
        <span style={{ fontFamily: 'var(--cc-font-mono)', fontSize: 12, fontWeight: 700, color: confColor(doc.confidence), minWidth: 34, textAlign: 'right' }}>
          {doc.confidence.toFixed(2)}
        </span>
      </div>
    </div>
  )
}

export default function HarvestReview() {
  const [docs, setDocs] = useState<HarvestedDoc[]>(HARVESTED_DOCS)
  const [activeType, setActiveType] = useState('all')
  const [selected, setSelected] = useState<string | null>(null)

  const toggleKeep = (id: string) => setDocs(ds => ds.map(d => d.id === id ? { ...d, keep: !d.keep } : d))
  const filtered = activeType === 'all' ? docs : docs.filter(d => d.type === activeType)
  const keepCount = docs.filter(d => d.keep).length
  const countByType = (t: string) => t === 'all' ? docs.length : docs.filter(d => d.type === t).length

  return (
    <WorkspaceShell breadcrumbs={[{ label: 'Pipeline' }, { label: 'Harvest Review' }]}>
      <PipelineStepper activeId="harvest" />

      <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 112px)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, minHeight: 0 }}>

          {/* Type sidebar */}
          <div style={{ background: 'white', borderRight: '1px solid var(--cc-ink-200)', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ padding: '0 10px 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>Document types</div>
            {DOC_TYPES.map(t => (
              <button key={t.id} className={`type-bucket-btn ${activeType === t.id ? 'active' : ''}`} onClick={() => setActiveType(t.id)}>
                <t.icon size={14} />
                {t.label}
                <span className="bucket-count">{countByType(t.id)}</span>
              </button>
            ))}

            <div style={{ height: 1, background: 'var(--cc-ink-200)', margin: '12px 0' }} />
            <div style={{ padding: '0 10px 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--cc-ink-500)' }}>Bulk actions</div>
            <button className="type-bucket-btn" onClick={() => setDocs(ds => ds.map(d => ({ ...d, keep: d.confidence > 0.75 })))}>
              <Zap size={14} /> Keep conf &gt; 0.75
            </button>
            <button className="type-bucket-btn" onClick={() => setDocs(ds => ds.map(d => ({ ...d, keep: false })))}>
              <Trash2 size={14} /> Discard all
            </button>
            <button className="type-bucket-btn" onClick={() => setDocs(ds => ds.map(d => ({ ...d, keep: true })))}>
              <Check size={14} /> Keep all
            </button>
          </div>

          {/* Document cards */}
          <div style={{ padding: '20px 28px 100px', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div>
                <h2 style={{ fontFamily: 'var(--cc-font-display)', fontWeight: 600, fontSize: 22, color: 'var(--cc-ink-950)', margin: 0 }}>
                  {activeType === 'all' ? 'All documents' : TYPE_LABELS[activeType]?.label ?? activeType}
                </h2>
                <div style={{ fontSize: 13, color: 'var(--cc-ink-500)', marginTop: 3 }}>
                  {filtered.filter(d => d.keep).length} kept · {filtered.filter(d => !d.keep).length} discarded
                </div>
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  className="border border-cc-ink-300 rounded-[10px] px-3 text-[13px] h-9 outline-none focus:border-cc-teal-500"
                  style={{ width: 200 }}
                  placeholder="Search…"
                />
                <button className="flex items-center justify-center w-9 h-9 rounded-[10px] border border-cc-ink-300 bg-white text-cc-ink-600 hover:bg-cc-ink-50 transition-colors">
                  <Filter size={13} />
                </button>
              </div>
            </div>

            <div className="harvest-grid">
              {filtered.map(doc => (
                <HarvestCard
                  key={doc.id}
                  doc={doc}
                  onToggle={toggleKeep}
                  isSelected={selected === doc.id}
                  onSelect={() => setSelected(selected === doc.id ? null : doc.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="harvest-actions-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontFamily: 'var(--cc-font-display)', fontSize: 28, fontWeight: 700, color: 'var(--cc-ink-950)', lineHeight: 1 }}>{keepCount}</div>
            <div style={{ fontSize: 13, color: 'var(--cc-ink-700)' }}>
              documents selected<br />
              <span style={{ fontSize: 12, color: 'var(--cc-ink-500)' }}>{docs.length - keepCount} discarded</span>
            </div>
          </div>
          <div style={{ flex: 1, height: 6, background: 'var(--cc-ink-200)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--cc-teal-600)', borderRadius: 999, width: `${(keepCount / docs.length) * 100}%`, transition: 'width 300ms ease' }} />
          </div>
          <button
            className="flex items-center gap-2 px-4 h-10 rounded-[10px] text-sm font-medium border border-cc-ink-300 bg-white text-cc-ink-900 hover:bg-cc-ink-50 transition-colors"
            onClick={() => setDocs(HARVESTED_DOCS)}
          >
            Reset triage
          </button>
          <a
            href="/pipeline/extract"
            className="flex items-center gap-2 px-5 h-12 rounded-[10px] text-[15px] font-medium bg-cc-teal-600 text-white hover:bg-[#0E9F92] transition-colors"
            style={{ textDecoration: 'none' }}
          >
            Proceed with {keepCount} documents →
          </a>
        </div>
      </div>
    </WorkspaceShell>
  )
}
