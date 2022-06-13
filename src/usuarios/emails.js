const nodemailer = require("nodemailer");

const configuracaoEmailProducao = {
  host: process.env.EMAIL_HOST,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  secure: true,
};
const configuracaoEmailTeste = (contaTeste) => ({
  host: "smtp.ethereal.email",
  auth: contaTeste,
});

class Email {
  async enviaEmail() {
    const configuracaoEmail = await criaConfiguracaoEmail();
    const transportador = nodemailer.createTransport(configuracaoEmail);

    const info = await transportador.sendMail(this);

    if (process.env.NODE_ENV !== "production") {
      console.log("URL: " + nodemailer.getTestMessageUrl(info));
    }
  }
}

class EmailVerificacao extends Email {
  constructor(email, linkVerificacao) {
    super();

    this.from = "'Blog do Código' <noreply@blogdocodigo.com.br>";
    this.to = email;
    this.subject = "Verificação de e-mail";
    this.text = `Olá! Verifique seu e-mail: ${linkVerificacao}`;
    this.html = `<h1>Olá!</h1> Verifique seu e-mail: <a href=${linkVerificacao}>${linkVerificacao}</a>`;
  }
}

async function criaConfiguracaoEmail() {
  if (process.env.NODE_ENV === "production") {
    return configuracaoEmailProducao;
  } else {
    const contaEmailTeste = await nodemailer.createTestAccount();
    return configuracaoEmailTeste(contaEmailTeste);
  }
}

module.exports = { EmailVerificacao };
