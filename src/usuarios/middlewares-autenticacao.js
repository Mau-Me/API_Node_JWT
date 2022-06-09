const passport = require("passport");
const Usuario = require("./usuarios-modelo");
const { InvalidArgumentError } = require("../erros");
const allowlistRefreshToken = require("../../redis/allowlist-refresh-token");

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
      const id = await verificaRefreshToken(refreshToken);
      await invalidaRefreshToken(refreshToken);
      req.user = await Usuario.buscaPorId(id);
      return next();
    } catch (erro) {
      if (erro.name === "InvalidArgumentError") {
        return res.status(401).json({ erro: erro.message });
      }
      return res.status(500).json({ erro: erro.message });
    }
  },
};

async function verificaRefreshToken(refreshToken) {
  if (!refreshToken) {
    throw new InvalidArgumentError("Refresh não enviado!");
  }
  const id = await allowlistRefreshToken.buscaValor(refreshToken);

  if (!id) {
    throw new InvalidArgumentError("Refresh token inválido");
  }
  return id;
}

async function invalidaRefreshToken(refreshToken) {
  await allowlistRefreshToken.deleta(refreshToken);
}
