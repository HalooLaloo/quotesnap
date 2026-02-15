# Supabase Email Templates

Paste each template into Supabase Dashboard > Authentication > Email Templates.

Image hosted at: `https://www.brickquote.app/brick-icon.png`

---

## 1. Confirm signup

**Subject:** `Confirm your BrickQuote account`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#ffffff">
  <div style="text-align:center;margin-bottom:32px">
    <table align="center" cellpadding="0" cellspacing="0"><tr>
      <td><img src="https://www.brickquote.app/brick-icon.png" width="40" height="40" alt="BrickQuote" style="display:block;border-radius:8px"></td>
      <td style="padding-left:10px"><span style="font-size:22px;font-weight:700;color:#0f172a">BrickQuote</span></td>
    </tr></table>
  </div>
  <div style="text-align:center">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px">Confirm your email</h1>
    <p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 32px">Thanks for signing up! Click the button below to verify your email address and get started.</p>
    <a href="{{ .SiteURL }}/auth/callback?token_hash={{ .TokenHash }}&type=signup&next=/subscribe" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Verify Email</a>
    <p style="font-size:13px;color:#94a3b8;margin:32px 0 0;line-height:1.5">If you didn't create an account, you can safely ignore this email.</p>
  </div>
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:12px;color:#94a3b8;margin:0">&copy; 2026 BrickQuote &middot; <a href="https://brickquote.app" style="color:#94a3b8">brickquote.app</a></p>
  </div>
</div>
```

---

## 2. Reset password

**Subject:** `Reset your BrickQuote password`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#ffffff">
  <div style="text-align:center;margin-bottom:32px">
    <table align="center" cellpadding="0" cellspacing="0"><tr>
      <td><img src="https://www.brickquote.app/brick-icon.png" width="40" height="40" alt="BrickQuote" style="display:block;border-radius:8px"></td>
      <td style="padding-left:10px"><span style="font-size:22px;font-weight:700;color:#0f172a">BrickQuote</span></td>
    </tr></table>
  </div>
  <div style="text-align:center">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px">Reset your password</h1>
    <p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 32px">We received a request to reset your password. Click the button below to choose a new one.</p>
    <a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=recovery" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Reset Password</a>
    <p style="font-size:13px;color:#94a3b8;margin:32px 0 0;line-height:1.5">If you didn't request a password reset, you can safely ignore this email.</p>
  </div>
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:12px;color:#94a3b8;margin:0">&copy; 2026 BrickQuote &middot; <a href="https://brickquote.app" style="color:#94a3b8">brickquote.app</a></p>
  </div>
</div>
```

---

## 3. Magic link

**Subject:** `Your BrickQuote login link`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#ffffff">
  <div style="text-align:center;margin-bottom:32px">
    <table align="center" cellpadding="0" cellspacing="0"><tr>
      <td><img src="https://www.brickquote.app/brick-icon.png" width="40" height="40" alt="BrickQuote" style="display:block;border-radius:8px"></td>
      <td style="padding-left:10px"><span style="font-size:22px;font-weight:700;color:#0f172a">BrickQuote</span></td>
    </tr></table>
  </div>
  <div style="text-align:center">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px">Your login link</h1>
    <p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 32px">Click the button below to log in to your BrickQuote account.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Log In</a>
    <p style="font-size:13px;color:#94a3b8;margin:32px 0 0;line-height:1.5">If you didn't request this link, you can safely ignore this email.</p>
  </div>
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:12px;color:#94a3b8;margin:0">&copy; 2026 BrickQuote &middot; <a href="https://brickquote.app" style="color:#94a3b8">brickquote.app</a></p>
  </div>
</div>
```

---

## 4. Change email address

**Subject:** `Confirm your new email address`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#ffffff">
  <div style="text-align:center;margin-bottom:32px">
    <table align="center" cellpadding="0" cellspacing="0"><tr>
      <td><img src="https://www.brickquote.app/brick-icon.png" width="40" height="40" alt="BrickQuote" style="display:block;border-radius:8px"></td>
      <td style="padding-left:10px"><span style="font-size:22px;font-weight:700;color:#0f172a">BrickQuote</span></td>
    </tr></table>
  </div>
  <div style="text-align:center">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px">Confirm email change</h1>
    <p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 32px">Click the button below to confirm changing your email address to this one.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Confirm Email</a>
    <p style="font-size:13px;color:#94a3b8;margin:32px 0 0;line-height:1.5">If you didn't request this change, please contact support immediately.</p>
  </div>
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:12px;color:#94a3b8;margin:0">&copy; 2026 BrickQuote &middot; <a href="https://brickquote.app" style="color:#94a3b8">brickquote.app</a></p>
  </div>
</div>
```

---

## 5. Invite user

**Subject:** `You've been invited to BrickQuote`

```html
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#ffffff">
  <div style="text-align:center;margin-bottom:32px">
    <table align="center" cellpadding="0" cellspacing="0"><tr>
      <td><img src="https://www.brickquote.app/brick-icon.png" width="40" height="40" alt="BrickQuote" style="display:block;border-radius:8px"></td>
      <td style="padding-left:10px"><span style="font-size:22px;font-weight:700;color:#0f172a">BrickQuote</span></td>
    </tr></table>
  </div>
  <div style="text-align:center">
    <h1 style="font-size:22px;font-weight:700;color:#0f172a;margin:0 0 12px">You're invited!</h1>
    <p style="font-size:15px;color:#64748b;line-height:1.6;margin:0 0 32px">You've been invited to join BrickQuote. Click the button below to accept and create your account.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px">Accept Invite</a>
    <p style="font-size:13px;color:#94a3b8;margin:32px 0 0;line-height:1.5">If you weren't expecting this invitation, you can safely ignore this email.</p>
  </div>
  <div style="margin-top:40px;padding-top:24px;border-top:1px solid #e2e8f0;text-align:center">
    <p style="font-size:12px;color:#94a3b8;margin:0">&copy; 2026 BrickQuote &middot; <a href="https://brickquote.app" style="color:#94a3b8">brickquote.app</a></p>
  </div>
</div>
```
