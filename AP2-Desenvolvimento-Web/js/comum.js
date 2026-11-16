/* =========================================================================
   js/comum.js — código compartilhado pelas 3 páginas (Index, Galeria, Favoritos)
   REQ 1.5: JS separado do HTML e linkado com <script defer>.
   ========================================================================= */

'use strict';

/* -------------------------------------------------------------------------
   Tipos de pokémon: nome em inglês (usado pela API), nome em português,
   um exemplo e as cores do selo. Usado pela tabela de tipos (REQ 3.2),
   pela busca por tipo (REQ 3.1), pelos cards (REQ 4.1) e pelo resumo (REQ 5.5).
   As cores foram escolhidas para manter contraste AA com o texto (REQ 7.2).
   ------------------------------------------------------------------------- */
const TIPOS = {
  normal:   { pt: 'Normal',    exemplo: 'Snorlax',    fundo: '#A8A77A', texto: '#1b1f3b' },
  fire:     { pt: 'Fogo',      exemplo: 'Charmander', fundo: '#C2410C', texto: '#ffffff' },
  water:    { pt: 'Água',      exemplo: 'Squirtle',   fundo: '#1D4ED8', texto: '#ffffff' },
  grass:    { pt: 'Planta',    exemplo: 'Bulbasaur',  fundo: '#15803D', texto: '#ffffff' },
  electric: { pt: 'Elétrico',  exemplo: 'Pikachu',    fundo: '#FACC15', texto: '#1b1f3b' },
  ice:      { pt: 'Gelo',      exemplo: 'Glaceon',    fundo: '#7DD3FC', texto: '#1b1f3b' },
  fighting: { pt: 'Lutador',   exemplo: 'Machamp',    fundo: '#B91C1C', texto: '#ffffff' },
  poison:   { pt: 'Venenoso',  exemplo: 'Ekans',      fundo: '#7E22CE', texto: '#ffffff' },
  ground:   { pt: 'Terrestre', exemplo: 'Sandshrew',  fundo: '#D4A24C', texto: '#1b1f3b' },
  flying:   { pt: 'Voador',    exemplo: 'Pidgeot',    fundo: '#A5B4FC', texto: '#1b1f3b' },
  psychic:  { pt: 'Psíquico',  exemplo: 'Mewtwo',     fundo: '#BE185D', texto: '#ffffff' },
  bug:      { pt: 'Inseto',    exemplo: 'Scyther',    fundo: '#84CC16', texto: '#1b1f3b' },
  rock:     { pt: 'Pedra',     exemplo: 'Onix',       fundo: '#B6A136', texto: '#1b1f3b' },
  ghost:    { pt: 'Fantasma',  exemplo: 'Gengar',     fundo: '#5B21B6', texto: '#ffffff' },
  dragon:   { pt: 'Dragão',    exemplo: 'Dragonite',  fundo: '#4338CA', texto: '#ffffff' },
  dark:     { pt: 'Sombrio',   exemplo: 'Umbreon',    fundo: '#3F3F46', texto: '#ffffff' },
  steel:    { pt: 'Aço',       exemplo: 'Steelix',    fundo: '#94A3B8', texto: '#1b1f3b' },
  fairy:    { pt: 'Fada',      exemplo: 'Clefairy',   fundo: '#F9A8D4', texto: '#1b1f3b' },
};

/** Remove acentos e padroniza para minúsculas (usado na busca). */
function normalizar(texto) {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();
}

/** "mr-mime" -> "Mr Mime" */
function formatarNome(nome) {
  return nome.split('-').map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
}

/** Nome do tipo em português (ou o próprio nome, se for um tipo desconhecido). */
function nomeTipo(tipo) {
  return TIPOS[tipo] ? TIPOS[tipo].pt : formatarNome(tipo);
}

/** Cria o selo colorido de um tipo. */
function criarSeloTipo(tipo, elemento = 'span') {
  const selo = document.createElement(elemento);
  selo.className = 'selo-tipo';
  selo.textContent = nomeTipo(tipo);
  const cores = TIPOS[tipo];
  if (cores) {
    selo.style.setProperty('--tipo-fundo', cores.fundo);
    selo.style.setProperty('--tipo-texto', cores.texto);
  }
  return selo;
}

