// Server only: client for the Odoo External JSON-2 API,
// POST <ODOO_URL>/json/2/<model>/<method> with the API key as bearer token.

const USER_AGENT = "datamints-coworker";

// An error answered by Odoo, e.g. missing access rights or an unknown field.
export class OdooError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly odooName: string,
  ) {
    super(message);
    this.name = "OdooError";
  }
}

function readConfig() {
  const url = process.env.ODOO_URL;
  const apiKey = process.env.ODOO_API_KEY;

  if (!url || !apiKey) {
    throw new Error("ODOO_URL and ODOO_API_KEY must be set, see docs/guides/odoo.md");
  }

  return { url: url.replace(/\/+$/, ""), apiKey, database: process.env.ODOO_DATABASE || undefined };
}

type OdooContext = Record<string, unknown>;

let userContextPromise: Promise<OdooContext> | null = null;

// Language and time zone of the API key's user, asked once per server process.
// Without them Odoo answers in English: translated names (e.g. of projects)
// differ from what the user sees, and searches miss them.
function getUserContext(): Promise<OdooContext> {
  userContextPromise ??= request<OdooContext>("res.users", "context_get", {}).catch((error: unknown) => {
    // Asked again on the next call instead of keeping the failure.
    userContextPromise = null;
    throw error;
  });

  return userContextPromise;
}

// The Odoo user of the API key.
export async function getOdooUid(): Promise<number> {
  return (await getUserContext()).uid as number;
}

// Calls a model method with named parameters: "ids" for record methods, method
// arguments by name (positional arguments are not supported). Every call is
// its own transaction in Odoo and runs in the user's context; a context in the
// params is merged over it.
export async function callOdoo<T>(model: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
  const context = { ...(await getUserContext()), ...(params.context as OdooContext | undefined) };

  return request<T>(model, method, { ...params, context });
}

async function request<T>(model: string, method: string, params: Record<string, unknown>): Promise<T> {
  const { url, apiKey, database } = readConfig();
  const response = await fetch(`${url}/json/2/${model}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `bearer ${apiKey}`,
      "Content-Type": "application/json; charset=utf-8",
      "User-Agent": USER_AGENT,
      ...(database ? { "X-Odoo-Database": database } : {}),
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    // The "debug" field holds the server traceback and is left out on purpose.
    const error = body as { name?: string; message?: string } | null;

    throw new OdooError(
      error?.message ?? `Odoo answered ${response.status} for ${model}.${method}`,
      response.status,
      error?.name ?? "",
    );
  }

  return body as T;
}
