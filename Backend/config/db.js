// PostgreSQL connection bypassed in favor of MongoDB
module.exports = {}

module.exports.connectDB = async () => {
  // Bypassed: PostgreSQL database is not utilized
  console.log('[DB] PostgreSQL bypassed. Running purely on MongoDB Mongoose client.')
  return false
}
