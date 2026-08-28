// supabase/functions/epayco-create-session/index.ts
//
// El navegador NUNCA debe tener la Private Key de ePayco.
// Esta función vive en el servidor: recibe el detalle del pedido (incluyendo
// datos de envío) desde el sitio, guarda el pedido en la tabla "orders",
// se autentica con ePayco, crea la sesión de pago, y devuelve solo un
// "sessionId" (seguro de compartir) para que el frontend abra el checkout.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const PUBLIC_KEY = Deno.env.get("EPAYCO_PUBLIC_KEY")!;
    const PRIVATE_KEY = Deno.env.get("EPAYCO_PRIVATE_KEY")!;

    const {
      amount, description, invoice, extra1, responseUrl,
      customer, // { name, cc, phone, city, address, deliveryMethod }
      items,    // [{ id, qty }]
      userId,   // uuid del comprador logueado, o null si compró como invitado
    } = await req.json();

    // 0. Guardar el pedido en nuestra base de datos ANTES de ir a ePayco
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
      items: items ?? [],
      total: amount,
      status: "pendiente",
    });

    if (orderError) {
      console.error("No se pudo guardar el pedido:", orderError);
      // seguimos igual con el pago — no queremos bloquear la compra por esto,
      // pero lo dejamos registrado en los logs
    }

    // 1. Autenticarse con ePayco (Basic Auth con PUBLIC_KEY:PRIVATE_KEY)
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

    // 2. Crear la sesión del pago
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
        amount: amount,
        description: description,
        invoice: invoice,
        country: "CO",
        lang: "ES",
        response: responseUrl,
        confirmation: "https://cdthmlxlmlzxntzylflt.supabase.co/functions/v1/epayco-confirmation",
        extras: { extra1: extra1 },
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
      JSON.stringify({ sessionId: sessionData.data.sessionId }),
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
