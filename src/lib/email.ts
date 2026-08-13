import { Resend } from 'resend';

export async function sendTransactionalEmail(
  to: string, 
  subject: string, 
  html: string
): Promise<{ sent: boolean; id?: string; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('[EMAIL] RESEND_API_KEY not set — email NOT sent to', to);
    return { sent: false, error: 'RESEND_API_KEY environment variable is missing or not configured.' };
  }

  try {
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || 'AspirantX Support <onboarding@resend.dev>';
    
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (result.error) {
      console.error('[EMAIL] Resend returned error:', result.error);
      return { sent: false, error: result.error.message || 'Resend service failed to deliver email.' };
    }

    console.log(`[EMAIL] Resend transactional email dispatched successfully to: ${to} (ID: ${result.data?.id})`);
    return { sent: true, id: result.data?.id };
  } catch (err: any) {
    console.error('[EMAIL] Resend send exception:', err.message || err);
    return { sent: false, error: err.message || 'Exception occurred during email dispatch.' };
  }
}
