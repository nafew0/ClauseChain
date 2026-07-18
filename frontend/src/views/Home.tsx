'use client'

import type { CSSProperties } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  BadgeCheck,
  BrainCircuit,
  CheckCircle2,
  Eye,
  FileScan,
  FileText,
  GitBranch,
  Landmark,
  Layers3,
  LockKeyhole,
  PackageCheck,
  Radar,
  Scale,
  ShieldCheck,
  Workflow,
  XCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import ArchitectureDiagram from '@/components/clausechain/ArchitectureDiagram'
import CVRLoopDiagram from '@/components/clausechain/CVRLoopDiagram'

type MotionStyle = CSSProperties & { [key: `--${string}`]: string | number }

const problemCards = [
  {
    title: 'Official evidence is fragmented',
    body: 'Digital trade rules sit across statutes, amendments, portals, gazettes, guidelines, and scanned archives.',
    icon: Radar,
    tone: 'teal',
  },
  {
    title: 'Authority is easy to misread',
    body: 'A guideline can paraphrase the law, an amendment can be outdated, and a translation can be useful but non-binding.',
    icon: Landmark,
    tone: 'blue',
  },
  {
    title: 'Extraction changes meaning',
    body: 'OCR errors, broken section boundaries, and lost exceptions can turn a conditional transfer rule into the wrong policy signal.',
    icon: FileScan,
    tone: 'amber',
  },
  {
    title: 'AI claims need audit trails',
    body: 'Judges and reviewers need exact quotations, source status, page or section anchors, and a reason to trust every mapped claim.',
    icon: ShieldCheck,
    tone: 'rose',
  },
]

const workflowSteps = [
  { label: 'Discover', detail: 'Official portals and semantic search', icon: Radar },
  { label: 'Acquire', detail: 'HTML, PDF, scanned PDF, OCR', icon: FileText },
  { label: 'Resolve', detail: 'Authority and current-law status', icon: Landmark },
  { label: 'Structure', detail: 'Sections, definitions, exceptions', icon: Layers3 },
  { label: 'Predicate', detail: 'Actor, action, object, condition', icon: BrainCircuit },
  { label: 'Map', detail: 'RDTII Pillars 6 and 7', icon: Workflow },
  { label: 'Verify', detail: 'Eight gates plus abstention', icon: BadgeCheck },
  { label: 'Export', detail: 'Ledger, JSON, CSV, provenance bundle', icon: PackageCheck },
]

const proofMetrics = [
  ['Discovery recall@20', '0.94', '+0.11 vs baseline'],
  ['Authority accuracy', '0.91', 'guidelines downgraded'],
  ['OCR CER', '1.8%', 'risk spans routed'],
  ['Section-boundary F1', '0.89', 'exceptions preserved'],
  ['Classification macro-F1', '0.82', 'predicate-first'],
  ['Citation accuracy', '0.96', 'span hash verified'],
]

const gates = [
  'Source official',
  'Current law',
  'Exact span',
  'Citation anchor',
  'OCR confidence',
  'Predicate support',
  'Counter-evidence',
  'Human review',
]

const regressionCases = [
  { label: 'Guideline treated as binding law', status: 'blocked' },
  { label: 'OCR flips "shall not" into "shall"', status: 'abstain' },
  { label: 'Exception lost during chunking', status: 'review' },
  { label: 'Outdated amendment selected', status: 'blocked' },
]

const sourceNodes = [
  ['Official HTML statute', 'binding', 'selected'],
  ['Scanned amendment', 'amends', 'linked'],
  ['Ministry guideline', 'context', 'downgraded'],
]

