// supabase/functions/epayco-confirmation/index.ts
//
// Esta función la llama ePayco directamente (servidor a servidor) cuando
// un pago cambia de estado. Valida la firma de seguridad, y si el pago
// fue aceptado, descuenta el stock de los productos comprados.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const P_CUST_ID_CLIENTE = Deno.env.get("EPAYCO_P_CUST_ID_CLIENTE")!;
const P_KEY = Deno.env.get("EPAYCO_P_KEY")!;

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

async function sha256Hex(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.serve(async (req: Request) => {
  try {
    const form = await req.formData();

    const x_ref_payco = String(form.get("x_ref_payco") ?? "");
    const x_transaction_id = String(form.get("x_transaction_id") ?? "");
    const x_amount = String(form.get("x_amount") ?? "");
    const x_currency_code = String(form.get("x_currency_code") ?? "");
    const x_signature = String(form.get("x_signature") ?? "");
    const x_transaction_state = String(form.get("x_transaction_state") ?? "");
    const x_extra1 = String(form.get("x_extra1") ?? "");

    // 1. Validar la firma — si no coincide, ignoramos el aviso
    const expected = await sha256Hex(
      `${P_CUST_ID_CLIENTE}^${P_KEY}^${x_ref_payco}^${x_transaction_id}^${x_amount}^${x_currency_code}`
    );

    if (expected !== x_signature) {
      console.error("Firma inválida", { expected, x_signature });
      return new Response("Firma inválida", { status: 400 });
    }

    // 2. Solo actuamos si el pago fue aceptado
    if (x_transaction_state !== "Aceptada") {
      return new Response("OK (transacción no aceptada, no se hace nada)", { status: 200 });
    }

    // 3. Evitar procesar el mismo pago dos veces (ePayco puede reintentar)
    const { data: yaExiste } = await supabaseAdmin
      .from("processed_payments")
      .select("id")
      .eq("ref_payco", x_ref_payco)
      .maybeSingle();

    if (yaExiste) {
      return new Response("OK (ya procesado antes)", { status: 200 });
    }

    // 4. Descontar el stock de cada producto comprado
    //    x_extra1 trae el carrito como JSON: [{ id, qty }, ...]
    let items: { id: number; qty: number }[] = [];
    try {
      items = JSON.parse(x_extra1);
    } catch (_e) {
      console.error("No se pudo leer x_extra1:", x_extra1);
    }

    for (const item of items) {
      const { data: producto } = await supabaseAdmin
        .from("products")
        .select("stock")
        .eq("id", item.id)
        .single();

      if (producto) {
        const nuevoStock = Math.max(0, producto.stock - item.qty);
        await supabaseAdmin
          .from("products")
          .update({ stock: nuevoStock })
          .eq("id", item.id);
      }
    }

    // 5. Registrar que ya procesamos este pago
    await supabaseAdmin
      .from("processed_payments")
      .insert({ ref_payco: x_ref_payco });

    // 6. Marcar el pedido correspondiente como "pagado"
    const x_id_invoice = String(form.get("x_id_invoice") ?? form.get("x_id_factura") ?? "");
    if (x_id_invoice) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "pagado" })
        .eq("invoice", x_id_invoice);
    }

    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("Error en confirmación ePayco:", err);
    return new Response("Error interno", { status: 500 });
  }
});