const formatoNumero = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 });

/* =========================================================================
   REQ 5.3 / 5.4 — Persistência dos favoritos no localStorage.
   Cada favorito guarda os dados já prontos para o card (não precisa
   chamar a API de novo na página de favoritos).
   ========================================================================= */
const CHAVE_FAVORITOS = 'pokecolecao:favoritos';

function lerFavoritos() {
  try {
    const dados = JSON.parse(localStorage.getItem(CHAVE_FAVORITOS));
    return Array.isArray(dados) ? dados : [];
  } catch {
    // localStorage indisponível ou com JSON inválido: começa com a coleção vazia
    return [];
  }
}

function salvarFavoritos(lista) {
  try {
    localStorage.setItem(CHAVE_FAVORITOS, JSON.stringify(lista));
  } catch {
    anunciar('Não foi possível salvar a coleção neste navegador.');
  }
  atualizarContador(); // REQ 5.2: contador sempre reflete o que foi salvo
}

function ehFavorito(id) {
  return lerFavoritos().some((p) => p.id === id);
}

/** REQ 5.1 — adiciona o pokémon à coleção. */
function adicionarFavorito(pokemon) {
  const lista = lerFavoritos();
  if (!lista.some((p) => p.id === pokemon.id)) {
    lista.push(pokemon);
    salvarFavoritos(lista);
  }
}

/** REQ 5.4 — remove o pokémon da coleção e persiste no localStorage. */
function removerFavorito(id) {
  salvarFavoritos(lerFavoritos().filter((p) => p.id !== id));
}

/* =========================================================================
   REQ 5.2 — Contador de favoritos no header (estilo carrinho).
   Lê do localStorage em toda página, então persiste entre páginas.
   ========================================================================= */
function atualizarContador() {
  const total = lerFavoritos().length;
  document.querySelectorAll('[data-contador-favoritos]').forEach((el) => {
    el.textContent = total > 99 ? '99+' : String(total);
    el.classList.toggle('contador--vazio', total === 0);
  });
}

// Mantém o contador sincronizado se a coleção mudar em outra aba
window.addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_FAVORITOS) atualizarContador();
});

/* =========================================================================
   REQ 7.2 — Região "aria-live" para avisar leitores de tela sobre
   ações como favoritar/remover.
   ========================================================================= */
let regiaoAnuncio = null;
function anunciar(mensagem) {
  if (!regiaoAnuncio) {
    regiaoAnuncio = document.createElement('div');
    regiaoAnuncio.className = 'visualmente-oculto';
    regiaoAnuncio.setAttribute('role', 'status');
    regiaoAnuncio.setAttribute('aria-live', 'polite');
    document.body.appendChild(regiaoAnuncio);
  }
  regiaoAnuncio.textContent = '';
  // pequeno atraso para o leitor de tela perceber a troca de texto
  setTimeout(() => { regiaoAnuncio.textContent = mensagem; }, 50);
}

/* =========================================================================
   REQ 4.1 — Card do pokémon (nome, HP, tipo, peso, altura e imagem).
   Mesmo componente na Galeria e nos Favoritos (REQ 5.3: mesmo padrão).
   opcoes.modo: 'galeria' (botão Favoritar) ou 'favoritos' (botão Remover)
   opcoes.prioridade: true para as primeiras imagens visíveis
   opcoes.aoClicar: função chamada ao clicar no botão do card
   ========================================================================= */
