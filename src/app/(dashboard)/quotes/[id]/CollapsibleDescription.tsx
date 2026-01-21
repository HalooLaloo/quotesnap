'use client'

import { useState } from 'react'

interface CollapsibleDescriptionProps {
  description: string
}

interface ParsedSummary {
  workType?: string
  scope?: string[]
  dimensions?: string[]
  currentState?: string[]
  preparation?: string[]
  materials?: string
  location?: string
  timeline?: string
  notes?: string[]
  clientQuestion?: string
}

// Usuń markdown formatting (**, *, etc.)
function cleanMarkdown(text: string): string {
  return text
    .replace(/\*\*/g, '')  // Remove **
    .replace(/\*/g, '')    // Remove *
    .replace(/__/g, '')    // Remove __
    .replace(/_/g, ' ')    // Replace _ with space
    .trim()
}

function parseSummary(text: string): ParsedSummary {
  const result: ParsedSummary = {}

  // Najpierw oczyść cały tekst z markdown
  const cleanText = cleanMarkdown(text)

  // Extract RODZAJ PRAC
  const workTypeMatch = cleanText.match(/RODZAJ PRAC:\s*([^\n]+)/i)
  if (workTypeMatch) result.workType = workTypeMatch[1].trim()

  // Extract ZAKRES PRAC (bullet points)
  const scopeMatch = cleanText.match(/ZAKRES PRAC:\s*\n((?:- [^\n]+\n?)+)/i)
  if (scopeMatch) {
    result.scope = scopeMatch[1].split('\n').filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
  }

  // Extract WYMIARY
  const dimensionsMatch = cleanText.match(/WYMIARY:\s*\n((?:- [^\n]+\n?)+)/i)
  if (dimensionsMatch) {
    result.dimensions = dimensionsMatch[1].split('\n').filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
  }

  // Extract STAN OBECNY
  const stateMatch = cleanText.match(/STAN OBECNY:\s*\n((?:- [^\n]+\n?)+)/i)
  if (stateMatch) {
    result.currentState = stateMatch[1].split('\n').filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
  }

  // Extract PRACE PRZYGOTOWAWCZE
  const prepMatch = cleanText.match(/PRACE PRZYGOTOWAWCZE:\s*\n((?:- [^\n]+\n?)+)/i)
  if (prepMatch) {
    result.preparation = prepMatch[1].split('\n').filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
  }

  // Extract MATERIAŁY
  const materialsMatch = cleanText.match(/MATERIA[ŁL]Y:\s*([^\n]+)/i)
  if (materialsMatch) result.materials = materialsMatch[1].trim()

  // Extract LOKALIZACJA
  const locationMatch = cleanText.match(/LOKALIZACJA:\s*([^\n]+)/i)
  if (locationMatch) result.location = locationMatch[1].trim()

  // Extract TERMIN
  const timelineMatch = cleanText.match(/TERMIN:\s*([^\n]+)/i)
  if (timelineMatch) result.timeline = timelineMatch[1].trim()

  // Extract UWAGI DODATKOWE
  const notesMatch = cleanText.match(/UWAGI DODATKOWE:\s*\n((?:- [^\n]+\n?)+)/i)
  if (notesMatch) {
    result.notes = notesMatch[1].split('\n').filter(l => l.startsWith('-')).map(l => l.replace(/^-\s*/, '').trim())
  }

  // Extract PYTANIE DO WYKONAWCY
  const questionMatch = cleanText.match(/PYTANIE DO WYKONAWCY:\s*([^\n]+(?:\n(?!---|[A-ZŻŹĆĄŚĘŁÓŃ]+:)[^\n]+)*)/i)
  if (questionMatch) result.clientQuestion = questionMatch[1].trim()

  return result
}

