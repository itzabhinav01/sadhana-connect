// Sadhana Connect — Phase 14: Super Admin trusted backend
// Updated Phase 20C: added hard_delete (see its own section below).
//
// The ONLY place in this application that ever holds a Supabase secret
// (service-role-equivalent) API key. It exposes exactly five Auth Admin
// operations — ban, unban, generate_recovery_link, get_user_email,
// hard_delete — and the secret-keyed client is used for nothing else:
// every public-table read this function needs (caller's own profile,
// target's profile) goes through the CALLER's own RLS-scoped client
// instead, never service-role. Every other Super Admin operation
// (disable, role change, temple groups, announcements, reassignment)
// goes through the normal authenticated client under existing RLS
// entirely outside this function; this function is deliberately narrow.
//
// get_user_email exists because profiles.email was deliberately NOT added
// to the schema (it would be exposed to a devotee's assigned mentor under
// existing row-level, not column-level, profiles RLS) — email is fetched
// on demand, admin-detail-view-only, through this trusted path instead.
// It shares the exact same authorization/target-validation pipeline as
// the other three actions, including self-target and peer-super_admin
// rejection — kept uniform across all four actions rather than carving
// out a read-only exception, to keep this file's one authorization path
// easy to audit as a whole.
//
// Runtime: Deno (Supabase Edge Functions). Not part of the Vite build or
// its TypeScript project — see tsconfig.app.json's `include: ["src"]` and
// eslint.config.js's globalIgnores, which both deliberately exclude this
// directory, since Deno's global APIs (Deno.serve, Deno.env) don't exist in
// the browser/vite-node toolchain this repo otherwise targets.
//
// Required secrets (set via `supabase secrets set`, never committed, never
// a VITE_* variable, never in .env/.env.example):
//   ALLOWED_ORIGINS          comma-separated list of origins permitted to
//                            call this function (CORS allow-list). Never "*".
//   APP_ORIGIN               the single canonical origin where
//                            /reset-password is hosted, used as
//                            generateLink's redirectTo. This is where the
//                            TARGET user's browser will land when they open
//                            the recovery link — not necessarily the same
//                            origin the admin console is running on.
//   SERVICE_ROLE_SECRET_KEY  this project's new-format secret API key
//                            (sb_secret_...), used for every Auth Admin
//                            call. NOT named SUPABASE_*: this project has
//                            legacy API keys (the old anon/service_role
//                            JWTs) disabled, so the platform-auto-injected
//                            SUPABASE_SERVICE_ROLE_KEY env var — which still
//                            holds the legacy value — is rejected by the API
//                            gateway ("Legacy API keys are disabled").
//                            `supabase secrets set` also refuses any name
//                            starting with SUPABASE_ regardless, so this had
//                            to be a custom name either way. Set from the
//                            "secret" (not "publishable") key returned by
//                            `supabase projects api-keys --reveal`.
//
// SUPABASE_URL and SUPABASE_ANON_KEY are injected automatically by the
// Supabase platform (and by the CLI for local `functions serve`) into every
// Edge Function's environment — confirmed still functional for this project
// (the caller-authorization path below uses SUPABASE_ANON_KEY successfully;
// only the legacy service_role key is rejected).

import { createClient } from 'npm:@supabase/supabase-js@2'
import { z } from 'npm:zod@3'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')
const SERVICE_ROLE_SECRET_KEY =
  Deno.env.get('SERVICE_ROLE_SECRET_KEY') ??
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('SERVICE_ROLE_KEY')
const APP_ORIGIN = Deno.env.get('APP_ORIGIN') ?? 'http://localhost:5173'
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0)

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_SECRET_KEY) {
  throw new Error(
    'admin-account-actions: missing required environment configuration (SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY).',
  )
}

// Indefinite ban, matching the approved account-lifecycle design: Supabase
// has no literal "forever" duration, so ~100 years is the idiomatic
// stand-in. Used by `ban` (the reversible disable path) — hard_delete
// below is the separate, deliberately irreversible removal path and
// calls auth.admin.deleteUser() directly instead.
const INDEFINITE_BAN_DURATION = '876000h'

