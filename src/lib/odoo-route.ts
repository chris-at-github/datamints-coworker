// Runs an Odoo request of a route handler; failures (Odoo not reachable, key
// expired, missing rights) answer 502 with the message and are logged.
export async function answerFromOdoo(handler: () => Promise<Response>): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    console.error(error);

    return Response.json({ error: error instanceof Error ? error.message : "Odoo request failed" }, { status: 502 });
  }
}
