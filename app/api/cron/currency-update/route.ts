// ⏰ Cron job pour mise à jour automatique des taux de change
import { NextRequest, NextResponse } from 'next/server';
import { currencyAPI } from '@/lib/currency-api';

// GET /api/cron/currency-update - Endpoint pour cron job
export async function GET(request: NextRequest) {
  try {
    // Vérifier l'authentification du cron (optionnel)
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET_TOKEN;
    
    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({
        success: false,
        message: '❌ Non autorisé'
      }, { status: 401 });
    }

    console.log('⏰ Début du cron job de mise à jour des taux de change');

    // Mettre à jour pour les principales devises
    const baseCurrencies = ['CAD', 'USD', 'EUR'];
    const results = [];

    for (const base of baseCurrencies) {
      try {
        console.log(`🔄 Mise à jour pour ${base}...`);
        const result = await currencyAPI.updateCurrencyRates(base);
        results.push({
          baseCurrency: base,
          success: result.success,
          count: result.count,
          source: result.source
        });
        
        // Attendre 1 seconde entre les appels pour éviter la limitation
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Erreur mise à jour ${base}:`, error);
        results.push({
          baseCurrency: base,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const totalCount = results.reduce((sum, r) => sum + (r.count || 0), 0);

    console.log(`✅ Cron job terminé: ${successCount}/${baseCurrencies.length} devises mises à jour, ${totalCount} taux au total`);

    return NextResponse.json({
      success: true,
      message: `✅ Cron job complété: ${successCount}/${baseCurrencies.length} devises`,
      data: {
        timestamp: new Date().toISOString(),
        successCount,
        totalRatesUpdated: totalCount,
        results
      }
    });

  } catch (error) {
    console.error('❌ Erreur cron job currency-update:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Erreur dans le cron job',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST /api/cron/currency-update - Alternative pour déclenchement manuel
export async function POST(request: NextRequest) {
  return GET(request);
}
