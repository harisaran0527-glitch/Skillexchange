const jwt = require('jsonwebtoken')

exports.protect = async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (!token) return res.status(401).json({ message: 'Not authorized, token missing' })

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = { id: decoded.id }
    next()
  } catch (err) {
    console.error(err)
    return res.status(401).json({ message: 'Not authorized, token invalid' })
  }
}

exports.optionalProtect = async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = { id: decoded.id }
    } catch (err) {
      // Ignore token verification errors for optional auth
    }
  }
  next()
}
