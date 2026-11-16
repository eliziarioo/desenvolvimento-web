/* =========================================================================
   js/galeria.js — lógica da página Galeria
   Depende de js/comum.js (TIPOS, criarCard, favoritos...).
   ========================================================================= */

'use strict';

const API = 'https://pokeapi.co/api/v2';
const TAMANHO_LOTE = 24; // múltiplo de 1, 2 e 4 colunas: linhas sempre completas (REQ 4.2)

const grade = document.getElementById('grade-galeria');
const statusGaleria = document.getElementById('status-galeria');
const botaoMais = document.getElementById('botao-mais');
const sentinela = document.getElementById('sentinela');
const form = document.getElementById('form-busca');
const campo = document.getElementById('campo-busca');
const botaoLimpar = document.getElementById('botao-limpar');

let listaCompleta = null;      // todos os {name, url} da API (carregado uma vez)
let listaAtual = [];           // lista da busca atual (todos, por tipo ou por nome)
let descricaoAtual = '';       // texto usado na mensagem de status
let posicao = 0;               // quantos itens da listaAtual já foram exibidos
let carregando = false;
let idBusca = 0;               // descarta respostas de buscas antigas
let sentinelaVisivel = false;
const cacheDetalhes = new Map(); // evita buscar o mesmo pokémon duas vezes