function criarCard(pokemon, opcoes) {
  const { modo, prioridade = false, aoClicar } = opcoes;
  const idTitulo = `nome-${modo}-${pokemon.id}`;

  const item = document.createElement('li');
  item.className = 'grade__item';
  item.dataset.id = pokemon.id;

  const card = document.createElement('article');
  card.className = 'card';
  card.setAttribute('aria-labelledby', idTitulo);

  // REQ 6.2 Imagens e CLS: width/height fixos + aspect-ratio no CSS,
  // loading="lazy" fora da primeira dobra e decoding="async"
  const img = document.createElement('img');
  img.className = 'card__imagem';
  img.src = pokemon.imagem;
  img.alt = `Ilustração oficial de ${formatarNome(pokemon.nome)}`;
  img.width = 240;
  img.height = 240;
  img.decoding = 'async';
  img.loading = prioridade ? 'eager' : 'lazy';
  if (prioridade) img.setAttribute('fetchpriority', 'high');

  const numero = document.createElement('span');
  numero.className = 'card__numero';
  numero.textContent = `#${String(pokemon.id).padStart(4, '0')}`;

  const titulo = document.createElement('h3');
  titulo.className = 'card__nome';
  titulo.id = idTitulo;
  titulo.textContent = formatarNome(pokemon.nome);

  const tipos = document.createElement('ul');
  tipos.className = 'card__tipos';
  tipos.setAttribute('aria-label', 'Tipos');
  pokemon.tipos.forEach((t) => tipos.appendChild(criarSeloTipo(t, 'li')));

  // dl: pares "rótulo / valor" — semântica correta para leitores de tela
  const dados = document.createElement('dl');
  dados.className = 'card__dados';
  [
    ['HP', String(pokemon.hp)],
    ['Peso', `${formatoNumero.format(pokemon.peso)} kg`],
    ['Altura', `${formatoNumero.format(pokemon.altura)} m`],
  ].forEach(([rotulo, valor]) => {
    const grupo = document.createElement('div');
    grupo.className = 'card__dado';
    const dt = document.createElement('dt');
    dt.textContent = rotulo;
    const dd = document.createElement('dd');
    dd.textContent = valor;
    grupo.append(dt, dd);
    dados.appendChild(grupo);
  });

  const botao = document.createElement('button');
  botao.type = 'button';
  if (modo === 'galeria') {
    // REQ 5.1 Botão favoritar em cada card da galeria
    botao.className = 'botao botao--favoritar';
    atualizarBotaoFavoritar(botao, ehFavorito(pokemon.id), pokemon.nome);
  } else {
    // REQ 5.4 Botão remover em cada card dos favoritos
    botao.className = 'botao botao--remover';
    botao.innerHTML = '<i class="fa-solid fa-trash-can" aria-hidden="true"></i> Remover';
    botao.appendChild(textoOculto(` ${formatarNome(pokemon.nome)} dos favoritos`));
  }
  botao.addEventListener('click', () => aoClicar(pokemon, botao, item));

  card.append(img, numero, titulo, tipos, dados, botao);
  item.appendChild(card);
  return item;
}

/** Alterna o visual/estado do botão Favoritar (aria-pressed para acessibilidade). */
// O nome do pokémon vai em texto oculto para que o leitor de tela diga
// "Favoritar Pikachu, botão alternar, não pressionado" (o texto visível faz parte do nome acessível).
function atualizarBotaoFavoritar(botao, favoritado, nome) {
  botao.setAttribute('aria-pressed', String(favoritado));
  botao.innerHTML = favoritado
    ? '<i class="fa-solid fa-heart" aria-hidden="true"></i> Favoritado'
    : '<i class="fa-regular fa-heart" aria-hidden="true"></i> Favoritar';
  botao.appendChild(textoOculto(` ${formatarNome(nome)}`));
}

/** Span visível só para leitores de tela. */
function textoOculto(texto) {
  const span = document.createElement('span');
  span.className = 'visualmente-oculto';
  span.textContent = texto;
  return span;
}

/* =========================================================================
   REQ 1.3 — Data dinâmica no footer.
   Formato: "segunda-feira, 2 de novembro de 2026" (dia da semana, dia do
   mês, mês por extenso e ano com 4 dígitos).
   ========================================================================= */
function preencherData() {
  const elemento = document.getElementById('data-atual');
  if (!elemento) return;
  const hoje = new Date();
  elemento.textContent = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(hoje);
  // atributo datetime em formato ISO (AAAA-MM-DD) para máquinas/leitores
  const mes = String(hoje.getMonth() + 1).padStart(2, '0');
  const dia = String(hoje.getDate()).padStart(2, '0');
  elemento.setAttribute('datetime', `${hoje.getFullYear()}-${mes}-${dia}`);
}

// Inicialização comum às 3 páginas (scripts com defer: o DOM já está pronto)
preencherData();
atualizarContador();