export function CollapsibleDescription({ description }: CollapsibleDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Extract summary (before ---ROZMOWA---)
  const summaryMatch = description.match(/^([\s\S]*?)(?=---ROZMOWA---|$)/)
  const summaryText = summaryMatch ? summaryMatch[1].trim() : ''

  // Extract conversation (after ---ROZMOWA---)
  const conversationMatch = description.match(/---ROZMOWA---([\s\S]*)$/)
  const conversation = conversationMatch ? conversationMatch[1].trim() : ''

  // Parse structured summary
  const parsed = parseSummary(summaryText)
  const hasStructuredData = parsed.workType || parsed.scope?.length

  return (
    <div className="space-y-4">
      {/* Structured summary */}
      {hasStructuredData ? (
        <div className="space-y-4">
          {/* Work Type - highlighted */}
          {parsed.workType && (
            <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
              <div className="text-xs text-blue-400 uppercase tracking-wide mb-1">Work Type</div>
              <div className="text-white font-medium text-lg">{parsed.workType}</div>
            </div>
          )}

          {/* Main info grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Scope of Work */}
            {parsed.scope && parsed.scope.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Scope of Work</div>
                <ul className="space-y-1">
                  {parsed.scope.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-blue-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Dimensions */}
            {parsed.dimensions && parsed.dimensions.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Dimensions</div>
                <ul className="space-y-1">
                  {parsed.dimensions.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-green-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Current State */}
            {parsed.currentState && parsed.currentState.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Current State</div>
                <ul className="space-y-1">
                  {parsed.currentState.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-yellow-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Preparation */}
            {parsed.preparation && parsed.preparation.length > 0 && (
              <div className="bg-slate-800/50 rounded-lg p-4">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Preparation Work</div>
                <ul className="space-y-1">
                  {parsed.preparation.map((item, i) => (
                    <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                      <span className="text-purple-400">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Single line info */}
          <div className="flex flex-wrap gap-3">
            {parsed.materials && (
              <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">Materials: </span>
                <span className="text-slate-300 text-sm">{parsed.materials}</span>
              </div>
            )}
            {parsed.location && (
              <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">Location: </span>
                <span className="text-slate-300 text-sm">{parsed.location}</span>
              </div>
            )}
            {parsed.timeline && (
              <div className="bg-slate-800/50 rounded-lg px-3 py-2">
                <span className="text-xs text-slate-400">Timeline: </span>
                <span className="text-slate-300 text-sm">{parsed.timeline}</span>
              </div>
            )}
          </div>

          {/* Client Question - highlighted */}
          {parsed.clientQuestion && (
            <div className="bg-purple-600/10 border border-purple-500/30 rounded-lg p-4">
              <div className="text-xs text-purple-400 uppercase tracking-wide mb-2">Client Question</div>
              <p className="text-white text-sm">{parsed.clientQuestion}</p>
            </div>
          )}

          {/* Additional Notes */}
          {parsed.notes && parsed.notes.length > 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
              <div className="text-xs text-amber-400 uppercase tracking-wide mb-2">Additional Notes</div>
              <ul className="space-y-1">
                {parsed.notes.map((item, i) => (
                  <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                    <span className="text-amber-400">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : summaryText ? (
        <div className="text-slate-300 whitespace-pre-wrap text-sm">
          {cleanMarkdown(summaryText)}
        </div>
      ) : null}

      {/* Collapsible conversation */}
      {conversation && (
        <div className="border-t border-slate-700 pt-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition-colors"
          >
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            {isExpanded ? 'Hide conversation' : 'Show client conversation'}
          </button>

          {isExpanded && (
            <div className="mt-4 p-4 bg-slate-800/50 rounded-lg max-h-96 overflow-y-auto">
              <p className="text-slate-300 whitespace-pre-wrap text-sm">
                {conversation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fallback if no structure */}
      {!hasStructuredData && !summaryText && !conversation && (
        <p className="text-slate-300 whitespace-pre-wrap text-sm">
          {description}
        </p>
      )}
    </div>
  )
}
