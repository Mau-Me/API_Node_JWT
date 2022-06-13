const moment = require("moment");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const allowlistRefreshToken = require("../../redis/allowlist-refresh-token");
const blocklistAccessToken = require("../../redis/blocklist-access-token");
const { InvalidArgumentError } = require("../erros");

module.exports = {
  access: {
    nome: "Access Token",
    lista: blocklistAccessToken,
    expiracao: [15, "m"],
    cria(id) {
      return criaTokenJWT(id, this.expiracao);
    },
    verifica(token) {
      return verificaTokenJWT(token, this.nome, this.lista);
    },
    invalida(token) {
      return invalidaTokenJWT(token, this.lista);
    },
  },
  refresh: {
    nome: "Refresh Token",
    lista: allowlistRefreshToken,
    expiracao: [5, "d"],
    async cria(id) {
      return await criaTokenOpaco(id, this.expiracao, this.lista);
    },
    verifica(token) {
      return verificaTokenOpaco(token, this.nome, this.lista);
    },
    invalida(token) {
      return invalidaTokenOpaco(token, this.lista);
    },
  },
  verificacaoEmail: {
    nome: "Token de Verificação de E-mail",
    expiracao: [1, "h"],
    cria(id) {
      return criaTokenJWT(id, this.expiracao);
    },
    verifica(token) {
      return verificaTokenJWT(token, this.nome);
    },
  },
};

function criaTokenJWT(id, [tempoQuantidade, tempoUnidade]) {
  const payload = { id };

  const token = jwt.sign(payload, process.env.CHAVE_JWT, {
    expiresIn: tempoQuantidade + tempoUnidade,
  });
  return token;
}

async function verificaTokenJWT(token, nome, blocklist) {
  await verificaTokenBlacklist(token, nome, blocklist);
  const { id } = jwt.verify(token, process.env.CHAVE_JWT);
  return id;
}

function invalidaTokenJWT(token, blocklist) {
  return blocklist.adiciona(token);
}

async function criaTokenOpaco(id, [tempoQuantidade, tempoUnidade], allowlist) {
  const tokenOpaco = crypto.randomBytes(24).toString("hex");
  const dataExpiracao = moment().add(tempoQuantidade, tempoUnidade).unix();
  await allowlist.adiciona(tokenOpaco, id, dataExpiracao);
  return tokenOpaco;
}

async function verificaTokenOpaco(token, nome, allowlist) {
  verificaTokenEnviado(token, nome);
  const id = await allowlist.buscaValor(token);

  verificaTokenValido(id, nome);
  return id;
}

async function invalidaTokenOpaco(token, allowlist) {
  await allowlist.deleta(token);
}

function verificaTokenValido(id, nome) {
  if (!id) {
    throw new InvalidArgumentError(`${nome} token inválido`);
  }
}

function verificaTokenEnviado(token, nome) {
  if (!token) {
    throw new InvalidArgumentError(`${nome} não enviado!`);
  }
}

async function verificaTokenBlacklist(token, nome, blocklist) {
  if (!blocklist) {
    return;
  }
  const tokenNaBlacklist = await blocklist.contemToken(token);
  if (tokenNaBlacklist) {
    throw new jwt.JsonWebTokenError(`${nome} inválido por logout`);
  }
}
