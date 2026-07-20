const jwt = require('jsonwebtoken')

exports.adminProtect = (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) {
    return res.status(401).json({ message: 'Admin access denied: no token' })
  }

  try {
    // Uses ADMIN_JWT_SECRET — student tokens (signed with JWT_SECRET) will fail here
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET)
    if (!decoded.isAdmin) {
      return res.status(403).json({ message: 'Forbidden: not an admin token' })
    }
    req.admin = { id: decoded.id, email: decoded.email, name: decoded.name }
    next()
  } catch (err) {
    return res.status(401).json({ message: 'Admin token invalid or expired' })
  }
}
