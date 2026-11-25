// supabase/functions/_shared/epayco-fees.ts
//
// ⚠️ ÚNICO LUGAR donde deben vivir las tarifas de ePayco.
// Si ePayco cambia sus tarifas, solo hay que tocar estos 3 números.
// (Hay un espejo de esta misma lógica en /fees.js para mostrar un
// estimado en el navegador — si cambias esto, cambia también fees.js)

export const EPAYCO_PERCENTAGE = 0.0329; // 3.29% de comisión
export const EPAYCO_FIXED_FEE = 700;     // $700 COP fijo por transacción
export const VAT_RATE = 0.19;            // 19% de IVA sobre la comisión de ePayco

const commissionRateWithVat = EPAYCO_PERCENTAGE * (1 + VAT_RATE);
const fixedFeeWithVat = EPAYCO_FIXED_FEE * (1 + VAT_RATE);

/**
 * Dado el valor NETO que el comercio quiere recibir, calcula cuánto
 * debe pagar el cliente en total para que, después de la comisión de
 * ePayco (con IVA incluido), al comercio le quede exactamente `netAmount`.
 */
export function calculateEpaycoGrossAmount(netAmount: number): number {
  return Math.ceil((netAmount + fixedFeeWithVat) / (1 - commissionRateWithVat));
}

/**
 * La comisión total que se le suma al cliente (gross - net).
 */
export function calculateEpaycoFee(netAmount: number, grossAmount: number): number {
  return grossAmount - netAmount;
}
