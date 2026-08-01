const Admin = require('../models/Admin')
const bcrypt = require('bcryptjs')

/**
 * Safely and idempotently ensures an admin account exists in MongoDB Atlas.
 * - Does NOT delete, reset, or modify existing database data.
 * - Does NOT alter student users, courses, skills, videos, or question banks.
 * - Creates an admin ONLY if no admin currently exists in the database.
 * - Never prints passwords or credentials in logs.
 */
async function ensureAdminExists() {
  const seedEmail = process.env.SEED_ADMIN_EMAIL
  const seedPassword = process.env.SEED_ADMIN_PASSWORD

  const hasEmail = Boolean(seedEmail)
  const hasPass = Boolean(seedPassword)

  console.log(`[Admin Auto-Init] ENV Check -> SEED_ADMIN_EMAIL: ${hasEmail ? 'YES' : 'NO'}, SEED_ADMIN_PASSWORD: ${hasPass ? 'YES' : 'NO'}`)

  if (!hasEmail || !hasPass) {
    const msg = 'SEED_ADMIN_EMAIL or SEED_ADMIN_PASSWORD environment variable is missing.'
    console.log(`[Admin Auto-Init] ${msg}`)
    return { success: false, action: 'missing_env_vars', message: msg, hasEmail, hasPass }
  }

  const targetEmail = seedEmail.toLowerCase().trim()

  try {
    const count = await Admin.countDocuments()
    console.log(`[Admin Auto-Init] Current Admin collection count: ${count}`)

    const adminExists = await Admin.findOne({ email: targetEmail })
    if (adminExists) {
      console.log(`[Admin Auto-Init] Safe check: Admin account for (${targetEmail}) already exists in database.`)
      return { success: true, action: 'already_exists', count, email: targetEmail }
    }

    if (seedPassword.length < 6) {
      const msg = 'SEED_ADMIN_PASSWORD must be at least 6 characters long.'
      console.error(`[Admin Auto-Init] ${msg}`)
      return { success: false, action: 'invalid_password_length', message: msg }
    }

    console.log(`[Admin Auto-Init] Creating initial superadmin account for: ${targetEmail} ...`)
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(seedPassword, salt)

    const newAdmin = new Admin({
      name: 'SkillExchange Admin',
      email: targetEmail,
      password: hashedPassword,
      role: 'superadmin'
    })

    await newAdmin.save()
    console.log(`[Admin Auto-Init] ✅ Successfully created superadmin account: ${targetEmail}`)
    return { success: true, action: 'created', email: targetEmail }
  } catch (err) {
    console.error('[Admin Auto-Init] ❌ Admin creation failed:', err.stack || err.message || err)
    return { success: false, action: 'error', error: err.message || String(err) }
  }
}

module.exports = ensureAdminExists
