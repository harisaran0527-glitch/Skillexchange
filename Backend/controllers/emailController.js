const nodemailer = require('nodemailer')
const EmailLog = require('../models/EmailLog')

// Create transporter (use Gmail with App Password)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  })
}

// Send email and log it
const sendEmail = async ({ to, toName, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('[Email] EMAIL_USER or EMAIL_PASS not configured. Email not sent.')
    // Still log to DB for demo purposes
    await EmailLog.create({ toEmail: to, toName, subject, body: html, status: 'skipped' }).catch(() => {})
    return { success: false, message: 'Email not configured' }
  }

  try {
    const transporter = createTransporter()
    await transporter.sendMail({ from: `"SkillSwap" <${process.env.EMAIL_USER}>`, to, subject, html })
    await EmailLog.create({ toEmail: to, toName, subject, body: html, status: 'sent' }).catch(() => {})
    return { success: true }
  } catch (err) {
    console.error('[Email] Send failed:', err.message)
    await EmailLog.create({ toEmail: to, toName, subject, body: html, status: 'failed' }).catch(() => {})
    return { success: false, message: err.message }
  }
}

// Send learning request email to student
const sendSessionRequestEmail = async ({ toEmail, toName, courseName }) => {
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'
  const subject = `New Teaching Request: ${courseName} – SkillSwap`
  const html = `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"></head>
  <body style="margin:0;padding:0;background:#0b0d1a;font-family:'Segoe UI',sans-serif;color:#ffffff">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0b0d1a;min-height:100vh">
      <tr><td align="center" style="padding:40px 20px">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#111322;border:1px solid rgba(99,102,241,0.2);border-radius:24px;overflow:hidden;max-width:600px">
          <!-- Header -->
          <tr><td style="background:linear-gradient(135deg,#6366f1,#7c3aed);padding:36px;text-align:center">
            <h1 style="margin:0;color:#fff;font-size:26px;font-weight:800;letter-spacing:-0.5px">SkillExchange</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,0.85);font-size:14px;font-weight:600">Teaching Request Notification</p>
          </td></tr>
          <!-- Body -->
          <tr><td style="padding:40px">
            <p style="color:#e2e8f0;font-size:16px;line-height:1.6;margin:0 0 16px">
              Hi <strong style="color:#60a5fa">${toName}</strong>,
            </p>
            <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 20px">
              A student has requested your help to learn <strong style="color:#a855f7">${courseName}</strong>.
            </p>
            <p style="color:#cbd5e1;font-size:15px;line-height:1.6;margin:0 0 28px">
              Would you be willing to teach this student?
            </p>
            <p style="color:#94a3b8;font-size:14px;line-height:1.6;margin:0 0 32px">
              Please open your <strong>SkillExchange Student Portal</strong> and choose <strong>Accept</strong> or <strong>Reject</strong>.
            </p>
            <div style="text-align:center">
              <a href="${clientUrl}/notifications" style="display:inline-block;background:linear-gradient(135deg,#2563eb,#7c3aed);color:#fff;text-decoration:none;padding:14px 36px;border-radius:12px;font-weight:700;font-size:15px;box-shadow:0 4px 16px rgba(37,99,235,0.3)">Open Student Portal →</a>
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