const requestSchema = z.object({
  action: z.enum(['ban', 'unban', 'generate_recovery_link', 'get_user_email', 'hard_delete']),
  targetUserId: z.string().uuid(),
})

type Action = z.infer<typeof requestSchema>['action']

// Phase 19 remediation round 2: per-admin, per-action limits over a
// fixed 5-minute window, enforced via check_and_increment_admin_rate_limit()
// (0010_admin_action_rate_limits) — one atomic Postgres UPSERT, durable
// and correct across however many instances of this function are
// running concurrently. hard_delete (Phase 20C) is the strictest of all
// five — it is irreversible and destroys data, unlike generate_recovery_link
// which only mints a link.
const ACTION_RATE_LIMITS: Record<Action, number> = {
  ban: 20,
  unban: 20,
  get_user_email: 30,
  generate_recovery_link: 5,
  hard_delete: 5,
}

type ServiceClient = ReturnType<typeof createClient>

function jsonResponse(body: unknown, status: number, corsHeaders: Headers): Response {
  const headers = new Headers(corsHeaders)
  headers.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(body), { status, headers })
}

function buildCorsHeaders(origin: string | null): Headers {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Headers', 'authorization, x-client-info, apikey, content-type')
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS')
  if (origin) {
    if (ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes('*') || ALLOWED_ORIGINS.includes(origin)) {
      headers.set('Access-Control-Allow-Origin', origin)
      headers.set('Vary', 'Origin')
    }
  } else {
    headers.set('Access-Control-Allow-Origin', '*')
  }
  return headers
}

async function handleBan(serviceClient: ServiceClient, targetUserId: string) {
  const { error } = await serviceClient.auth.admin.updateUserById(targetUserId, {
    ban_duration: INDEFINITE_BAN_DURATION,
  })
  if (error) throw error
  return { ok: true as const }
}

async function handleUnban(serviceClient: ServiceClient, targetUserId: string) {
  const { error } = await serviceClient.auth.admin.updateUserById(targetUserId, {
    ban_duration: 'none',
  })
  if (error) throw error
  return { ok: true as const }
}

async function handleGenerateRecoveryLink(serviceClient: ServiceClient, targetUserId: string) {
  const { data: targetUser, error: getUserError } =
    await serviceClient.auth.admin.getUserById(targetUserId)

  if (getUserError || !targetUser?.user?.email) {
    throw getUserError ?? new Error('Target account has no email on file.')
  }

  const { data, error } = await serviceClient.auth.admin.generateLink({
    type: 'recovery',
    email: targetUser.user.email,
    options: {
      redirectTo: `${APP_ORIGIN}/reset-password`,
    },
  })
  if (error) throw error

  // Returned exactly once, directly in this HTTP response body. Never
  // logged (see the catch block below, which never logs `data`), never
  // written to any table, never cached — the caller (the admin browser) is
  // responsible for the same discipline at the application layer.
  return { ok: true as const, actionLink: data.properties.action_link }
}

async function handleGetUserEmail(serviceClient: ServiceClient, targetUserId: string) {
  const { data: targetUser, error } = await serviceClient.auth.admin.getUserById(targetUserId)

  if (error || !targetUser?.user?.email) {
    throw error ?? new Error('Target account has no email on file.')
  }

  return { ok: true as const, email: targetUser.user.email }
}

