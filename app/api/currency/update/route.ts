// 🔄 API route pour mise à jour automatique des taux de change
import { NextRequest, NextResponse } from 'next/server';
import { currencyAPI } from '@/lib/currency-api';
import { createClient } from '@/lib/supabase/server';

// POST /api/currency/update - Mise à jour manuelle
export async function POST(request: NextRequest) {
  try {
    const { baseCurrency } = await request.json();
    const base = baseCurrency || 'CAD';
    
    console.log(`🚀 Démarrage mise à jour taux: ${base}`);
    
    const result = await currencyAPI.updateCurrencyRates(base);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        message: `✅ ${result.count} taux mis à jour via ${result.source}`,
        data: {
          baseCurrency: base,
          ratesUpdated: result.count,
          source: result.source,
          timestamp: new Date().toISOString()
        }
      });
    } else {
      return NextResponse.json({
        success: false,
        message: '❌ Échec mise à jour des taux',
        error: 'Tous les providers ont échoué'
      }, { status: 503 });
    }
    
  } catch (error) {
    console.error('❌ Erreur API currency/update:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Erreur interne serveur',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/currency/update - Statut dernière mise à jour
export async function GET() {
  try {
    const supabase = createClient();
    
    // Récupérer la dernière mise à jour
    const { data: lastUpdate, error } = await supabase
      .from('currency_rates')
      .select('date, source, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    // Compter les devises disponibles
    const { count: totalRates } = await supabase
      .from('currency_rates')
      .select('*', { count: 'exact', head: true });
    
    // Vérifier si mise à jour nécessaire (plus de 24h)
    const lastUpdateDate = lastUpdate?.created_at ? new Date(lastUpdate.created_at) : null;
    const hoursSinceUpdate = lastUpdateDate 
      ? (Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60)
      : 999;
    
    const needsUpdate = hoursSinceUpdate > 24;
    
    return NextResponse.json({
      success: true,
      data: {
        lastUpdate: lastUpdate?.created_at || null,
        lastSource: lastUpdate?.source || null,
        totalRates: totalRates || 0,
        hoursSinceUpdate: Math.round(hoursSinceUpdate),
        needsUpdate,
        supportedCurrencies: currencyAPI.getSupportedCurrencies()
      }
    });
    
  } catch (error) {
    console.error('❌ Erreur GET currency/update:', error);
    return NextResponse.json({
      success: false,
      message: '❌ Erreur récupération statut',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
