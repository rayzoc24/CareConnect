function requireRole(role) {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user || user.role !== role) {
      res.status(403).json({ error: "Unauthorized." });
      return;
    }
    next();
  };
}

module.exports = {
  requireRole
};
