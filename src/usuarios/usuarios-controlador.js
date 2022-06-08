const Usuario = require("./usuarios-modelo");
const { InvalidArgumentError, InternalServerError } = require("../erros");
const jwt = require("jsonwebtoken");
const blacklist = require("../../redis/manipula-blacklist");

function criaTokenJWT(usuario) {
  const payload = { id: usuario.id };

  const token = jwt.sign(payload, process.env.CHAVE_JWT, { expiresIn: "15m" });
  return token;
}

module.exports = {
  adiciona: async (req, res) => {
    const { nome, email, senha } = req.body;

    try {
      const usuario = new Usuario({
        nome,
        email,
      });

      await usuario.adcionaSenha(senha);
      await usuario.adiciona();

      res.status(201).json();
    } catch (error) {
      if (error instanceof InvalidArgumentError) {
        res.status(422).json({ erro: error.message });
      } else if (error instanceof InternalServerError) {
        res.status(500).json({ erro: error.message });
      } else {
        res.status(500).json({ erro: error.message });
      }
    }
  },

  login: (req, res) => {
    const token = criaTokenJWT(req.user);
    res.set("Autorization", token);
    res.status(204).send();
  },

  logout: async (req, res) => {
    try {
      const token = req.token;
      await blacklist.adiciona(token);
      res.status(204).send();
    } catch (erro) {
      res.status(500).json({ erro: erro.message });
    }
  },

  lista: async (req, res) => {
    const usuarios = await Usuario.lista();
    res.json(usuarios);
  },

  deleta: async (req, res) => {
    const usuario = await Usuario.buscaPorId(req.params.id);
    try {
      await usuario.deleta();
      res.status(200).send();
    } catch (error) {
      res.status(500).json({ erro: error.message });
    }
  },
};
