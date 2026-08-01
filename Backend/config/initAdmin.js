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
  try {
    const seedEmail = process.env.SEED_ADMIN_EMAIL
    const seedPassword = process.env.SEED_ADMIN_PASSWORD

    // 1. Check if any admin already exists in the 'admins' collection
    const existingCount = await Admin.countDocuments()
    if (existingCount > 0) {
      console.log(`[Admin Auto-Init] Safe check: ${existingCount} admin(s) already exist in database. Skipping initialization.`)
      return
    }

    // 2. If no admin exists, verify environment variables
    if (!seedEmail || !seedPassword) {
      console.log('[Admin Auto-Init] Note: No admin account found in database. Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in environment variables to auto-create initial admin.')
      return
    }

    const targetEmail = seedEmail.toLowerCase().trim()
    if (seedPassword.length < 6) {
      console.error('[Admin Auto-Init] Error: SEED_ADMIN_PASSWORD must be at least 6 characters long.')
      return
    }

    // 3. Double-check by email
    const adminExists = await Admin.findOne({ email: targetEmail })
    if (adminExists) {
      console.log(`[Admin Auto-Init] Safe check: Admin user (${targetEmail}) already exists.`)
      return
    }

    // 4. Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(seedPassword, salt)

    const newAdmin = new Admin({
      name: 'SkillExchange Admin',
      email: targetEmail,
      password: hashedPassword,
      role: 'superadmin'
    })

    await newAdmin.save()
    console.log(`[Admin Auto-Init] Successfully created initial superadmin account: ${targetEmail}`)
  } catch (err) {
    console.error('[Admin Auto-Init] Error during admin initialization:', err.message || err)
  }
}

module.exports = ensureAdminExists
