# Schoolgle HTML Template Pack

This folder contains the visual-first Schoolgle business template pack.

## Templates

- `letterhead.html`
- `proposal.html`
- `invoice.html`
- `meeting-notes.html`
- `email-signature.html`

## Shared Assets

- `assets/schoolgle-logo-horizontal.png`
- `assets/schoolgle-logo-horizontal-dark.png`
- `assets/schoolgle-logo-mark.png`
- `styles/schoolgle-docs.css`

Keep template assets inside `assets/` so the pack can be moved or uploaded without
breaking document logos. For production email signatures, host the same horizontal
logo on `schoolgle.co.uk` and point Gmail at the HTTPS version. Use the dark
horizontal variant only on dark website or slide backgrounds; email signatures
should use the standard horizontal logo.

## Recommendation

Use these HTML templates as the production source for generated Schoolgle documents.
Render to PDF for polished outputs, and only create Google Docs copies when a human needs
to edit wording manually.

## Contact Defaults

- Default sender: David Summerscales
- Default email: `david@schoolgle.co.uk`
- Default role: CEO & Founder
- Phone is intentionally omitted from the default email signature. Add
  `{{business_phone_optional}}` only when there is a dedicated business number,
  landline diversion, or eSIM number ready to publish.
- Alias signatures included: `finance@schoolgle.co.uk`, `admin@schoolgle.co.uk`,
  and `support@schoolgle.co.uk`.
- Gmail copied signatures use `Arial, Helvetica, sans-serif` because email clients
  do not reliably preserve product/UI fonts such as Inter.

## Preview / Export

From this folder, run:

```powershell
.\render-previews.ps1
```

The script renders PNG previews and PDF exports into `previews/` using Chrome or Edge.
