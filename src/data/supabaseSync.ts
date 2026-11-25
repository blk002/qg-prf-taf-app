import type { RemoteTafAppData, TafSimulado, TafTrainingStatus } from '../domain/types';

export interface SupabaseSession {
  accessToken: string;
  refreshToken: string;
  email: string;
}

export interface RemoteTafPayload {
  tafHistory: TafSimulado[];
  tafTrainingStatus: TafTrainingStatus;
  tafAppData: RemoteTafAppData;
  updatedAt: string | null;
}

export class SupabaseSyncError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 0) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function normalizeSupabaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '';
  return trimmed
    .replace(/\/+(?:rest|auth|storage|realtime)\/v1\/?.*$/i, '')
    .replace(/\/+$/, '');
}

function mapSupabaseError(code: number, rawBody: string, isAuth: boolean): SupabaseSyncError {
  if (
    code === 404 ||
    /PGRST202/i.test(rawBody) ||
    /Could not find the function/i.test(rawBody)
  ) {
    return new SupabaseSyncError(
      'Função SQL de sincronização não encontrada no Supabase. Execute supabase/taf_sync_rpc.sql no SQL Editor.',
      code
    );
  }
  if (code === 401) {
    return new SupabaseSyncError('Sessão expirada (401). Entre novamente na conta.', code);
  }
  if (code === 400 && isAuth) {
    return new SupabaseSyncError('E-mail, senha ou Anon Key inválidos no Supabase.', code);
  }
  return new SupabaseSyncError(`Erro Supabase (${code}): ${rawBody.slice(0, 180)}`, code);
}

export async function signInSupabase(
  rawUrl: string,
  anonKey: string,
  email: string,
  password: string
): Promise<SupabaseSession> {
  const baseUrl = normalizeSupabaseUrl(rawUrl);
  if (!baseUrl.startsWith('https://') && !baseUrl.startsWith('http://')) {
    throw new SupabaseSyncError('Informe uma URL do Supabase válida (ex.: https://xxxx.supabase.co).');
  }

  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: anonKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim(), password }),
    });
  } catch (err) {
    throw new SupabaseSyncError(
      `Sem conexão com o Supabase (${err instanceof Error ? err.message : 'rede indisponível'}).`
    );
  }

  const raw = await resp.text();
  if (!resp.ok) throw mapSupabaseError(resp.status, raw, true);

  const parsed = JSON.parse(raw) as {
    access_token?: string;
    refresh_token?: string;
    user?: { email?: string };
  };
  if (!parsed.access_token) {
    throw new SupabaseSyncError('Resposta de login inválida do Supabase.');
  }

  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token ?? '',
    email: parsed.user?.email || email.trim(),
  };
}

export async function refreshSupabaseSession(
  rawUrl: string,
  anonKey: string,
  refreshToken: string,
  fallbackEmail: string
): Promise<SupabaseSession> {
  const baseUrl = normalizeSupabaseUrl(rawUrl);
  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: anonKey.trim(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
  } catch (err) {
    throw new SupabaseSyncError(
      `Sem conexão com o Supabase (${err instanceof Error ? err.message : 'rede indisponível'}).`
    );
  }

  const raw = await resp.text();
  if (!resp.ok) throw mapSupabaseError(resp.status, raw, true);

  const parsed = JSON.parse(raw) as {
    access_token?: string;
    refresh_token?: string;
    user?: { email?: string };
  };
  if (!parsed.access_token) {
    throw new SupabaseSyncError('Sessão expirada. Entre novamente na conta.');
  }
  return {
    accessToken: parsed.access_token,
    refreshToken: parsed.refresh_token ?? refreshToken,
    email: parsed.user?.email || fallbackEmail,
  };
}

export async function pullTafPayload(
  rawUrl: string,
  anonKey: string,
  accessToken: string
): Promise<RemoteTafPayload> {
  const baseUrl = normalizeSupabaseUrl(rawUrl);
  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/rest/v1/rpc/get_taf_sync_payload`, {
      method: 'POST',
      headers: {
        apikey: anonKey.trim(),
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
  } catch (err) {
    throw new SupabaseSyncError(
      `Sem conexão com o servidor (${err instanceof Error ? err.message : 'offline'}). Seus treinos continuam salvos localmente.`
    );
  }

  const raw = await resp.text();
  if (!resp.ok) throw mapSupabaseError(resp.status, raw, false);

  const parsed = JSON.parse(raw) as Partial<RemoteTafPayload>;
  return {
    tafHistory: Array.isArray(parsed.tafHistory) ? parsed.tafHistory : [],
    tafTrainingStatus: parsed.tafTrainingStatus ?? { lastDoneDate: null },
    tafAppData: parsed.tafAppData ?? {},
    updatedAt: parsed.updatedAt ?? null,
  };
}

export async function pushTafPayload(
  rawUrl: string,
  anonKey: string,
  accessToken: string,
  tafHistory: TafSimulado[],
  tafTrainingStatus: TafTrainingStatus,
  tafAppData: RemoteTafAppData
): Promise<string | null> {
  const baseUrl = normalizeSupabaseUrl(rawUrl);
  let resp: Response;
  try {
    resp = await fetch(`${baseUrl}/rest/v1/rpc/sync_taf_payload`, {
      method: 'POST',
      headers: {
        apikey: anonKey.trim(),
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        p_taf_history: tafHistory,
        p_taf_training_status: tafTrainingStatus,
        p_taf_app_data: tafAppData,
      }),
    });
  } catch (err) {
    throw new SupabaseSyncError(
      `Sem conexão com o servidor (${err instanceof Error ? err.message : 'offline'}). Seus treinos continuam salvos localmente.`
    );
  }

  const raw = await resp.text();
  if (!resp.ok) throw mapSupabaseError(resp.status, raw, false);
  try {
    const parsed = JSON.parse(raw) as { updatedAt?: string };
    return parsed.updatedAt ?? null;
  } catch {
    return null;
  }
}
