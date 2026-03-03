export function ProFeatureGate({ feature, description }: { feature: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6">
        <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      </div>
      <span className="inline-block px-3 py-1 bg-blue-600/20 text-blue-400 text-xs font-semibold rounded-full mb-3">
        Pro Feature
      </span>
      <h2 className="text-xl font-bold text-white mb-2">{feature}</h2>
      <p className="text-slate-400 text-sm text-center max-w-md">{description}</p>
    </div>
  )
}