export default function Home() {
  return (
    <div className="cc-home-page min-h-screen bg-white text-[var(--cc-ink-950)]">
      <section className="cc-home-hero relative isolate overflow-hidden">
        <div className="cc-home-stage" aria-hidden="true">
          <div className="cc-home-grid" />
          <div className="cc-home-source-stack">
            {sourceNodes.map(([title, meta, state], index) => (
              <div key={title} className={`cc-home-source-card cc-home-source-${index + 1}`}>
                <div className="flex items-center justify-between gap-3">
                  <span>{title}</span>
                  <span className={`cc-home-source-pill ${state}`}>{meta}</span>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-1.5 w-full rounded-full bg-[rgba(24,24,27,0.10)]" />
                  <div className="h-1.5 w-4/5 rounded-full bg-[rgba(24,24,27,0.10)]" />
                  <div className="h-1.5 w-2/3 rounded-full bg-[rgba(24,24,27,0.10)]" />
                </div>
              </div>
            ))}
          </div>
          <div className="cc-home-beam cc-home-beam-a" />
          <div className="cc-home-beam cc-home-beam-b" />
          <div className="cc-home-compiler">
            <div className="cc-home-compiler-header">
              <span className="h-2 w-2 rounded-full bg-[var(--cc-success)]" />
              Evidence compiler
            </div>
            <div className="cc-home-compiler-grid">
              <span>Authority</span>
              <strong>0.91</strong>
              <span>Predicate</span>
              <strong>verified</strong>
              <span>RDTII</span>
              <strong>P6.2</strong>
              <span>Risk</span>
              <strong>abstain</strong>
            </div>
          </div>
          <div className="cc-home-export">
            <div className="flex items-center justify-between gap-3 border-b border-[rgba(24,24,27,0.10)] pb-3">
              <span>Provenance bundle</span>
              <CheckCircle2 className="h-4 w-4 text-[var(--cc-success)]" />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <span className="cc-home-mini-cell pass">span</span>
              <span className="cc-home-mini-cell pass">hash</span>
              <span className="cc-home-mini-cell warn">review</span>
              <span className="cc-home-mini-cell pass">URL</span>
              <span className="cc-home-mini-cell pass">section</span>
              <span className="cc-home-mini-cell pass">ledger</span>
            </div>
          </div>
          <div className="cc-home-scan-line" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[620px] max-w-7xl flex-col justify-center px-5 py-16 sm:px-8 lg:min-h-[660px] lg:px-10">
          <div className="max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[rgba(15,181,167,0.28)] bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--cc-teal-600)] shadow-sm backdrop-blur">
              <Scale className="h-3.5 w-3.5" />
              UN AI Hackathon proposal demo
            </div>
            <h1 className="text-balance font-[var(--cc-font-display)] text-6xl font-semibold tracking-normal text-[var(--cc-ink-950)] sm:text-7xl lg:text-8xl">
              ClauseChain
            </h1>
            <p className="mt-5 max-w-2xl text-pretty text-xl leading-8 text-[var(--cc-ink-700)] sm:text-2xl sm:leading-9">
              A measured legal evidence compiler for digital trade regulations. It finds official sources,
              resolves authority, extracts legal predicates, maps them to RDTII Pillars 6 and 7, and proves
              every claim with reviewable citations.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/dashboard">
                <Button size="lg" className="h-12 rounded-full bg-[var(--cc-ink-950)] px-6 text-white hover:bg-[var(--cc-ink-800)]">
                  Open demo workspace
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/benchmark">
                <Button size="lg" variant="outline" className="h-12 rounded-full border-[var(--cc-ink-300)] bg-white/80 px-6 backdrop-blur hover:bg-white">
                  View benchmark proof
                </Button>
              </Link>
            </div>
            <div className="mt-10 grid max-w-2xl grid-cols-3 gap-3">
              {[
                ['8', 'verification gates'],
                ['P6/P7', 'mandatory RDTII focus'],
                ['0', 'uncited AI claims'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-[rgba(24,24,27,0.10)] bg-white/70 p-4 shadow-sm backdrop-blur">
                  <div className="font-[var(--cc-font-display)] text-2xl font-semibold text-[var(--cc-ink-950)]">{value}</div>
                  <div className="mt-1 text-xs font-medium uppercase tracking-[0.08em] text-[var(--cc-ink-500)]">{label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--cc-ink-200)] bg-[var(--cc-ink-50)]">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-12 sm:px-8 lg:grid-cols-4 lg:px-10">
          {problemCards.map(({ title, body, icon: Icon, tone }) => (
            <article key={title} className={`cc-home-problem-card cc-home-tone-${tone}`}>
              <div className="cc-home-problem-icon">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="mt-5 text-lg font-semibold tracking-normal text-[var(--cc-ink-950)]">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-[var(--cc-ink-600)]">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="evidence-flow" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.76fr_1.24fr] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cc-teal-600)]">How we solve it</p>
            <h2 className="mt-3 max-w-lg font-[var(--cc-font-display)] text-4xl font-semibold tracking-normal text-[var(--cc-ink-950)] sm:text-5xl">
              Evidence first, model second.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--cc-ink-600)]">
              ClauseChain treats AI as a constrained analyst inside a pipeline. Retrieval, source status,
              document structure, exact spans, and counter-evidence are checked before an output is allowed
              into the audit view.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/source-status">
                <Button variant="outline" className="rounded-full border-[var(--cc-ink-300)]">
                  Source status graph
                </Button>
              </Link>
              <Link href="/pipeline/map">
                <Button variant="outline" className="rounded-full border-[var(--cc-ink-300)]">
                  Live mapping run
                </Button>
              </Link>
            </div>
          </div>

          <div className="cc-home-flow-wrap">
            <div className="cc-home-flow-line" aria-hidden="true" />
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {workflowSteps.map(({ label, detail, icon: Icon }, index) => (
                <div key={label} className="cc-home-flow-step" style={{ '--step-index': index } as MotionStyle}>
                  <div className="flex items-center justify-between">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-[var(--cc-teal-50)] text-[var(--cc-teal-600)]">
                      <Icon className="h-[18px] w-[18px]" />
                    </div>
                    <span className="font-[var(--cc-font-mono)] text-xs text-[var(--cc-ink-400)]">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-[var(--cc-ink-950)]">{label}</h3>
                  <p className="mt-2 min-h-10 text-sm leading-5 text-[var(--cc-ink-600)]">{detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <ArchitectureDiagram />

      <section className="bg-[var(--cc-ink-950)] text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-20 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cc-teal-400)]">Proof layer</p>
            <h2 className="mt-3 max-w-2xl font-[var(--cc-font-display)] text-4xl font-semibold tracking-normal sm:text-5xl">
              Accuracy is measured per stage, not promised at the end.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-300">
              The demo benchmark shows where errors leak: discovery recall, authority status, OCR,
              section boundaries, retrieval, predicate extraction, classification, citation verification,
              and abstention. The point is to catch failure before a reviewer sees a confident wrong answer.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {proofMetrics.map(([label, value, delta]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/[0.045] p-4">
                  <div className="font-[var(--cc-font-display)] text-3xl font-semibold text-white">{value}</div>
                  <div className="mt-2 text-sm font-medium text-zinc-200">{label}</div>
                  <div className="mt-1 text-xs text-zinc-500">{delta}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="cc-home-benchmark-panel">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div>
                <div className="text-sm font-semibold text-white">Regression guardrail stream</div>
                <div className="mt-1 text-xs text-zinc-500">Simulated benchmark run</div>
              </div>
              <div className="cc-home-live-badge">
                <span />
                running
              </div>
            </div>
            <div className="p-5">
              <div className="space-y-3">
                {regressionCases.map((item, index) => (
                  <div key={item.label} className="cc-home-regression-row" style={{ '--row-index': index } as MotionStyle}>
                    <div className="flex min-w-0 items-center gap-3">
                      {item.status === 'blocked' ? (
                        <XCircle className="h-4 w-4 shrink-0 text-[var(--cc-danger)]" />
                      ) : (
                        <Eye className="h-4 w-4 shrink-0 text-[var(--cc-warning)]" />
                      )}
                      <span className="truncate text-sm text-zinc-200">{item.label}</span>
                    </div>
                    <span className={`cc-home-regression-pill ${item.status}`}>{item.status}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 rounded-lg border border-white/10 bg-black/25 p-4">
                <div className="mb-3 flex items-center justify-between text-xs text-zinc-500">
                  <span>Baseline comparison</span>
                  <span>ClauseChain</span>
                </div>
                {[
                  ['Citation fidelity', 96],
                  ['Authority resolution', 91],
                  ['Abstention calibration', 86],
                ].map(([label, score]) => (
                  <div key={label} className="mb-4 last:mb-0">
                    <div className="mb-1 flex justify-between text-xs text-zinc-400">
                      <span>{label}</span>
                      <span>{score}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <div className="cc-home-dark-bar" style={{ width: `${score}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <CVRLoopDiagram />

      <section className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
        <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--cc-teal-600)]">Human audit</p>
            <h2 className="mt-3 max-w-xl font-[var(--cc-font-display)] text-4xl font-semibold tracking-normal text-[var(--cc-ink-950)] sm:text-5xl">
              Every mapped clause stays reviewable.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-[var(--cc-ink-600)]">
              The reviewer sees the original source, extracted legal node, predicate tuple,
              RDTII classification, verification gates, counter-evidence, and exportable provenance bundle
              in one audit workspace.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/jurisdictions/sg/documents/SG-PDPA-2012">
                <Button className="rounded-full bg-[var(--cc-teal-600)] hover:bg-[var(--cc-teal-500)]">
                  Open evidence audit
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/pipeline/export">
                <Button variant="outline" className="rounded-full border-[var(--cc-ink-300)]">
                  Export preview
                </Button>
              </Link>
            </div>
          </div>

          <div className="cc-home-audit-demo">
            <div className="cc-home-audit-pane">
              <div className="cc-home-pane-title">
                <FileText className="h-4 w-4" />
                Original source
              </div>
              <div className="cc-home-paper-line w-2/3" />
              <div className="cc-home-paper-line w-full" />
              <div className="cc-home-paper-line w-5/6" />
              <div className="cc-home-highlight">
                An organisation shall not transfer any personal data outside Singapore except in accordance
                with requirements ensuring comparable protection.
              </div>
              <div className="cc-home-paper-line w-3/4" />
            </div>
            <div className="cc-home-audit-pane">
              <div className="cc-home-pane-title">
                <GitBranch className="h-4 w-4" />
                Legal predicate tuple
              </div>
              {[
                ['Actor', 'organisation'],
                ['Action', 'transfer personal data'],
                ['Condition', 'comparable protection'],
                ['Policy', 'conditional cross-border regime'],
              ].map(([label, value]) => (
                <div key={label} className="cc-home-tuple-row">
                  <span>{label}</span>
                  <strong>{value}</strong>
                </div>
              ))}
            </div>
            <div className="cc-home-audit-pane">
              <div className="cc-home-pane-title">
                <LockKeyhole className="h-4 w-4" />
                Verification gates
              </div>
              <div className="grid grid-cols-2 gap-2">
                {gates.map((gate, index) => (
                  <div key={gate} className="cc-home-gate-chip" style={{ '--gate-index': index } as MotionStyle}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>{gate}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--cc-ink-200)] bg-[var(--cc-ink-50)]">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-5 py-12 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <h2 className="font-[var(--cc-font-display)] text-3xl font-semibold tracking-normal text-[var(--cc-ink-950)]">
              Built for a demo judges can inspect.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--cc-ink-600)]">
              Start with the benchmark, show source authority resolution, audit a PDPA clause, then export the
              evidence bundle with citations, hashes, and reviewer state.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/benchmark">
              <Button className="rounded-full bg-[var(--cc-ink-950)] hover:bg-[var(--cc-ink-800)]">
                Run benchmark demo
              </Button>
            </Link>
            <Link href="/source-status">
              <Button variant="outline" className="rounded-full border-[var(--cc-ink-300)] bg-white">
                Resolve source status
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
