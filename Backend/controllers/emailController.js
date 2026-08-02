const nodemailer = require('nodemailer')
const EmailLog = require('../models/EmailLog')

// Create transporter (use Gmail SMTP on port 465 with SSL/TLS)
const createTransporter = () => {
  const user = (process.env.EMAIL_USER || '').trim()
  const pass = (process.env.EMAIL_PASS || '').trim().replace(/\s+/g, '')

  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user,
      pass
    },
    tls: {
      rejectUnauthorized: false
    }
  })
}

// Mask email for secure logging (e.g. s***n@example.com)
function maskEmail(email) {
  if (!email || typeof email !== 'string' || !email.includes('@')) return '***'
  const [local, domain] = email.split('@')
  if (local.length <= 2) return `${local[0]}***@${domain}`
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

// Send email and log it
const sendEmail = async ({ to, toName, subject, html }) => {
  const emailUser = (process.env.EMAIL_USER || '').trim()
  const emailPass = (process.env.EMAIL_PASS || '').trim()

  const maskedRecipient = maskEmail(to)
  console.log(`[Email Attempt] Teacher Name: ${toName || 'Student'}, Recipient Email: ${maskedRecipient}`)

  if (!emailUser || !emailPass) {
    const errorMsg = 'EMAIL_USER or EMAIL_PASS environment variable is missing.'
    console.warn(`[Email Result] ❌ Skipped for teacher: ${toName || 'Student'} (${maskedRecipient}): ${errorMsg}`)
    await EmailLog.create({ toEmail: to, toName, subject, body: html, status: 'skipped', error: errorMsg }).catch(() => {})
    return { success: false, message: errorMsg }
  }

  try {
    const transporter = createTransporter()
    
    // Verify SMTP connection before sending
    await transporter.verify()
    console.log('[Email] Transporter SMTP connection verified successfully!')

    const info = await transporter.sendMail({
      from: `"SkillExchange" <${emailUser}>`,
      to,
      subject,
      html
    })

    console.log(`[Email Result] ✅ Success for teacher: ${toName || 'Student'} (${maskedRecipient}) | MessageId: ${info.messageId}`)
    await EmailLog.create({ toEmail: to, toName, subject, body: html, status: 'sent', error: '' }).catch(() => {})
    return { success: true, messageId: info.messageId }
  } catch (err) {
    const errorMsg = err.message || String(err)
    console.error(`[Email Result] ❌ Failed for teacher: ${toName || 'Student'} (${maskedRecipient}): ${errorMsg}`)
    await EmailLog.create({ toEmail: to, toName, subject, body: html, status: 'failed', error: errorMsg }).catch(() => {})
    return { success: false, message: errorMsg }
  }
}

// Send learning request email to student with secure action buttons
const sendSessionRequestEmail = async ({ toEmail, toName, fromName, courseName, rawToken, baseUrl }) => {
  const serverBaseUrl = (baseUrl || process.env.SERVER_URL || process.env.BACKEND_URL || process.env.CLIENT_URL || 'http://localhost:5005').replace(/\/+$/, '')
  const approveUrl = `${serverBaseUrl}/api/requests/email-action?token=${rawToken}&action=approve`
  const rejectUrl = `${serverBaseUrl}/api/requests/email-action?token=${rawToken}&action=reject`

  const subject = 'SkillExchange Teaching Request'
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background:#0b0d1a;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#ffffff">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d1a;min-height:100vh">
      <tr><td align="center" style="padding:40px 20px">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111322;border:1px solid rgba(99,102,241,0.2);border-radius:24px;overflow:hidden;max-width:600px;width:100%">
          <!-- Header -->
          <tr><td style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:36px;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px">SkillExchange</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600">Teaching Request Notification</p>
          </td></tr>
          <!-- Body -->
          <tr><td style="padding:40px">
            <p style="color:#e2e8f0;font-size:16px;line-height:1.6;margin:0 0 16px">
              Hi <strong style="color:#60a5fa">${toName || 'Student'}</strong>,
            </p>
            <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 24px">
              <strong style="color:#60a5fa">${fromName || 'A student'}</strong> has requested your help to learn <strong style="color:#a855f7">${courseName}</strong>.
            </p>
            <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 28px">
              Please choose one option:
            </p>
            <!-- Action Buttons -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 32px">
              <tr>
                <td align="center" style="padding:8px">
                  <a href="${approveUrl}" style="display:inline-block;min-width:140px;background:linear-gradient(135deg,#10b981,#059669);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:800;font-size:16px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(16,185,129,0.35);text-align:center">OK</a>
                </td>
                <td align="center" style="padding:8px">
                  <a href="${rejectUrl}" style="display:inline-block;min-width:140px;background:linear-gradient(135deg,#f43f5e,#e11d48);color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:12px;font-weight:800;font-size:16px;letter-spacing:0.5px;box-shadow:0 4px 14px rgba(244,63,94,0.35);text-align:center">CANCEL</a>
                </td>
              </tr>
            </table>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:20px;margin-bottom:24px">
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px">
                <strong style="color:#10b981">OK</strong> means you accept the request.
              </p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 8px">
                <strong style="color:#f43f5e">CANCEL</strong> means you reject the request.
              </p>
              <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0">
                If you do not choose either option, the request will remain <strong>Pending</strong>.
              </p>
            </div>
          </td></tr>
          <!-- Footer -->
          <tr><td style="padding:24px;border-top:1px solid rgba(255,255,255,0.05);text-align:center">
            <p style="color:#64748b;font-size:12px;margin:0">© 2026 SkillExchange Platform. All rights reserved.</p>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`
  return sendEmail({ to: toEmail, toName, subject, html })
}

// Send session accepted email
const sendSessionAcceptedEmail = async ({ toEmail, toName, acceptorName, courseName }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const subject = 'Learning Session Accepted! – SkillSwap'
  const html = `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',sans-serif">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f172a;min-height:100vh">
      <tr><td align="center" style="padding:40px 20px">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#1e293b;border:1px solid #334155;border-radius:16px;overflow:hidden;max-width:600px">
          <tr><td style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:32px;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:28px;font-weight:700">✅ Session Accepted!</h1>
          </td></tr>
          <tr><td style="padding:40px">
            <p style="color:#94a3b8;font-size:15px;line-height:1.6">Hello <strong style="color:#e2e8f0">${toName}</strong>,</p>
            <p style="color:#94a3b8;font-size:15px;line-height:1.6">
              Great news! <strong style="color:#e2e8f0">${acceptorName}</strong> has <strong style="color:#22c55e">accepted</strong> your learning session request for <strong style="color:#6366f1">${courseName}</strong>.
            </p>
            <p style="color:#94a3b8;font-size:14px">You can now connect and schedule your session through SkillSwap.</p>
          </td></tr>
          <tr><td style="padding:16px 40px 32px;text-align:center">
            <a href="${clientUrl}/notifications" style="display:inline-block;background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-weight:600">View on SkillSwap →</a>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
  </html>`
  return sendEmail({ to: toEmail, toName, subject, html })
}

module.exports = { sendEmail, sendSessionRequestEmail, sendSessionAcceptedEmail }
