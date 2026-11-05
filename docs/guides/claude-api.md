# Claude API

Die Anwendung ruft Claude serverseitig über das offizielle SDK
`@anthropic-ai/sdk` auf. Key, Modell und Effort stehen in `.env`.

## API-Key erstellen

**Problem:** Für Anfragen an Claude braucht der Server einen API-Key.

**Vorgehen:**

1. In der Claude Console anmelden: <https://platform.claude.com>.
   Bei einem Firmenkonto vorher klären, in welcher Organisation und welchem
   Workspace der Key liegen soll.
2. Unter **Billing** Guthaben aufladen: Die API wird im Voraus bezahlt und ist
   unabhängig von einem Claude.ai-Abo (Pro/Max/Team).
3. Unter **Settings → API keys** auf **Create key** klicken, einen sprechenden
   Namen vergeben (z. B. `datamints-coworker-local`) und den Workspace wählen.
4. Den Key (`sk-ant-api…`) sofort kopieren: Er wird nur einmal angezeigt.
5. In `.env` eintragen und den Dev-Server neu starten:

```bash
ANTHROPIC_API_KEY="sk-ant-api…"
```

**Hinweise:**

- `.env` steht in `.gitignore`; den Key nie in `.env.example`, Code oder
  Commits schreiben.
- Die Variable bekommt kein `NEXT_PUBLIC_`-Präfix, sonst landet sie im
  Client-Bundle und ist im Browser lesbar.
- Unter **Settings → Limits** lässt sich ein monatliches Ausgabenlimit setzen.
- Ein verlorener oder geleakter Key wird unter **API keys** gelöscht und durch
  einen neuen ersetzt.
- Verbrauch und Kosten pro Key stehen unter **Usage** und **Cost**.

## Modell und Effort konfigurieren

**Problem:** Modell und Gründlichkeit sollen ohne Codeänderung wechselbar sein.

**Vorgehen:** In `.env` setzen (Vorlage in `.env.example`), dann den Dev-Server
neu starten:

```bash
ANTHROPIC_MODEL="claude-sonnet-5-5"   # z. B. claude-haiku-5-5 für schneller und billiger
ANTHROPIC_EFFORT="low"                # low | medium | high | xhigh | max
```

**Hinweise:**

- `effort` steuert, wie viel das Modell vor der Antwort nachdenkt. `low` ist
  schnell und günstig; werden Regeln im Template übersehen, `medium` probieren.
- Fehlt `ANTHROPIC_MODEL` oder ist `ANTHROPIC_EFFORT` ungültig, antwortet die
  Route mit 502 und nennt den Grund.

## Buchungstext-Template anpassen

**Problem:** Die Regeln für die Prüfung des Buchungstexts sollen sich ändern.

**Vorgehen:** `prompts/booking-text-review.md` bearbeiten. Die Datei wird bei
jeder Prüfung neu gelesen, ein Neustart ist nicht nötig.

**Hinweise:**

- Platzhalter: `{{date}}`, `{{startTime}}`, `{{endTime}}`, `{{duration}}`,
  `{{ticket}}`, `{{bookingText}}`, `{{bookingTextInternal}}`. Unbekannte
  Platzhalter werden entfernt.
- Die Antwort ist per Structured Outputs auf `{ "optimizedText": "…" }`
  festgelegt; das Template muss kein JSON-Format beschreiben.

## Prüfung ohne Oberfläche starten

**Problem:** Die Prüfung soll per API-Anfrage laufen, z. B. für Tests oder
andere Systeme.

**Vorgehen:**

```bash
curl -k -X POST https://datamints-coworker.ddev.site:3000/api/timesheet-entries/<entryId>/review
```

**Hinweise:**

- Antwort `200` mit `{ "entry": … }`; der Text steht in `bookingTextReviewed`
  und ist schon gespeichert. Jeder Aufruf überschreibt ihn.
- `404` bei unbekanntem Eintrag, `502` bei Fehlern (Konfiguration, API,
  Ablehnung); Details im Log des Dev-Servers.
- Die Route hat keine Authentifizierung: Jeder Aufruf kostet Geld, daher nur
  lokal betreiben.
- Serverseitig lässt sich `reviewBookingText(entryId)` aus
  `src/lib/booking-text-review.ts` direkt aufrufen.
