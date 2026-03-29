/**
 * Cloudflare Pages Function — POST /api/send-email
 *
 * Required environment variable in Cloudflare Pages project settings:
 *   RESEND_API_KEY  →  re_xxxxxxxxxxxx
 *
 * Body (JSON):
 *   { to, subject, body, prospectId }
 */

const FROM_ADDRESS = 'Miguel Cedillo <miguel@outreach.voxmedia.com.mx>';
const REPLY_TO     = 'miguel@voxmedia.com.mx';

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers so the SPA (same domain) can call this freely
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  try {
    const { to, subject, body } = await request.json();

    if (!to || !subject || !body) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos: to, subject, body' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    if (!env.RESEND_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY no configurada en el entorno' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    // Convert plain text line breaks to HTML for better rendering
    const htmlBody = body
      .split('\n')
      .map(line => line.trim() === '' ? '<br>' : `<p style="margin:0 0 8px">${line}</p>`)
      .join('\n');

    const resendPayload = {
      from: FROM_ADDRESS,
      to: [to],
      subject,
      text: body,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111;max-width:600px">${htmlBody}</div>`,
      reply_to: REPLY_TO,
    };

    const resendResp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(resendPayload),
    });

    const resendData = await resendResp.json();

    if (!resendResp.ok) {
      return new Response(
        JSON.stringify({ error: resendData.message || 'Error de Resend' }),
        { status: resendResp.status, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ ok: true, id: resendData.id }),
      { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || 'Error interno' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
}

// Handle preflight OPTIONS
export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
