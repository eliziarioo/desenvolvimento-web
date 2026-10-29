// Requisito 1 – arquivo script.js externo, linkado no index.html

const formulario = document.getElementById("formulario");
const divSucesso = document.getElementById("sucesso");
const botaoVoltar = document.getElementById("voltar");

formulario.addEventListener("submit", validarFormulario);
botaoVoltar.addEventListener("click", fecharSucesso);

// Requisito 3 – validação das entradas do usuário com JavaScript
function validarFormulario(evento) {
  // Evita o envio padrão (recarregar a página)
  evento.preventDefault();

  let valido = true;
  const campoNome = document.getElementById("nome");
  const campoEmail = document.getElementById("email");
  const campoCpf = document.getElementById("cpf");
  const erroNome = document.getElementById("erro-nome");
  const erroEmail = document.getElementById("erro-email");
  const erroCpf = document.getElementById("erro-cpf");
  const nome = campoNome.value.trim();
  const email = campoEmail.value.trim();
  const cpf = campoCpf.value.trim();

  // Limpa mensagens e bordas vermelhas anteriores
  erroNome.textContent = "";
  erroEmail.textContent = "";
  erroCpf.textContent = "";
  campoNome.classList.remove("input-erro");
  campoEmail.classList.remove("input-erro");
  campoCpf.classList.remove("input-erro");

  // Requisito 3 – validação do nome
  if (nome === "") {
    erroNome.textContent = "O nome é obrigatório.";
    campoNome.classList.add("input-erro");
    valido = false;
  } else if (nome.length < 3) {
    erroNome.textContent = "O nome deve ter pelo menos 3 letras.";
    campoNome.classList.add("input-erro");
    valido = false;
  }

  // Requisito 3 – validação do e-mail
  const posicaoArroba = email.indexOf("@");
  if (email === "") {
    erroEmail.textContent = "O e-mail é obrigatório.";
    campoEmail.classList.add("input-erro");
    valido = false;
  } else if (
    posicaoArroba < 1 ||
    email.indexOf(".", posicaoArroba) === -1 ||
    email.endsWith(".") ||
    email.includes(" ")
  ) {
    erroEmail.textContent = "E-mail inválido. Exemplo: nome@email.com";
    campoEmail.classList.add("input-erro");
    valido = false;
  }

  // Requisito 3 – validação do CPF
  const cpfNumeros = cpf.replaceAll(".", "").replaceAll("-", "");
  if (cpf === "") {
    erroCpf.textContent = "O CPF é obrigatório.";
    campoCpf.classList.add("input-erro");
    valido = false;
  } else if (cpfNumeros.length !== 11 || !somenteNumeros(cpfNumeros)) {
    erroCpf.textContent = "O CPF deve ter 11 números.";
    campoCpf.classList.add("input-erro");
    valido = false;
  }

  // Requisito 3 – mensagem de sucesso na div sobreposta ao formulário
  if (valido) {
    document.getElementById("nome-sucesso").textContent = nome;
    divSucesso.classList.add("ativo");
  }
}

// Requisito 3 – verifica se o texto tem apenas números (usado na validação do CPF)
function somenteNumeros(texto) {
  const digitos = "0123456789";
  for (let i = 0; i < texto.length; i++) {
    if (!digitos.includes(texto.charAt(i))) {
      return false;
    }
  }
  return true;
}

// Requisito 3 – fecha a div de sucesso e limpa o formulário
function fecharSucesso() {
  divSucesso.classList.remove("ativo");
  formulario.reset();
}
