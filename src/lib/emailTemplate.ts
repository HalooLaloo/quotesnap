/**
 * Shared email template for all BrickQuote emails.
 * Provides consistent branding: logo header, accent color bar, professional footer.
 */

/** HTML brick logo using table cells — works in all email clients (no SVG, no images) */
export function emailLogo(): string {
  return `
    <table cellpadding="0" cellspacing="0" border="0" style="display:inline-block;vertical-align:middle;margin-right:10px;">
      <tr>
        <td style="width:14px;height:8px;background:#f97316;border-radius:1px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="width:2px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="width:14px;height:8px;background:#f97316;border-radius:1px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
      <tr><td colspan="3" style="height:2px;font-size:0;line-height:0;">&nbsp;</td></tr>
      <tr>
        <td style="width:8px;height:8px;background:#f97316;border-radius:1px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="width:2px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="width:20px;height:8px;background:#f97316;border-radius:1px;font-size:0;line-height:0;">&nbsp;</td>
      </tr>
    </table>`
}

interface EmailLayoutOptions {
  /** Accent color for the bar below header (e.g. '#3b82f6' blue, '#22c55e' green, '#f97316' orange) */
  accentColor: string
  /** Main title displayed below accent bar */
  title: string
  /** Optional subtitle (e.g. contractor name, invoice number) */
  subtitle?: string
  /** HTML content of the email body */
  content: string
  /** Optional footer text (defaults to 'Powered by BrickQuote') */
  footerText?: string
  /** Optional unsubscribe HTML from emailUnsubscribeFooter() */
  unsubscribeHtml?: string
}

/** Generate a complete email HTML document with BrickQuote branding */
export function emailLayout(options: EmailLayoutOptions): string {
  const {
    accentColor,
    title,
    subtitle,
    content,
    footerText,
    unsubscribeHtml,
  } = options

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 20px;">
  <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">

    <!-- Logo Header -->
    <div style="background: #0f172a; padding: 16px 24px;">
      <div style="font-size: 0;">
        <!--[if mso]><table cellpadding="0" cellspacing="0"><tr><td valign="middle"><![endif]-->
        ${emailLogo()}
        <!--[if mso]></td><td valign="middle"><![endif]-->
        <span style="display:inline-block;vertical-align:middle;color:white;font-size:20px;font-weight:700;letter-spacing:-0.3px;">BrickQuote</span>
        <!--[if mso]></td></tr></table><![endif]-->
      </div>
    </div>

    <!-- Accent Color Bar -->
    <div style="height: 4px; background: ${accentColor};"></div>

    <!-- Title Section -->
    <div style="padding: 28px 32px 0 32px;">
      <h1 style="color: #111827; margin: 0; font-size: 24px; font-weight: 700;">${title}</h1>
      ${subtitle ? `<p style="color: #6b7280; margin: 6px 0 0 0; font-size: 15px;">${subtitle}</p>` : ''}
    </div>

    <!-- Content -->
    <div style="padding: 24px 32px 32px 32px;">
      ${content}
    </div>

    <!-- Footer -->
    <div style="background: #0f172a; padding: 20px 24px; text-align: center;">
      <p style="color: #94a3b8; font-size: 13px; margin: 0;">
        ${footerText || 'Powered by'} <a href="https://brickquote.app" style="color: #f97316; text-decoration: none; font-weight: 600;">BrickQuote</a>
      </p>
      ${unsubscribeHtml || ''}
    </div>
  </div>
</body>
</html>`
}
