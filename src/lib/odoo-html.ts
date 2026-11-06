// Converts the Markdown of a requirement to the HTML Odoo's editor writes
// itself, so checklists stay checkable and the text stays editable in Odoo.
import { Marked, type Token, type Tokens } from "marked";

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Odoo's markup, taken from tickets edited in Odoo 19: a checklist is
// <ul class="o_checklist">, a checked item has "o_checked"; a nested list sits
// in the item after the item's text, which is wrapped in a <div>.
const odooMarked = new Marked({
  gfm: true,
  renderer: {
    list(token: Tokens.List): string {
      const isChecklist = token.items.some((item) => item.task);
      const tag = token.ordered && !isChecklist ? "ol" : "ul";
      const items = token.items.map((item) => this.listitem(item)).join("");

      return `<${tag}${isChecklist ? ' class="o_checklist"' : ""}>${items}</${tag}>`;
    },
    listitem(item: Tokens.ListItem): string {
      // The checkbox is its own token; the class of the <li> replaces it.
      const tokens = item.tokens.filter((token) => token.type !== "checkbox");
      const nested = tokens.filter((token): token is Tokens.List => token.type === "list");
      const text = tokens
        .filter((token) => token.type !== "list")
        .map((token: Token) =>
          // Paragraphs of loose lists would add margins inside the item.
          token.type === "paragraph" || token.type === "text"
            ? this.parser.parseInline((token as Tokens.Paragraph | Tokens.Text).tokens ?? [])
            : this.parser.parse([token]),
        )
        .join("<br>");
      const classes = [
        item.task && item.checked ? "o_checked" : "",
        item.task && item.checked && nested.length > 0 ? "o_checked_has_nested_list" : "",
      ].filter(Boolean);
      const classAttribute = classes.length > 0 ? ` class="${classes.join(" ")}"` : "";

      if (nested.length === 0) {
        return `<li${classAttribute}>${text}</li>`;
      }

      return `<li${classAttribute}><div>${text}</div>${nested.map((list) => this.list(list)).join("")}</li>`;
    },
    // HTML typed into the Markdown is shown as text, not interpreted.
    html({ text }: Tokens.HTML | Tokens.Tag): string {
      return escapeHtml(text);
    },
  },
});

export function markdownToOdooHtml(markdown: string): string {
  return odooMarked.parse(markdown.trim(), { async: false });
}

// The original text below a heading, as text and not as Markdown, since an
// email can contain "*" or "#". Lines are trimmed and runs of empty lines
// collapse into one paragraph break, so emails do not produce large gaps.
export function originalToOdooHtml(heading: string, rawText: string): string {
  const paragraphs = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .join("\n")
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`);

  return `<h2>${escapeHtml(heading)}</h2>${paragraphs.join("")}`;
}
