// fees.js
//
// ⚠️ Espejo de supabase/functions/_shared/epayco-fees.ts — solo para
// MOSTRAR un estimado en pantalla mientras el cliente decide el método
// de pago. El cálculo que de verdad se cobra siempre se recalcula en el
// servidor (la Edge Function), así que aunque alguien manipulara este
// archivo en su navegador, no cambiaría un peso de lo que realmente paga.
//
// Si cambian las tarifas de ePayco, actualiza este archivo Y
// supabase/functions/_shared/epayco-fees.ts — deben quedar idénticos.

const EPAYCO_PERCENTAGE = 0.0329; // 3.29% de comisión
const EPAYCO_FIXED_FEE = 700;     // $700 COP fijo por transacción
const VAT_RATE = 0.19;            // 19% de IVA sobre la comisión de ePayco

const _commissionRateWithVat = EPAYCO_PERCENTAGE * (1 + VAT_RATE);
const _fixedFeeWithVat = EPAYCO_FIXED_FEE * (1 + VAT_RATE);

function calculateEpaycoGrossAmount(netAmount) {
  return Math.ceil((netAmount + _fixedFeeWithVat) / (1 - _commissionRateWithVat));
}

function calculateEpaycoFee(netAmount, grossAmount) {
  return grossAmount - netAmount;
}
