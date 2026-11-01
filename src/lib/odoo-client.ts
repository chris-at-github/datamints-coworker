// Server only: client for the Odoo External JSON-2 API,
// POST <ODOO_URL>/json/2/<model>/<method> with the API key as bearer token.

const USER_AGENT = "datamints-works";

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

// Calls a model method with named parameters: "ids" for record methods, method
// arguments by name (positional arguments are not supported). Every call is
// its own transaction in Odoo.
export async function callOdoo<T>(model: string, method: string, params: Record<string, unknown> = {}): Promise<T> {
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
