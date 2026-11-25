// supabase/functions/epayco-create-session/index.ts
//
// El navegador NUNCA debe tener la Private Key de ePayco, ni se debe confiar
// en el monto que mande el navegador. Esta función:
//   1. Recalcula el subtotal consultando los precios REALES en la base de
//      datos (ignora cualquier precio que venga del navegador).
//   2. Si el método de pago es ePayco, calcula el recargo de la pasarela
//      con la fórmula inversa exacta (ver _shared/epayco-fees.ts).
//   3. Guarda el pedido completo (con el desglose) en la tabla "orders".
//   4. Si es ePayco, se autentica y crea la sesión de pago; si es otro
//      método (manual/contraentrega), no cobra nada por ePayco.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { calculateEpaycoGrossAmount, calculateEpaycoFee } from "../_shared/epayco-fees.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      responseUrl,
      customer,       // { name, cc, phone, city, address, deliveryMethod }
      items,          // [{ id, qty }]  ← NUNCA se recibe precio del navegador
      userId,         // uuid del comprador logueado, o null si compró como invitado
      paymentMethod,  // "epayco" | "manual"
    } = await req.json();

    if (!Array.isArray(items) || items.length === 0) {
      return new Response(
        JSON.stringify({ error: "El carrito está vacío." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Recalcular el subtotal con los precios REALES de la base de datos
    const ids = items.map((i: { id: number }) => i.id);
    const { data: dbProducts, error: productsError } = await supabaseAdmin
      .from("products")
      .select("id, name, price, stock")
      .in("id", ids);

    if (productsError || !dbProducts) {
      return new Response(
        JSON.stringify({ error: "No se pudieron verificar los productos." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let subtotal = 0;
    const descriptionParts: string[] = [];
    for (const item of items) {
      const product = dbProducts.find((p) => p.id === item.id);
      if (!product) {
        return new Response(
          JSON.stringify({ error: `Producto ${item.id} no existe.` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      subtotal += product.price * item.qty;
      descriptionParts.push(`${item.qty}x ${product.name}`);
    }

    // El envío es contraentrega (lo paga el cliente aparte, directo al mensajero),
    // así que no se le suma nada aquí. El descuento queda listo para cupones futuros.
    const shippingCost = 0;
    const discount = 0;
    const netAmount = subtotal + shippingCost - discount;

    // 2. Calcular el recargo de ePayco SOLO si ese es el método elegido
    const method = paymentMethod === "epayco" ? "epayco" : "manual";
    let epaycoFee = 0;
    let totalCharged = netAmount;

    if (method === "epayco") {
      const grossAmount = calculateEpaycoGrossAmount(netAmount);
      epaycoFee = calculateEpaycoFee(netAmount, grossAmount);
      totalCharged = grossAmount;
    }

    const invoice = "LEVIATAN-" + Date.now();

    // 3. Guardar el pedido con el desglose completo ANTES de ir a ePayco
    //    (así queda registrado aunque el usuario cierre la ventana de pago)
    const { error: orderError } = await supabaseAdmin.from("orders").insert({
      invoice,
      user_id: userId ?? null,
      customer_name: customer?.name ?? null,
      customer_cc: customer?.cc ?? null,
      customer_phone: customer?.phone ?? null,
      customer_city: customer?.city ?? null,
      customer_address: customer?.address ?? null,
      delivery_method: customer?.deliveryMethod ?? "domicilio",
      payment_method: method,
      items: items ?? [],
      subtotal,
      shipping_cost: shippingCost,
      discount,
      epayco_fee: epaycoFee,
      total_charged: totalCharged,
      net_expected: netAmount,
      total: totalCharged, // se mantiene por compatibilidad con lo que ya existía
      status: "pendiente",
    });

    if (orderError) {
      console.error("No se pudo guardar el pedido:", orderError);
      return new Response(
        JSON.stringify({ error: "No se pudo registrar el pedido." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Si el pago es manual (transferencia/efectivo/contraentrega), no se cobra
    // nada por ePayco — el pedido queda registrado como pendiente y listo.
    if (method !== "epayco") {
      return new Response(
        JSON.stringify({ manual: true, invoice, totalCharged }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Autenticarse con ePayco (Basic Auth con PUBLIC_KEY:PRIVATE_KEY)
    const PUBLIC_KEY = Deno.env.get("EPAYCO_PUBLIC_KEY")!;
    const PRIVATE_KEY = Deno.env.get("EPAYCO_PRIVATE_KEY")!;
    const basicAuth = btoa(`${PUBLIC_KEY}:${PRIVATE_KEY}`);

    const loginRes = await fetch("https://apify.epayco.co/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${basicAuth}`,
      },
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    if (!token) {
      console.error("Fallo login ePayco:", loginData);
      return new Response(
        JSON.stringify({ error: "No se pudo autenticar con ePayco", details: loginData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Crear la sesión del pago — el monto es EXACTAMENTE el total_charged
    //    que acabamos de guardar en la orden (nunca uno distinto)
    const sessionRes = await fetch("https://apify.epayco.co/payment/session/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        checkout_version: "2",
        name: "Leviatán House",
        currency: "COP",
        amount: totalCharged,
        description: descriptionParts.join(", ").slice(0, 200),
        invoice: invoice,
        country: "CO",
        lang: "ES",
        response: responseUrl,
        confirmation: "https://cdthmlxlmlzxntzylflt.supabase.co/functions/v1/epayco-confirmation",
        extras: { extra1: JSON.stringify(items).slice(0, 250) },
      }),
    });

    const sessionData = await sessionRes.json();

    if (!sessionData.success) {
      console.error("Fallo creación de sesión:", sessionData);
      return new Response(
        JSON.stringify({ error: "No se pudo crear la sesión de pago", details: sessionData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        sessionId: sessionData.data.sessionId,
        subtotal,
        epaycoFee,
        totalCharged,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Error creando sesión ePayco:", err);
    return new Response(
      JSON.stringify({ error: "Error interno", details: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