// Phase 20C — true hard delete, approved reversal of the Phase 5/14
// anonymize-and-preserve design. Two steps, in this exact order (order
// matters: profiles.id -> auth.users.id is ON DELETE RESTRICT, so the
// profiles row must be gone before auth.users deletion can succeed):
//
//   1. public.hard_delete_profile(uuid) RPC (0016) — a narrow SECURITY
//      DEFINER function, EXECUTE-granted only to service_role. NOT a
//      direct `.from('profiles').delete()`: service_role is
//      deliberately given zero direct table grants project-wide (see
//      0010's own rate-limit table for the same pattern) — a live
//      verification bug (42501 insufficient_privilege) confirmed
//      service_role genuinely has no SELECT/DELETE on profiles at the
//      Postgres level, so this RPC is the only path that can do this at
//      all. Cascades sadhana_reports, mentor_assignments (either side),
//      sadhana_report_comments, and announcement_comments per the widened
//      FKs in 0013 — irreversible, exactly as approved.
//   2. auth.admin.deleteUser() — permanently removes the Supabase Auth
//      account. Unlike `ban`, there is no "un-delete": this account can
//      never sign in again, and re-registering with the same email
//      creates a brand-new, unrelated account.
//
// If step 2 fails after step 1 already succeeded, there is deliberately
// no retry mechanism: the profiles row (and the admin's page for it) is
// already gone, so there is nowhere left for a "retry" affordance to
// live. This is logged server-side for manual follow-up and reported to
// the caller as a distinct, terminal partial state rather than a plain
// failure — never silently claimed as full success.
async function handleHardDelete(serviceClient: ServiceClient, targetUserId: string) {
  const { error: profileDeleteError } = await serviceClient.rpc('hard_delete_profile', {
    p_profile_id: targetUserId,
  })
  if (profileDeleteError) throw profileDeleteError

  const { error: authDeleteError } = await serviceClient.auth.admin.deleteUser(targetUserId)
  if (authDeleteError) {
    console.error('admin-account-actions: profile deleted but auth removal failed', {
      targetUserId,
      message: authDeleteError.message,
    })
    return { ok: true as const, stage: 'profile-deleted' as const }
  }

  return { ok: true as const, stage: 'complete' as const }
}

const ACTION_HANDLERS: Record<
  z.infer<typeof requestSchema>['action'],
  (
    serviceClient: ServiceClient,
    targetUserId: string,
  ) => Promise<{ ok: true; actionLink?: string; email?: string; stage?: string }>
