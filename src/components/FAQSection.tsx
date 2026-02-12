'use client'

import { useState } from 'react'

const faqs = [
  {
    q: 'How does the free trial work?',
    a: 'You get 3 days of full access to test everything. A credit card is required to start, but you won\'t be charged during the trial. Cancel anytime before it ends - no questions asked.',
  },
  {
    q: 'How does the AI quote generation work?',
    a: 'When a client submits a request with photos and description, our AI analyzes the content and suggests line items from your price list that match the project scope. You review and approve the suggestions, then send the quote.',
  },
  {
    q: 'Can I use BrickQuote on my phone?',
    a: 'Absolutely! BrickQuote is fully responsive and works great on phones and tablets. Your clients can also submit requests from their mobile devices.',
  },
  {
    q: 'Do my clients need an account?',
    a: 'No, clients don\'t need to create an account. They use your unique link to submit requests, view quotes, and accept them - all without signing up.',
  },
  {
    q: 'Can I also send invoices?',
    a: 'Yes! Convert any accepted quote to an invoice in one click. You can track payments, send payment reminders, and clients can mark invoices as paid online.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes, you can cancel your subscription at any time with no penalties. Your data stays safe, and you can reactivate anytime.',
  },
  {
    q: 'What currencies and countries do you support?',
    a: 'We support USD, GBP, AUD, CAD, EUR, NZD and more. Tax settings (VAT, GST) are automatically configured based on your country.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="py-24 px-4 bg-[#0d1f35]/50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Frequently asked questions
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-[#132039] border border-[#1e3a5f] rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-6 text-left hover:bg-[#1a2d4d] transition-colors"
              >
                <h3 className="text-white font-medium pr-4">{faq.q}</h3>
                <svg
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              <div
                className={`overflow-hidden transition-all duration-200 ${openIndex === index ? 'max-h-40 pb-6' : 'max-h-0'}`}
              >
                <p className="text-slate-400 text-sm px-6">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