async function buscarJSON(url) {
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Erro ${resposta.status} ao acessar ${url}`);
  return resposta.json();
}

/* -------------------------------------------------------------------------
   REQ 3.3 — Listagem completa, tratando o limite de itens por página.
   A API ignora "limit=0" e devolve só 20 itens (o padrão), mas a resposta
   traz o "count" total. Usamos esse count para pedir TODOS de uma vez.
   ------------------------------------------------------------------------- */
async function carregarListaCompleta() {
  if (listaCompleta) return listaCompleta;
  const primeira = await buscarJSON(`${API}/pokemon?limit=0`);
  const total = primeira.count;
  if (primeira.results.length >= total) {
    listaCompleta = primeira.results;
  } else {
    const completa = await buscarJSON(`${API}/pokemon?limit=${total}&offset=0`);
    listaCompleta = completa.results;
  }
  return listaCompleta;
}

/** Extrai o número do pokémon da URL ".../pokemon/25/" */
function idDaUrl(url) {
  return Number(url.split('/').filter(Boolean).pop());
}

/* -------------------------------------------------------------------------
   REQ 4.1 — Dados de cada card: nome, HP, tipo, peso, altura e imagem.
   A API devolve peso em hectogramas e altura em decímetros: dividimos por 10.
   ------------------------------------------------------------------------- */
async function buscarDetalhes(item) {
  if (cacheDetalhes.has(item.name)) return cacheDetalhes.get(item.name);
  const d = await buscarJSON(item.url);
  const hp = d.stats.find((s) => s.stat.name === 'hp');
  const pokemon = {
    id: d.id,
    nome: d.name,
    hp: hp ? hp.base_stat : 0,
    tipos: d.types.map((t) => t.type.name),
    peso: d.weight / 10,   // kg
    altura: d.height / 10, // m
    imagem: d.sprites.other?.['official-artwork']?.front_default
      || d.sprites.front_default
      || 'img/logo.svg',
  };
  cacheDetalhes.set(item.name, pokemon);
  return pokemon;
}

/* REQ 5.1 — Favoritar a partir do card (clicar de novo desfaz). */
function alternarFavorito(pokemon, botao) {
  if (ehFavorito(pokemon.id)) {
    removerFavorito(pokemon.id);
    atualizarBotaoFavoritar(botao, false, pokemon.nome);
    anunciar(`${formatarNome(pokemon.nome)} removido dos favoritos.`);
  } else {
    adicionarFavorito(pokemon);
    atualizarBotaoFavoritar(botao, true, pokemon.nome);
    anunciar(`${formatarNome(pokemon.nome)} adicionado aos favoritos.`);
  }
}

function atualizarStatus() {
  const total = listaAtual.length;
  if (total === 0) {
    statusGaleria.textContent = `Nenhum pokémon encontrado para ${descricaoAtual}. Confira a tabela de tipos ou tente outro nome.`;
    return;
  }
  const exibidos = Math.min(posicao, total);
  const palavra = total === 1 ? 'pokémon' : 'pokémons';
  statusGaleria.textContent = `Exibindo ${exibidos.toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')} ${palavra} — ${descricaoAtual}.`;
}

/* -------------------------------------------------------------------------
   Exibe o próximo lote de cards. Os detalhes são buscados em paralelo,
   apenas para os pokémons que vão aparecer (performance).
   ------------------------------------------------------------------------- */
async function carregarMais() {
  if (carregando || posicao >= listaAtual.length) return;
  carregando = true;
  const minhaBusca = idBusca;
  const lote = listaAtual.slice(posicao, posicao + TAMANHO_LOTE);
  const primeiroLote = posicao === 0;

  grade.setAttribute('aria-busy', 'true');
  botaoMais.disabled = true;
  botaoMais.textContent = 'Carregando…';

  const resultados = await Promise.allSettled(lote.map(buscarDetalhes));
  if (minhaBusca !== idBusca) return; // o usuário já fez outra busca

  const fragmento = document.createDocumentFragment();
  resultados.forEach((r, i) => {
    if (r.status !== 'fulfilled') return; // ignora um pokémon com erro, sem quebrar a página
    fragmento.appendChild(criarCard(r.value, {
      modo: 'galeria',
      // REQ 6.2: só as 4 primeiras imagens (primeira linha no desktop) têm prioridade alta
      prioridade: primeiroLote && i < 4,
      aoClicar: alternarFavorito,
    }));
  });
  grade.appendChild(fragmento);

  posicao += lote.length;
  carregando = false;
  grade.removeAttribute('aria-busy');
  botaoMais.disabled = false;
  botaoMais.textContent = 'Carregar mais pokémons';
  botaoMais.hidden = posicao >= listaAtual.length;

  if (resultados.every((r) => r.status === 'rejected')) {
    statusGaleria.textContent = 'Não foi possível carregar os pokémons. Verifique sua conexão e tente novamente.';
    botaoMais.hidden = false;
    posicao -= lote.length; // permite tentar o mesmo lote de novo
    return;
  }
  atualizarStatus();

  // Rolagem infinita: se o fim da lista ainda está na tela, carrega o próximo lote
  if (sentinelaVisivel) carregarMais();
}

/** Reinicia a grade com uma nova lista de resultados. */
function exibirLista(lista, descricao) {
  idBusca += 1;
  carregando = false;
  listaAtual = lista;
  descricaoAtual = descricao;
  posicao = 0;
  grade.replaceChildren();
  botaoMais.hidden = true;
  atualizarStatus();
  carregarMais();
}

/** Procura um tipo pelo nome em inglês ou português (sem acento). */
function encontrarTipo(termo) {
  return Object.keys(TIPOS).find((chave) => chave === termo || normalizar(TIPOS[chave].pt) === termo);
}

/* -------------------------------------------------------------------------
   REQ 3.1 — Busca por tipo OU por nome.
   1) vazio  -> todos os pokémons (REQ 3.3)
   2) tipo   -> endpoint /type/{tipo}
   3) nome   -> filtra a lista completa (aceita parte do nome ou número)
   ------------------------------------------------------------------------- */
async function executarBusca(textoDigitado) {
  const termo = normalizar(textoDigitado);
  statusGaleria.textContent = 'Buscando…';
  const minhaBusca = ++idBusca;

  try {
    const todos = await carregarListaCompleta();
    if (minhaBusca !== idBusca) return;

    if (!termo) {
      exibirLista(todos, 'todos os pokémons');
      return;
    }

    const tipo = encontrarTipo(termo);
    if (tipo) {
      const dados = await buscarJSON(`${API}/type/${tipo}`);
      if (minhaBusca !== idBusca) return;
      const lista = dados.pokemon.map((p) => p.pokemon);
      exibirLista(lista, `tipo ${TIPOS[tipo].pt}`);
      return;
    }

    const porNome = /^\d+$/.test(termo)
      ? todos.filter((p) => idDaUrl(p.url) === Number(termo))
      : todos.filter((p) => p.name.includes(termo.replace(/\s+/g, '-')));
    exibirLista(porNome, `“${textoDigitado.trim()}”`);
  } catch (erro) {
    if (minhaBusca !== idBusca) return;
    console.error(erro);
    statusGaleria.textContent = 'Não foi possível acessar a PokéAPI agora. Verifique sua conexão e tente novamente.';
  }
}

/* REQ 3.2 — Monta a tabela ilustrativa de tipos; cada tipo é um botão que já busca. */
function montarTabelaTipos() {
  const corpo = document.getElementById('tabela-tipos-corpo');
  const fragmento = document.createDocumentFragment();
  Object.entries(TIPOS).forEach(([chave, info]) => {
    const linha = document.createElement('tr');

    const celulaTipo = document.createElement('td');
    const botao = criarSeloTipo(chave, 'button');
    botao.type = 'button';
    botao.classList.add('selo-tipo--botao');
    botao.appendChild(textoOculto(' (buscar este tipo)'));
    botao.addEventListener('click', () => {
      campo.value = info.pt;
      executarBusca(info.pt);
      document.getElementById('resultados-titulo').scrollIntoView({ block: 'start' });
    });
    celulaTipo.appendChild(botao);

    const celulaTermos = document.createElement('td');
    // Mostra o termo em português e o em inglês (só um, quando são iguais, como "normal")
    celulaTermos.innerHTML = normalizar(info.pt) === chave
      ? `<code>${chave}</code>`
      : `<code>${normalizar(info.pt)}</code> ou <code lang="en">${chave}</code>`;

    const celulaExemplo = document.createElement('td');
    celulaExemplo.textContent = info.exemplo;

    linha.append(celulaTipo, celulaTermos, celulaExemplo);
    fragmento.appendChild(linha);
  });
  corpo.appendChild(fragmento);
}

/* Eventos da busca */
form.addEventListener('submit', (evento) => {
  evento.preventDefault();
  executarBusca(campo.value);
});

botaoLimpar.addEventListener('click', () => {
  campo.value = '';
  executarBusca('');
  campo.focus();
});

botaoMais.addEventListener('click', carregarMais);

// Rolagem infinita com IntersectionObserver (o botão continua como alternativa acessível)
if ('IntersectionObserver' in window) {
  new IntersectionObserver((entradas) => {
    sentinelaVisivel = entradas[0].isIntersecting;
    if (sentinelaVisivel && posicao > 0) carregarMais();
  }, { rootMargin: '600px 0px' }).observe(sentinela);
}

// Se o usuário favoritou/removeu em outra aba, sincroniza os botões desta página
window.addEventListener('storage', (evento) => {
  if (evento.key !== CHAVE_FAVORITOS) return;
  grade.querySelectorAll('.grade__item').forEach((item) => {
    const pokemon = [...cacheDetalhes.values()].find((p) => p.id === Number(item.dataset.id));
    const botao = item.querySelector('.botao--favoritar');
    if (pokemon && botao) atualizarBotaoFavoritar(botao, ehFavorito(pokemon.id), pokemon.nome);
  });
});

// Inicialização: tabela de tipos + listagem completa (REQ 3.3)
montarTabelaTipos();
executarBusca('');
