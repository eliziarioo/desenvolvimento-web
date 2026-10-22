// Requisito 2: exatamente quatro frutas iniciais, incluindo um nome composto.
const frutas = ["Banana", "Maçã Verde", "Laranja", "Uva"];

const listaFrutas = document.getElementById("lista-frutas");
const botaoAdicionar = document.getElementById("botao-adicionar");
const botaoRetirar = document.getElementById("botao-retirar");

function normalizarFruta(entrada) {
  // Requisito 5: remover espaços nas extremidades.
  // Condição geral: comparar sem diferenciar maiúsculas de minúsculas.
  const texto = entrada.trim().toLowerCase();
  let textoNormalizado = "";
  let espacoPendente = false;

  // Requisitos 8 e 9: preservar nomes compostos e reduzir qualquer sequência
  // de espaços em branco a um espaço. trim() reconhece também tabs e quebras
  // de linha, sem precisar de expressões regulares (regex).
  for (const caractere of texto) {
    if (caractere.trim() === "") {
      espacoPendente = true;
    } else {
      if (espacoPendente && textoNormalizado.length > 0) {
        textoNormalizado += " ";
      }
      textoNormalizado += caractere;
      espacoPendente = false;
    }
  }

  // Requisito 10: primeira letra de cada termo maiúscula, restante minúsculo.
  return textoNormalizado
    .split(" ")
    .map((termo) => termo.charAt(0).toUpperCase() + termo.slice(1))
    .join(" ");
}

function renderizarLista() {
  listaFrutas.replaceChildren();

  // Requisitos 2 e 10: gerar os li dinamicamente e formatar sua exibição.
  for (const fruta of frutas) {
    const item = document.createElement("li");
    // textContent exibe a entrada como texto, sem interpretá-la como HTML.
    item.textContent = normalizarFruta(fruta);
    listaFrutas.appendChild(item);
  }
}

function adicionarFruta() {
  // Requisito 3: obter a fruta pelo prompt dentro da função de adicionar.
  const entrada = prompt("Qual fruta você deseja adicionar?");

  // Robustez adicional: cancelar não modifica a lista nem chama trim em null.
  if (entrada === null) return;

  // Requisitos 5, 8, 9 e 10: usar a mesma normalização nas duas operações.
  const fruta = normalizarFruta(entrada);
  if (fruta === "") {
    alert("Digite o nome de uma fruta.");
    return;
  }

  // Requisito 6: includes obrigatoriamente dentro desta função.
  if (frutas.includes(fruta)) {
    alert("Fruta já consta na lista!");
    return;
  }

  frutas.push(fruta);
  renderizarLista();
}

function retirarFruta() {
  // Requisito 4: obter a fruta pelo prompt dentro da função de retirar.
  const entrada = prompt("Qual fruta você deseja retirar?");

  if (entrada === null) return;

  // Requisitos 5, 8, 9 e 10: normalizar antes de comparar com o array.
  const fruta = normalizarFruta(entrada);
  if (fruta === "") {
    alert("Digite o nome de uma fruta.");
    return;
  }

  // Requisito 7: includes obrigatoriamente dentro desta função.
  if (!frutas.includes(fruta)) {
    alert("Essa fruta não consta na lista!");
    return;
  }

  const indice = frutas.indexOf(fruta);
  frutas.splice(indice, 1);
  renderizarLista();
}

// Requisitos 3 e 4: conectar cada botão à função correspondente.
botaoAdicionar.addEventListener("click", adicionarFruta);
botaoRetirar.addEventListener("click", retirarFruta);

// Requisito 2: mostrar o array inicial assim que o script carregar.
renderizarLista();
