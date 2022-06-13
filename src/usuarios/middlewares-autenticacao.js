const passport = require("passport");
const Usuario = require("./usuarios-modelo");
const tokens = require("./tokens");

module.exports = {
  local(req, res, next) {
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
  bearer(req, res, next) {
    passport.authenticate(
      "bearer",
      { session: false },
      (error, usuario, infoAdicionais) => {
        if (error && error.name === "JsonWebTokenError") {
          return res.status(401).json({ erro: error.message });
        }
        if (error && error.name === "TokenExpiredError") {
          return res
            .status(401)
            .json({ erro: error.message, expiradoEm: error.expiredAt });
        }
        if (error) {
          return res.status(500).json({ erro: error.message });
        }
        if (!usuario) {
          return res.status(401).end();
        }

        req.token = infoAdicionais.token;
        req.user = usuario;
        return next();
      }
    )(req, res, next);
  },
  async refresh(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const id = await tokens.refresh.verifica(refreshToken);
      await tokens.refresh.invalida(refreshToken);
      req.user = await Usuario.buscaPorId(id);
      return next();
    } catch (erro) {
      if (erro.name === "InvalidArgumentError") {
        return res.status(401).json({ erro: erro.message });
      }
      return res.status(500).json({ erro: erro.message });
    }
  },
  async verificacaoEmail(req, res, next) {
    try {
      const { token } = req.params;
      const id = await tokens.verificacaoEmail.verifica(token);
      const usuario = await Usuario.buscaPorId(id);

      req.user = usuario;
      next();
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        return res.status(401).json({ erro: error.message });
      }
      if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ erro: error.message, expiradoEm: error.expiredAt });
      }
      return res.status(500).json({ erro: error.message });
    }
  },
};
