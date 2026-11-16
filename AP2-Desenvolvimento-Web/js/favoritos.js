/* =========================================================================
   js/favoritos.js — lógica da página Favoritos
   Depende de js/comum.js (lerFavoritos, removerFavorito, criarCard...).
   ========================================================================= */

'use strict';

const gradeFavoritos = document.getElementById('grade-favoritos');
const estadoVazio = document.getElementById('estado-vazio');
const statusFavoritos = document.getElementById('status-favoritos');
const tituloFavoritos = document.getElementById('favoritos-titulo');

/* -------------------------------------------------------------------------
   REQ 5.5 — Resumo estilo carrinho: total, média de peso, média de altura,
   média de HP e lista dos tipos dos escolhidos (cada tipo é um item).
   ------------------------------------------------------------------------- */
function atualizarResumo(lista) {
  const total = lista.length;
  const media = (campo) => lista.reduce((soma, p) => soma + p[campo], 0) / total;

  document.getElementById('resumo-total').textContent = String(total);
  document.getElementById('resumo-peso').textContent = total ? `${formatoNumero.format(media('peso'))} kg` : '–';
  document.getElementById('resumo-altura').textContent = total ? `${formatoNumero.format(media('altura'))} m` : '–';
  document.getElementById('resumo-hp').textContent = total ? formatoNumero.format(media('hp')) : '–';

  // Conta quantos favoritos têm cada tipo (como a quantidade de um item no carrinho)
  const contagem = new Map();
  lista.forEach((p) => p.tipos.forEach((t) => contagem.set(t, (contagem.get(t) || 0) + 1)));

  const listaTipos = document.getElementById('resumo-tipos');
  listaTipos.replaceChildren();
  if (contagem.size === 0) {
    const item = document.createElement('li');
    item.className = 'resumo__sem-tipos';
    item.textContent = 'Nenhum tipo ainda.';
    listaTipos.appendChild(item);
    return;
  }
  [...contagem.entries()]
    .sort((a, b) => b[1] - a[1] || nomeTipo(a[0]).localeCompare(nomeTipo(b[0]), 'pt-BR'))
    .forEach(([tipo, quantidade]) => {
      const item = criarSeloTipo(tipo, 'li');
      const qtd = document.createElement('span');
      qtd.className = 'selo-tipo__qtd';
      qtd.textContent = `× ${quantidade}`;
      item.appendChild(qtd);
      listaTipos.appendChild(item);
    });
}

function atualizarEstadoVazio(lista) {
  estadoVazio.hidden = lista.length > 0;
  gradeFavoritos.hidden = lista.length === 0;
  statusFavoritos.textContent = lista.length
    ? `${lista.length} ${lista.length === 1 ? 'pokémon' : 'pokémons'} na sua coleção.`
    : '';
}

/* -------------------------------------------------------------------------
   REQ 5.4 — Remover favorito: atualiza na hora a lista, o resumo e o
   contador do header, e persiste no localStorage (removerFavorito).
   ------------------------------------------------------------------------- */
function remover(pokemon, botao, item) {
  // Guarda para onde o foco vai depois que o card sumir (acessibilidade)
  const vizinho = item.nextElementSibling || item.previousElementSibling;

  removerFavorito(pokemon.id); // salva no localStorage + atualiza contador (comum.js)
  item.remove();

  const lista = lerFavoritos();
  atualizarResumo(lista);
  atualizarEstadoVazio(lista);
  anunciar(`${formatarNome(pokemon.nome)} removido dos favoritos.`);

  if (vizinho) vizinho.querySelector('button').focus();
  else tituloFavoritos.focus();
}

/* REQ 5.3 — Lista persistente: monta os cards a partir do localStorage. */
function renderizar() {
  const lista = lerFavoritos();
  const fragmento = document.createDocumentFragment();
  lista.forEach((pokemon, i) => {
    fragmento.appendChild(criarCard(pokemon, {
      modo: 'favoritos',
      prioridade: i < 4, // REQ 6.2: primeira linha carrega com prioridade, o resto em lazy
      aoClicar: remover,
    }));
  });
  gradeFavoritos.replaceChildren(fragmento);
  atualizarResumo(lista);
  atualizarEstadoVazio(lista);
}

// Se a coleção mudar em outra aba, redesenha esta página
window.addEventListener('storage', (evento) => {
  if (evento.key === CHAVE_FAVORITOS) renderizar();
});

renderizar();
