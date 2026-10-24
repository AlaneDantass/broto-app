import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

/**
 * Edge Function: google-calendar-sync
 *
 * Ponto central de integração com a API do Google Calendar.
 * O cliente (app Tauri) NUNCA tem acesso aos tokens — tudo acontece aqui no servidor.
 *
 * Autenticação: JWT do usuário no header Authorization (validado pelo Supabase Auth).
 *
 * Actions suportadas (body JSON):
 *   { action: 'create', evento: EventoCalendario }   → cria no Google, retorna { google_event_id }
 *   { action: 'update', evento: EventoCalendario }   → atualiza no Google
 *   { action: 'delete', google_event_id: string }    → remove do Google
 *   { action: 'pull' }                               → importa novos eventos do Google para o Broto
 *   { action: 'get_oauth_url' }                      → retorna a URL de autorização OAuth
 *
 * Variáveis de ambiente necessárias:
 *   GOOGLE_CLIENT_ID
 *   GOOGLE_CLIENT_SECRET
 *   SUPABASE_URL (automático)
 *   SUPABASE_SERVICE_ROLE_KEY (automático)
 *   SUPABASE_ANON_KEY (automático)
 */

const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_CALENDAR_API = "https://www.googleapis.com/calendar/v3";

interface EventoBroto {
  id: string;
  titulo: string;
  data: string;       // YYYY-MM-DD
  hora?: string;      // HH:MM ou HH:MM:SS
  duracao_minutos?: number;
  cor?: string;
  google_event_id?: string;
}

/** Renova o access_token se estiver expirado ou prestes a expirar (< 5min) */
async function getValidAccessToken(
  supabase: ReturnType<typeof createClient>,
  usuarioId: string
): Promise<string> {
  const { data: integracao, error } = await supabase
    .from("integracoes_google_agenda")
    .select("access_token, refresh_token, token_expira_em")
    .eq("usuario_id", usuarioId)
    .eq("ativo", true)
    .single();

  if (error || !integracao) throw new Error("Integração Google não encontrada.");

  const expira = new Date(integracao.token_expira_em).getTime();
  const agora = Date.now();
  const margemMs = 5 * 60 * 1000; // 5 minutos de margem

  if (expira - agora > margemMs) {
    return integracao.access_token;
  }

  // Renovar o token
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;

  const refreshRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: integracao.refresh_token,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
    }),
  });

  if (!refreshRes.ok) {
    const errBody = await refreshRes.text();
    console.error("Falha ao renovar token:", errBody);
    throw new Error("Falha ao renovar access_token do Google.");
  }

  const refreshData = await refreshRes.json();
  const newAccessToken = refreshData.access_token;
  const newExpiresIn = refreshData.expires_in || 3600;
  const newTokenExpiraEm = new Date(Date.now() + newExpiresIn * 1000).toISOString();

  // Salvar novo access_token no banco
  await supabase
    .from("integracoes_google_agenda")
    .update({
      access_token: newAccessToken,
      token_expira_em: newTokenExpiraEm,
    })
    .eq("usuario_id", usuarioId);

  return newAccessToken;
}

/** Converte um evento Broto para o formato da API do Google Calendar */
function toGoogleEvent(evento: EventoBroto) {
  const hasTime = evento.hora && evento.hora.trim() !== "";
  const horaLimpa = hasTime ? evento.hora!.slice(0, 5) : null; // HH:MM

  if (hasTime && horaLimpa) {
    // Evento com horário específico (dateTime)
    const startDateTime = `${evento.data}T${horaLimpa}:00`;
    // Duração padrão de 1 hora (ou duracao_minutos se informado)
    const duracaoMin = evento.duracao_minutos && evento.duracao_minutos > 0 ? evento.duracao_minutos : 60;
    const endDate = new Date(`${evento.data}T${horaLimpa}:00`);
    endDate.setMinutes(endDate.getMinutes() + duracaoMin);
    const pad = (n: number) => String(n).padStart(2, "0");
    const endDateTime = `${endDate.getFullYear()}-${pad(endDate.getMonth() + 1)}-${pad(endDate.getDate())}T${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`;

    return {
      summary: evento.titulo,
      start: { dateTime: `${startDateTime}`, timeZone: "America/Sao_Paulo" },
      end: { dateTime: `${endDateTime}:00`, timeZone: "America/Sao_Paulo" },
      colorId: googleColorIdFromHex(evento.cor),
      extendedProperties: {
        private: { broto_id: evento.id },
      },
    };
  } else {
    // Evento de dia inteiro (date)
    const nextDay = new Date(evento.data + "T12:00:00");
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayStr = nextDay.toISOString().slice(0, 10);

    return {
      summary: evento.titulo,
      start: { date: evento.data },
      end: { date: nextDayStr },
      colorId: googleColorIdFromHex(evento.cor),
      extendedProperties: {
        private: { broto_id: evento.id },
      },
    };
  }
}

