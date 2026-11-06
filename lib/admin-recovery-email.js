export async function sendAdminRecoveryCodes(email, codes) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.ADMIN_SECURITY_EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error('Administrator recovery delivery is not configured');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to: [email],
      subject: 'Your AliverBiopharm administrator recovery codes',
      text: [
        'A new set of administrator device recovery codes was requested for your account.',
        '',
        'Each code can be used once to approve one new administrator device.',
        'Codes expire after 365 days and are invalidated when your account password changes.',
        'Store these codes in a secure password manager. Do not forward or share this email.',
        '',
        ...codes.map((code, index) => `${index + 1}. ${code}`),
        '',
        'If you did not request these codes, contact the platform security administrator immediately.'
      ].join('\\n')
    })
  });

  if (!response.ok) {
    throw new Error('Unable to deliver administrator recovery credentials');
  }
}
