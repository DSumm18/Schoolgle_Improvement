# Auth Email and Resend Operational Memory

Date: 2026-06-02

## Current State

- Schoolgle has a Resend workspace/account visible as `schoolgle`.
- Resend is the preferred transactional email provider for production auth and product emails because it has a free transactional tier suitable for low-volume password resets/invites and is already referenced in the Schoolgle codebase.
- Resend currently has no verified sending domains in the account screenshot from 2026-06-02.
- Supabase Auth is currently sending password reset emails via the built-in Supabase sender, so messages appear from `Supabase Auth`.
- The Supabase Auth reset password email template has been branded with Schoolgle copy and a button while preserving `{{ .ConfirmationURL }}`.
- The password reset flow was tested end-to-end locally: `/forgot-password` sent the email, the email link opened `/reset-password`, and the password update completed successfully.

## Password Reset Flow

The intended customer-safe process is:

1. Create the user in Supabase Auth or invite/create them through the app.
2. Add the user to the correct organization membership, for example Rawdon St Peter's Live.
3. Trigger a password reset email using `/forgot-password`.
4. The user clicks the reset link and sets their own password.
5. Schoolgle staff should not know, recover, store, or share user passwords.

The route chain is:

`/login` -> `Forgotten password?` -> `/forgot-password` -> Supabase reset email -> `/auth/callback?type=recovery` -> `/reset-password`.

## Supabase Auth Configuration

Confirmed redirect URL coverage from dashboard screenshot:

- `https://schoolgle.co.uk/auth/callback`
- `http://localhost:3000/auth/callback`
- wildcard coverage for `schoolgle.co.uk`, `www.schoolgle.co.uk`, `control.schoolgle.co.uk`, Vercel preview, and local ports.

The reset email template must keep this exact link variable:

```html
href="{{ .ConfirmationURL }}"
```

Do not replace it with a hardcoded `/reset-password` URL.

## Resend SMTP Setup Still Needed

To remove `Supabase Auth` as the sender and make customer emails fully branded:

1. In Resend, add and verify `schoolgle.co.uk`.
2. Add the DNS records Resend provides, including SPF/DKIM and any required verification records.
3. Create SMTP credentials in Resend.
4. In Supabase, go to `Authentication` -> `Emails` -> `SMTP Settings`.
5. Configure sender as either:
   - `Schoolgle <admin@schoolgle.co.uk>`
   - `Schoolgle Support <support@schoolgle.co.uk>` if/when that mailbox exists.
6. Disable provider link tracking if it rewrites links, because rewritten Supabase auth links can break recovery/login flows.
7. Send a fresh reset email to confirm the sender, branding, and recovery link all work.

## Rawdon St Peter's Test Plan

For the Rawdon St Peter's Live customer setup:

- Use `admin@schoolgle.co.uk` as a controlled test account if the inbox is accessible.
- Add it to Rawdon St Peter's Live using the normal membership path.
- Trigger `/forgot-password` for `admin@schoolgle.co.uk`.
- Confirm the email arrives, opens `/reset-password`, and allows a new password to be set.
- After the test, either keep it as a support/admin account with clear access controls or remove it from the Rawdon organization.

## Security Notes

- Do not disclose or attempt to recover stored passwords from Supabase; they are not retrievable in plaintext.
- Prefer recovery links and invite links over shared temporary passwords.
- Do not store Resend API keys, SMTP passwords, Supabase service keys, or DNS secrets in project memory docs.
- If credentials are added to the app, store them only in the relevant deployment secret manager or local `.env.local`, not in git.