> = {
  ban: handleBan,
  unban: handleUnban,
  generate_recovery_link: handleGenerateRecoveryLink,
  get_user_email: handleGetUserEmail,
  hard_delete: handleHardDelete,
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = buildCorsHeaders(origin)

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  // Requiring an allow-listed Origin header when Origin is provided
  if (origin && ALLOWED_ORIGINS.length > 0 && !ALLOWED_ORIGINS.includes('*') && !ALLOWED_ORIGINS.includes(origin)) {
    return jsonResponse({ ok: false, error: 'Origin not allowed.' }, 403, corsHeaders)
  }

  if (req.method !== 'POST') {
    return jsonResponse({ ok: false, error: 'Method not allowed.' }, 405, corsHeaders)
  }

  let rawBody: unknown
  try {
    rawBody = await req.json()
  } catch {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400, corsHeaders)
  }

  const parsedBody = requestSchema.safeParse(rawBody)
  if (!parsedBody.success) {
    return jsonResponse({ ok: false, error: 'Invalid request body.' }, 400, corsHeaders)
  }
  const { action, targetUserId } = parsedBody.data

  const authHeader = req.headers.get('authorization')
  if (!authHeader) {
    return jsonResponse({ ok: false, error: 'Missing authorization.' }, 401, corsHeaders)
  }

  // Scoped to the CALLER's own JWT — every query on this client is subject
  // to that caller's own RLS, exactly as if they'd queried it themselves.
  const callerClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const { data: userData, error: userError } = await callerClient.auth.getUser()
  if (userError || !userData?.user) {
    return jsonResponse({ ok: false, error: 'Not authenticated.' }, 401, corsHeaders)
  }
  const callerId = userData.user.id

  // Allowed only by the EXISTING profiles_select self-row branch
  // (id = auth.uid()) defined in 0001_initial_schema.sql — no new policy,
  // no new private.* wrapper function, no elevated privilege used here.
  const { data: callerProfile, error: callerProfileError } = await callerClient
    .from('profiles')
    .select('role, is_active')
    .eq('id', callerId)
    .single()

  if (
    callerProfileError ||
    !callerProfile ||
    callerProfile.role !== 'super_admin' ||
    !callerProfile.is_active
  ) {
    return jsonResponse({ ok: false, error: 'Not authorized.' }, 403, corsHeaders)
  }

  if (action !== 'get_user_email' && targetUserId === callerId) {
    return jsonResponse({ ok: false, error: 'Cannot target your own account.' }, 400, corsHeaders)
  }

  // Target-profile lookup uses the CALLER's own RLS-scoped client, not
  // service-role: the caller is already verified as an active super admin
  // above, and profiles_select's is_super_admin() branch already grants
  // them unrestricted SELECT on every profile row. This keeps service-role
  // scoped to exactly what genuinely requires it — the Auth Admin API
  // calls below — with zero public-table reads or writes on that client.
  const { data: targetProfile, error: targetProfileError } = await callerClient
    .from('profiles')
    .select('role, anonymized_at')
    .eq('id', targetUserId)
    .maybeSingle()

  if (targetProfileError) {
    console.error('admin-account-actions: failed to load target profile', action)
    return jsonResponse({ ok: false, error: 'Unable to load target account.' }, 500, corsHeaders)
  }
  if (!targetProfile) {
    return jsonResponse({ ok: false, error: 'Target account does not exist.' }, 404, corsHeaders)
  }
  if (action !== 'get_user_email' && targetProfile.role === 'super_admin') {
    return jsonResponse({ ok: false, error: 'Cannot target another super admin.' }, 403, corsHeaders)
  }

  if (action === 'unban' && targetProfile.anonymized_at !== null) {
    return jsonResponse(
      { ok: false, error: 'Anonymized accounts cannot be unbanned.' },
      400,
      corsHeaders,
    )
  }

  // Constructed now — needed both for the rate-limit check immediately
  // below and, if the limit isn't exceeded, for the requested action
  // itself. Still never touches any public table directly: the rate
  // limit is only ever reached through the narrow, service-role-only
  // check_and_increment_admin_rate_limit() RPC (0010).
  const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  // Every caller reaching this point has already passed authentication,
  // super_admin authorization, self-target rejection, peer-admin
  // rejection, and target-existence validation above — rate limiting is
  // an additional gate on an already-authorized request, never a
  // substitute for or bypass of any of those checks.
  const { data: requestCount, error: rateLimitError } = await serviceClient.rpc(
    'check_and_increment_admin_rate_limit',
    { p_admin_id: callerId, p_action: action },
  )

  if (rateLimitError || typeof requestCount !== 'number') {
    // Fail closed: if the rate-limit check itself cannot be evaluated,
    // the action does not proceed — a broken rate limiter must never
    // silently become an open gate. Generic response, same discipline
    // as the action-failure catch block below: no raw DB error forwarded.
    console.error('admin-account-actions: rate limit check failed', { action })
    return jsonResponse(
      { ok: false, error: 'The requested action could not be completed.' },
      502,
      corsHeaders,
    )
  }

  if (requestCount > ACTION_RATE_LIMITS[action]) {
    // Deliberately reveals nothing beyond "too many requests": not the
    // current count, not the configured limit, not the window.
    return jsonResponse(
      { error: 'Too many requests. Please wait and try again.' },
      429,
      corsHeaders,
    )
  }

  try {
    const result = await ACTION_HANDLERS[action](serviceClient, targetUserId)
    return jsonResponse(result, 200, corsHeaders)
  } catch (error) {
    // Deliberately generic to the client: never forward a raw
    // Supabase/Postgres/Auth error, stack trace, or any target account
    // detail. Server-side log carries only the action name and error
    // message — never the recovery actionLink (which never appears in an
    // error path) and never request/response bodies.
    console.error('admin-account-actions: action failed', {
      action,
      message: error instanceof Error ? error.message : 'unknown error',
    })
    return jsonResponse(
      { ok: false, error: 'The requested action could not be completed.' },
      502,
      corsHeaders,
    )
  }
})