/** Mapa simples de hex aproximado para colorId do Google Calendar (1-11) */
function googleColorIdFromHex(hex?: string): string {
  if (!hex) return "1";
  const colorMap: Record<string, string> = {
    "#E76F51": "6",  // Tomato
    "#2A9D8F": "2",  // Sage
    "#457B9D": "9",  // Blueberry
    "#8338EC": "3",  // Grape
    "#F15BB5": "4",  // Flamingo
  };
  return colorMap[hex.toUpperCase()] || colorMap[hex] || "1";
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Authorization, Content-Type",
      },
    });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;

  // Autenticação via JWT do usuário
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Authorization header ausente" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  // Validar o JWT e obter o usuário
  const supabaseAnon = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user }, error: authError } = await supabaseAnon.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Token inválido" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const usuarioId = user.id;

  // Service role client (para operações de token sem RLS)
  const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const body = await req.json().catch(() => ({}));
  const { action } = body;

  const jsonResponse = (data: unknown, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });

  // ── GET_OAUTH_URL ──────────────────────────────────────────────────────────
  if (action === "get_oauth_url") {
    const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-oauth-callback`;
    const oauthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    oauthUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
    oauthUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    oauthUrl.searchParams.set("response_type", "code");
    oauthUrl.searchParams.set("scope", "https://www.googleapis.com/auth/calendar.events openid email profile");
    oauthUrl.searchParams.set("access_type", "offline");
    oauthUrl.searchParams.set("prompt", "consent"); // garante refresh_token
    oauthUrl.searchParams.set("state", usuarioId);  // passado de volta no callback

    return jsonResponse({ url: oauthUrl.toString() });
  }

  // Para as demais actions, precisamos de uma integração ativa
  let accessToken: string;
  try {
    accessToken = await getValidAccessToken(supabaseService, usuarioId);
  } catch (err) {
    return jsonResponse({ error: (err as Error).message }, 400);
  }

  // ── CREATE ─────────────────────────────────────────────────────────────────
  if (action === "create") {
    const evento: EventoBroto = body.evento;
    const googleEvent = toGoogleEvent(evento);

    const res = await fetch(`${GOOGLE_CALENDAR_API}/calendars/primary/events`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(googleEvent),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Erro ao criar evento no Google:", errBody);
      return jsonResponse({ error: "Erro ao criar evento no Google Calendar" }, 502);
    }

    const created = await res.json();
    const googleEventId = created.id;

    // Salvar google_event_id e sincronizado_em no banco
    await supabaseService
      .from("eventos_calendario")
      .update({
        google_event_id: googleEventId,
        sincronizado_em: new Date().toISOString(),
      })
      .eq("id", evento.id)
      .eq("usuario_id", usuarioId);

    return jsonResponse({ google_event_id: googleEventId });
  }

  // ── UPDATE ─────────────────────────────────────────────────────────────────
  if (action === "update") {
    const evento: EventoBroto = body.evento;
    if (!evento.google_event_id) {
      return jsonResponse({ error: "google_event_id ausente" }, 400);
    }

    const googleEvent = toGoogleEvent(evento);

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${evento.google_event_id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(googleEvent),
      }
    );

    if (!res.ok) {
      const errBody = await res.text();
      console.error("Erro ao atualizar evento no Google:", errBody);
      return jsonResponse({ error: "Erro ao atualizar evento no Google Calendar" }, 502);
    }

    // Atualizar sincronizado_em
    await supabaseService
      .from("eventos_calendario")
      .update({ sincronizado_em: new Date().toISOString() })
      .eq("id", evento.id)
      .eq("usuario_id", usuarioId);

    return jsonResponse({ ok: true });
  }

  // ── DELETE ─────────────────────────────────────────────────────────────────
  if (action === "delete") {
    const googleEventId: string = body.google_event_id;
    if (!googleEventId) {
      return jsonResponse({ error: "google_event_id ausente" }, 400);
    }

    const res = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/primary/events/${googleEventId}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // 404 = evento já não existe no Google — tudo bem, consideramos sucesso
    if (!res.ok && res.status !== 404) {
      const errBody = await res.text();
      console.error("Erro ao deletar evento no Google:", errBody);
      return jsonResponse({ error: "Erro ao deletar evento no Google Calendar" }, 502);
    }

    return jsonResponse({ ok: true });
  }

  // ── PULL (Google → Broto) ──────────────────────────────────────────────────
  if (action === "pull") {
    // Buscar eventos do Google atualizados desde a última sincronização
    // Para simplificar, buscamos os últimos 60 dias e os próximos 365 dias
    const timeMin = new Date();
    timeMin.setDate(timeMin.getDate() - 60);
    const timeMax = new Date();
    timeMax.setFullYear(timeMax.getFullYear() + 1);

    const listUrl = new URL(`${GOOGLE_CALENDAR_API}/calendars/primary/events`);
    listUrl.searchParams.set("timeMin", timeMin.toISOString());
    listUrl.searchParams.set("timeMax", timeMax.toISOString());
    listUrl.searchParams.set("singleEvents", "true");
    listUrl.searchParams.set("orderBy", "startTime");
    listUrl.searchParams.set("maxResults", "250");

    const listRes = await fetch(listUrl.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!listRes.ok) {
      const errBody = await listRes.text();
      console.error("Erro ao listar eventos do Google:", errBody);
      return jsonResponse({ error: "Erro ao listar eventos do Google Calendar" }, 502);
    }

    const listData = await listRes.json();
    const googleEvents = listData.items || [];

    // Buscar IDs do Google já existentes no Broto para este usuário
    const { data: eventosExistentes } = await supabaseService
      .from("eventos_calendario")
      .select("google_event_id")
      .eq("usuario_id", usuarioId)
      .not("google_event_id", "is", null);

    const idsExistentes = new Set(
      (eventosExistentes || []).map((e: { google_event_id: string }) => e.google_event_id)
    );

    // Filtrar apenas eventos que o Broto ainda não conhece
    // (política Q3-A: não sobrescreve edições locais)
    const novos = googleEvents.filter(
      (ge: { id: string; extendedProperties?: { private?: { broto_id?: string } } }) => {
        // Ignorar eventos que o próprio Broto criou no Google (tem broto_id)
        const brotoId = ge.extendedProperties?.private?.broto_id;
        if (brotoId) return false;
        // Ignorar eventos já importados
        if (idsExistentes.has(ge.id)) return false;
        return true;
      }
    );

    let importados = 0;
    for (const ge of novos) {
      // Extrair data e hora do evento do Google
      const isDateTime = !!ge.start?.dateTime;
      const dataStr = isDateTime
        ? ge.start.dateTime.slice(0, 10)
        : ge.start?.date;

      let horaStr: string | undefined;
      if (isDateTime && ge.start?.dateTime) {
        horaStr = ge.start.dateTime.slice(11, 16); // HH:MM
      }

      if (!dataStr) continue;

      const { error: insertError } = await supabaseService
        .from("eventos_calendario")
        .insert({
          usuario_id: usuarioId,
          titulo: ge.summary || "(Sem título)",
          data: dataStr,
          hora: horaStr || null,
          cor: "#808080", // cor neutra para eventos importados
          tipo: "Work Blocks",
          origem: "manual",
          google_event_id: ge.id,
          sincronizado_em: new Date().toISOString(),
        });

      if (!insertError) importados++;
    }

    return jsonResponse({ importados, total_google: googleEvents.length });
  }

  return jsonResponse({ error: "Action desconhecida" }, 400);
});
