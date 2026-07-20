// Small helpers for validating input

exports.isValidEmail = (email) => {
  if (!email) return false
  return /^\S+@\S+\.\S+$/.test(email)
}

exports.isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0
