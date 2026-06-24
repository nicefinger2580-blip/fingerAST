const ADMIN_POINTS = 999999

function getAdminOpenids() {
  return (process.env.ADMIN_OPENIDS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

function isAdmin(openid, user) {
  if (!openid) return false
  if (user && user.isAdmin === true) return true
  return getAdminOpenids().includes(openid)
}

function displayPoints(openid, user) {
  if (isAdmin(openid, user)) return ADMIN_POINTS
  return user?.points || 0
}

module.exports = { ADMIN_POINTS, isAdmin, displayPoints }
