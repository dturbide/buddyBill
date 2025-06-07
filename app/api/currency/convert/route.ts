// 💱 API route pour conversion de devises en temps réel
import { NextRequest, NextResponse } from 'next/server';
import { convertCurrency } from '@/lib/currency-api';
import { createClient } from '@/lib/supabase/server';

// POST /api/currency/convert - Conversion directe
export async function POST(request: NextRequest) {
  try {
    const { amount, fromCurrency, toCurrency } = await request.json();
    
    // Validation des paramètres
    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json({
        success: false,
        message: '❌ Paramètres manquants: amount, fromCurrency, toCurrency requis'
      }, { status: 400 });
    }
    
    if (fromCurrency === toCurrency) {
      return NextResponse.json({
        success: true,
        data: {
          originalAmount: amount,
          convertedAmount: amount,
          fromCurrency,
          toCurrency,
          rate: 1,
          source: 'same-currency'
        }
      });
    }
    
    console.log(`💱 Conversion: ${amount} ${fromCurrency} → ${toCurrency}`);
    
    const result = await convertCurrency(amount, fromCurrency, toCurrency);
    
    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount: parseFloat(result.convertedAmount.toFixed(2)),
        fromCurrency,
        toCurrency,
        rate: result.rate,
        source: result.source,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur conversion:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Erreur lors de la conversion',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/currency/convert?from=USD&to=EUR&amount=100 - Conversion via query params
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const amount = parseFloat(searchParams.get('amount') || '0');
    const fromCurrency = searchParams.get('from');
    const toCurrency = searchParams.get('to');
    
    if (!amount || !fromCurrency || !toCurrency) {
      return NextResponse.json({
        success: false,
        message: '❌ Query params manquants: ?amount=100&from=USD&to=EUR'
      }, { status: 400 });
    }
    
    if (fromCurrency === toCurrency) {
      return NextResponse.json({
        success: true,
        data: {
          originalAmount: amount,
          convertedAmount: amount,
          fromCurrency,
          toCurrency,
          rate: 1,
          source: 'same-currency'
        }
      });
    }
    
    const result = await convertCurrency(amount, fromCurrency, toCurrency);
    
    return NextResponse.json({
      success: true,
      data: {
        originalAmount: amount,
        convertedAmount: parseFloat(result.convertedAmount.toFixed(2)),
        fromCurrency,
        toCurrency,
        rate: result.rate,
        source: result.source,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur conversion GET:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Erreur lors de la conversion',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
