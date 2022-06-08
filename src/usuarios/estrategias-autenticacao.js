const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const BearerStrategy = require("passport-http-bearer").Strategy;
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const blacklist = require("../../redis/manipula-blacklist");

const Usuario = require("./usuarios-modelo");
const { InvalidArgumentError } = require("../erros");

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "senha",
      session: false,
    },
    async (email, senha, done) => {
      try {
        const usuario = await Usuario.buscaPorEmail(email);
        verificaUsuario(usuario);
        await verificaSenha(senha, usuario.senhaHash);

        done(null, usuario);
      } catch (erro) {
        done(erro);
      }
    }
  )
);

passport.use(
  new BearerStrategy(async (token, done) => {
    try {
      await verificaTokenBlacklist(token);
      const payload = jwt.verify(token, process.env.CHAVE_JWT);
      const usuario = await Usuario.buscaPorId(payload.id);
      done(null, usuario, { token: token });
    } catch (error) {
      done(error);
    }
  })
);

function verificaUsuario(usuario) {
  if (!usuario) {
    throw new InvalidArgumentError("Não existe um usuário com esse email");
  }
}

async function verificaSenha(senha, senhaHash) {
  const senhaValida = await bcrypt.compare(senha, senhaHash);
  if (!senhaValida) {
    throw new InvalidArgumentError("email ou senha inválidos");
  }
}

async function verificaTokenBlacklist(token) {
  const tokenNaBlacklist = await blacklist.contemToken(token);
  if (tokenNaBlacklist) {
    throw new jwt.JsonWebTokenError("Token inválido por logout");
  }
}
