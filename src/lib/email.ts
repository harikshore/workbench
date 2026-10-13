import { Resend } from "resend";

let resendClient: Resend | null = null;

function getResend() {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) + " · " + date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }) + " (UTC)";
}

function buildOTPHtml(email: string, otp: string): string {
  const now = formatDate(new Date());

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your Workbench sign-in code</title>
<!--[if mso]><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml><![endif]-->
<style>
  @media (max-width:620px){
    .px{padding-left:24px !important;padding-right:24px !important}
    .code{font-size:40px !important;letter-spacing:8px !important}
    .h1{font-size:28px !important;line-height:34px !important}
  }
  @media (prefers-color-scheme:dark){
    .bg{background:#1a1918 !important}
    .card{background:#232120 !important;border-color:#4a4644 !important}
    .ink{color:#efedec !important}
    .muted{color:#b4afad !important}
    .rule{border-color:#4a4644 !important}
    .codebox{background:#1a1918 !important;border-color:#efedec !important}
    .accent{color:#ff6a4d !important}
  }
</style>
</head>
<body class="bg" style="margin:0;padding:0;background:#f3f2f2;-webkit-text-size-adjust:100%;">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f3f2f2;">Your Workbench sign-in code is ${otp}. It expires in 10 minutes.&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;&#8199;&#847;</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="bg" style="background:#f3f2f2;">
<tr><td align="center" style="padding:40px 12px;">

  <!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600"><tr><td><![endif]-->
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" class="card" style="max-width:600px;width:100%;background:#fbfbfb;border:2px solid #201e1d;">

    <!-- Brand bar -->
    <tr><td class="px rule" style="padding:20px 40px;border-bottom:2px solid #201e1d;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="14" valign="middle" style="width:14px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="14"><tr><td width="14" height="14" bgcolor="#ec3013" style="width:14px;height:14px;background:#ec3013;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td></tr></table></td>
        <td class="ink" valign="middle" style="padding-left:10px;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:18px;font-weight:800;line-height:18px;mso-line-height-rule:exactly;color:#201e1d;">Workbench</td>
      </tr></table>
    </td></tr>

    <!-- Heading -->
    <tr><td class="px" style="padding:40px 40px 0;font-family:Archivo,Helvetica,Arial,sans-serif;">
      <p class="accent" style="margin:0 0 16px;font-size:12px;line-height:16px;mso-line-height-rule:exactly;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#c4260c;">Sign-in code</p>
      <h1 class="h1 ink" style="margin:0;font-size:34px;line-height:40px;mso-line-height-rule:exactly;font-weight:800;color:#201e1d;">Here&rsquo;s your code.</h1>
      <p class="muted" style="margin:12px 0 0;font-size:16px;line-height:24px;mso-line-height-rule:exactly;color:#5b5755;">Enter it on the Workbench sign-in screen to continue. New here? Your account is created as soon as you verify.</p>
    </td></tr>

    <!-- Code -->
    <tr><td class="px" style="padding:32px 40px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr><td class="codebox" style="padding:24px;border:2px solid #201e1d;background:#f3f2f2;">
          <p class="muted" style="margin:0 0 8px;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:12px;line-height:16px;mso-line-height-rule:exactly;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#5b5755;">6-digit code</p>
          <p class="code ink" style="margin:0;font-family:'Courier New',Courier,monospace;font-size:48px;line-height:56px;mso-line-height-rule:exactly;font-weight:700;letter-spacing:12px;color:#201e1d;">${otp}</p>
        </td></tr>
        <tr><td style="padding-top:12px;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;mso-line-height-rule:exactly;">
          <span class="accent" style="color:#c4260c;font-weight:700;">Expires in 10 minutes.</span>
          <span class="muted" style="color:#5b5755;"> Single use &mdash; requesting a new code cancels this one.</span>
        </td></tr>
      </table>
    </td></tr>

    <!-- Request details -->
    <tr><td class="px" style="padding:40px 40px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:Archivo,Helvetica,Arial,sans-serif;font-size:14px;line-height:20px;mso-line-height-rule:exactly;">
        <tr><td colspan="2" class="ink rule" style="padding-bottom:8px;border-bottom:2px solid #201e1d;font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#201e1d;">Request details</td></tr>
        <tr>
          <td class="muted rule" width="120" style="width:120px;padding:10px 0;border-bottom:1px solid #d6d3d2;color:#5b5755;">Email</td>
          <td class="ink rule" style="padding:10px 0;border-bottom:1px solid #d6d3d2;color:#201e1d;word-break:break-all;">${email}</td>
        </tr>
        <tr>
          <td class="muted" style="padding:10px 0;color:#5b5755;">Requested</td>
          <td class="ink" style="padding:10px 0;color:#201e1d;">${now}</td>
        </tr>
      </table>
    </td></tr>

    <!-- Security note -->
    <tr><td class="px" style="padding:32px 40px 40px;font-family:Archivo,Helvetica,Arial,sans-serif;">
      <p class="ink" style="margin:0;font-size:14px;line-height:22px;mso-line-height-rule:exactly;color:#201e1d;"><strong>Didn&rsquo;t request this?</strong> You can ignore this email &mdash; nobody can sign in without the code. Workbench will never ask you to share it.</p>
    </td></tr>

    <!-- Footer -->
    <tr><td class="px rule" style="padding:20px 40px;border-top:2px solid #201e1d;font-family:Archivo,Helvetica,Arial,sans-serif;font-size:12px;line-height:18px;mso-line-height-rule:exactly;">
      <p class="muted" style="margin:0;color:#5b5755;">You&rsquo;re receiving this because a sign-in was requested for this address. This is a transactional message and can&rsquo;t be unsubscribed from.</p>
      <p class="muted" style="margin:8px 0 0;color:#5b5755;">&copy; 2026 Workbench</p>
    </td></tr>

  </table>
  <!--[if mso]></td></tr></table><![endif]-->

</td></tr>
</table>
</body>
</html>`;
}

export async function sendOTPEmail(email: string, otp: string) {
  await getResend().emails.send({
    from: process.env.EMAIL_FROM!,
    to: email,
    subject: `Your Workbench sign-in code: ${otp}`,
    html: buildOTPHtml(email, otp),
  });
}
