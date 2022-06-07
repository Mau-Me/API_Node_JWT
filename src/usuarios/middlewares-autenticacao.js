const passport = require("passport");

module.exports = {
  local: (req, res, next) => {
    passport.authenticate(
      "local",
      { session: false },
      (error, usuario, infoAdicionais) => {
        if (error && error.name === "InvalidArgumentError") {
          return res.status(401).json({ erro: error.message });
        }

        if (error) {
          return res.status(500).json({ erro: error.message });
        }

        if (!usuario) {
          return res.status(401).end();
        }

        req.user = usuario;
        return next();
      }
    )(req, res, next);
  },
  bearer: (req, res, next) => {
    passport.authenticate(
      "bearer",
      { session: false },
      (error, usuario, infoAdicionais) => {
        if (error && error.name === "JsonWebTokenError") {
          return res.status(401).json({ erro: error.message });
        }
        if (error) {
          return res.status(500).json({ erro: error.message });
        }
        if (!usuario) {
          return res.status(401).end();
        }

        req.user = usuario;
        return next();
      }
    )(req, res, next);
  },
};
