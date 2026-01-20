import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

// Run this once to create products and prices in Stripe
// GET /api/stripe/setup
export async function GET() {
  try {
    // Check if products already exist
    const existingProducts = await stripe.products.list({ limit: 10 })
    const quoteSnapProducts = existingProducts.data.filter(p =>
      p.name.includes('QuoteSnap')
    )

    if (quoteSnapProducts.length > 0) {
      // Get existing prices
      const prices = await stripe.prices.list({ limit: 20, active: true })
      const quoteSnapPrices = prices.data.filter(p =>
        quoteSnapProducts.some(prod => prod.id === p.product)
      )

      return NextResponse.json({
        message: 'Products already exist',
        products: quoteSnapProducts,
        prices: quoteSnapPrices.map(p => ({
          id: p.id,
          product: p.product,
          unit_amount: p.unit_amount,
          interval: p.recurring?.interval,
        })),
      })
    }

    // Create Starter plan
    const starterProduct = await stripe.products.create({
      name: 'QuoteSnap Starter',
      description: 'AI-powered quotes for contractors - 30 quotes/month',
    })

    const starterPrice = await stripe.prices.create({
      product: starterProduct.id,
      unit_amount: 2900, // $29.00
      currency: 'usd',
      recurring: { interval: 'month' },
    })

    // Create Pro plan
    const proProduct = await stripe.products.create({
      name: 'QuoteSnap Pro',
      description: 'Unlimited AI-powered quotes with premium features',
    })

    const proPrice = await stripe.prices.create({
      product: proProduct.id,
      unit_amount: 4900, // $49.00
      currency: 'usd',
      recurring: { interval: 'month' },
    })

    return NextResponse.json({
      message: 'Products created successfully',
      starter: {
        productId: starterProduct.id,
        priceId: starterPrice.id,
      },
      pro: {
        productId: proProduct.id,
        priceId: proPrice.id,
      },
    })
  } catch (error) {
    console.error('Stripe setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup Stripe products' },
      { status: 500 }
    )
  }
}
