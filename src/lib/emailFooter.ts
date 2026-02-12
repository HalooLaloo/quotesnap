/** Generate unsubscribe footer HTML for emails */
export function emailUnsubscribeFooter(userId: string, appUrl: string): string {
  const unsubscribeUrl = `${appUrl}/unsubscribe?uid=${userId}`
  return `<p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
    <a href="${unsubscribeUrl}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a> from email notifications
  </p>`
}
