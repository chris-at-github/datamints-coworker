# Ticket Forge in Claude Code (MCP)

Claude Code erreicht Ticket Forge über einen MCP-Server der App
(`/api/mcp`, Streamable HTTP). Claude Code kann Anforderungen anlegen, lesen,
ändern und nachschärfen. Nach Odoo überträgt nur die App.

## Einrichten

**Problem:** Claude Code soll Ticket Forge in allen eigenen Projekten nutzen.

**Vorgehen:**

1. Token erzeugen und in `.env` eintragen, dann den Dev-Server neu starten:

```bash
openssl rand -base64 32
# .env
TICKET_FORGE_MCP_TOKEN="…"
TICKET_FORGE_APP_URL="https://datamints-coworker.ddev.site:3000"
```

2. Server in Claude Code für alle Projekte (Scope `user`) eintragen:

```bash
claude mcp add --scope user --transport http ticket-forge \
  https://datamints-coworker.ddev.site:3000/api/mcp \
  --header "Authorization: Bearer <TICKET_FORGE_MCP_TOKEN>"
```

3. Prüfen: `claude mcp get ticket-forge` zeigt „✔ Connected“; in einer
   Sitzung listet `/mcp` den Server mit seinen Tools.

**Hinweise:**

- Ohne `TICKET_FORGE_MCP_TOKEN` antwortet die Route mit 503, mit falschem
  Token mit 401. Der Token steht danach in `~/.claude.json`, nie im Repository.
- Neuer Token: in `.env` ersetzen, Dev-Server neu starten, dann
  `claude mcp remove ticket-forge -s user` und Schritt 2 wiederholen.
- DDEV muss laufen; sonst meldet `claude mcp get` keine Verbindung.
- Scheitert die Verbindung am Zertifikat von DDEV (mkcert), Claude Code mit
  `NODE_EXTRA_CA_CERTS="$(mkcert -CAROOT)/rootCA.pem"` starten. Bei der
  Einrichtung im November 2026 war das nicht nötig.

## Tools

| Tool | Zweck |
| --- | --- |
| `create_requirement` | Rohtext anlegen; mit `prepare` (Standard) bereitet die KI der App auf |
| `get_requirement` | Alle Felder, KI-Rückmeldung, Odoo-Ticket, Link zur App |
| `list_requirements` | Nicht archivierte Anforderungen |
| `update_requirement` | Titel, Beschreibung, interne Beschreibung ändern |
| `refine_requirement` | Mit einer Anweisung über die KI der App nachschärfen |
| `get_ticket_guidelines` | Regeln aus `prompts/ticket-forge.md` für selbst geschriebene Tickets |

**Hinweise:**

- Beispiel in einer Sitzung: „Leg in Ticket Forge eine Anforderung aus dieser
  Mail an: …“. Claude Code antwortet mit dem Link zur Anforderung; übertragen
  wird in der App.
- Im Rohtext mit „intern:“ markierte Zeilen landen in der internen Beschreibung.
- Über MCP angelegte Anforderungen tragen in der Liste das Kennzeichen
  „Claude Code“.
- Undo, Archivieren und die Übertragung nach Odoo gibt es nur in der App.
- Claude Code fragt vor jedem Tool-Aufruf nach Erlaubnis, außer das Tool ist in
  den Einstellungen freigegeben.
