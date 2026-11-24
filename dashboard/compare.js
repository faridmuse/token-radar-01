// Compare mode for the Token Radar dashboard. Presentational only: it reads
// the board window.RADAR already exposes, lines up to three protocols side
// by side, and keeps the pick in the URL hash so a comparison can be shared
// as a link. Nothing here recomputes the model or edits board values.
(function () {
  'use strict';

  var MAX_PICKS = 3;
  var PLAN_STAGE_COUNT = 7;
  var picks = [];
  var radar = null;
  var trayEl = null;

  function findRow(slug) {
    var rows = (radar && radar.rows) || [];
    for (var i = 0; i < rows.length; i++) {
      if (rows[i].slug === slug) return rows[i];
    }
    return null;
  }

  function shortMoney(value) {
    if (typeof value !== 'number' || !isFinite(value)) return '—';
    if (value >= 1e9) return '$' + (value / 1e9).toFixed(2) + 'B';
    if (value >= 1e6) return '$' + (value / 1e6).toFixed(1) + 'M';
    if (value >= 1e3) return '$' + Math.round(value / 1e3) + 'K';
    return '$' + Math.round(value);
  }

  function shortMultiple(value) {
    if (typeof value !== 'number' || !isFinite(value)) return '—';
    return '×' + value.toFixed(2);
  }

  function chainList(row) {
    var chains = row.chains || [];
    if (chains.length === 0) return '—';
    var shown = chains.slice(0, 3).join(' + ');
    if (chains.length > 3) shown += ' +' + (chains.length - 3) + ' more';
    return shown;
  }

  function hashPicks() {
    var raw = window.location.hash.replace(/^#/, '');
    if (!raw) return [];
    var params = new URLSearchParams(raw);
    var listed = params.get('compare');
    if (!listed) return [];
    return listed.split(',').map(function (s) {
      return s.trim();
    }).filter(function (s) {
      return s.length > 0;
    });
  }

  function pushHash() {
    var params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    if (picks.length > 0) params.set('compare', picks.join(','));
    else params.delete('compare');
    var text = params.toString();
    var target = text ? '#' + text : window.location.pathname + window.location.search;
    window.history.replaceState(null, '', target);
  }

  function mk(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function metricRows(pickedRows) {
    // The farm plan the dashboard builds always carries seven stages — wallet
    // setup, main action, second action, weekly upkeep, hold, claim check and
    // log — so the step count is the same seven for every protocol.
    var specs = [
      { label: 'Implied value', value: function (r) { return shortMoney(r.implied_value_usd); } },
      { label: 'TVL', value: function (r) { return shortMoney(r.tvl_usd); } },
      { label: 'Category', value: function (r) { return r.category || 'Other'; } },
      { label: 'Chains', value: function (r) { return chainList(r); } },
      { label: 'Model multiple', value: function (r) { return shortMultiple(r.multiple) + ' (' + r.comps + ' comps)'; } },
      { label: 'Farm-plan steps', value: function () { return String(PLAN_STAGE_COUNT); } }
    ];
    return specs.map(function (spec) {
      var tr = document.createElement('tr');
      tr.appendChild(mk('th', 'cmp-label', spec.label));
      pickedRows.forEach(function (row) {
        tr.appendChild(mk('td', 'cmp-num', spec.value(row)));
      });
      return tr;
    });
  }

  function renderTray() {
    if (!trayEl) return;
    trayEl.textContent = '';
    var head = mk('div', 'cmp-head');
    head.appendChild(mk('h2', null, 'Compare protocols'));
    var hint = picks.length === 0
      ? 'Pick up to three protocols from the board to line them up side by side.'
      : picks.length + ' of ' + MAX_PICKS + ' picked — this view travels with the link in the address bar.';
    head.appendChild(mk('p', 'cmp-hint', hint));
    if (picks.length > 0) {
      var clear = mk('button', 'cmp-clear', 'Clear comparison');
      clear.setAttribute('type', 'button');
      clear.addEventListener('click', function () {
        picks = [];
        pushHash();
        renderTray();
        decorateBoard();
      });
      head.appendChild(clear);
    }
    trayEl.appendChild(head);
    if (picks.length === 0) return;
    var rows = picks.map(findRow).filter(function (r) { return r !== null; });
    if (rows.length === 0) return;
    var table = mk('table', 'cmp-table');
    var thead = document.createElement('thead');
    var topRow = document.createElement('tr');
    topRow.appendChild(mk('th', 'cmp-label', ''));
    rows.forEach(function (row) {
      var th = document.createElement('th');
      th.appendChild(mk('span', 'cmp-name', row.name));
      var drop = mk('button', 'cmp-drop', 'Remove');
      drop.setAttribute('type', 'button');
      drop.setAttribute('aria-label', 'Remove ' + row.name + ' from the comparison');
      drop.addEventListener('click', function () { togglePick(row.slug); });
      th.appendChild(drop);
      topRow.appendChild(th);
    });
    thead.appendChild(topRow);
    table.appendChild(thead);
    var tbody = document.createElement('tbody');
    metricRows(rows).forEach(function (tr) { tbody.appendChild(tr); });
    table.appendChild(tbody);
    trayEl.appendChild(table);
  }

  function togglePick(slug) {
    var at = picks.indexOf(slug);
    if (at >= 0) {
      picks.splice(at, 1);
    } else {
      if (picks.length >= MAX_PICKS) return;
      if (!findRow(slug)) return;
      picks.push(slug);
    }
    pushHash();
    renderTray();
    decorateBoard();
  }

  function decorateBoard() {
    var rows = document.querySelectorAll('#board tbody tr');
    rows.forEach(function (tr) {
      var nameNode = tr.querySelector('.name b');
      if (!nameNode) return;
      var match = null;
      (radar.rows || []).forEach(function (row) {
        if (row.name === nameNode.textContent) match = row;
      });
      if (!match) return;
      var slug = match.slug;
      var isPicked = picks.indexOf(slug) >= 0;
      var existing = tr.querySelector('.cmp-toggle');
      if (existing) {
        // Only touch the button when its label actually changes: rewriting
        // textContent replaces the button's text node, which is a childList
        // mutation inside #board, and the board watcher would re-run this
        // function forever on its own changes.
        var wantedLabel = isPicked ? '✓ Compared' : '+ Compare';
        var wantedPressed = isPicked ? 'true' : 'false';
        if (existing.textContent !== wantedLabel) existing.textContent = wantedLabel;
        if (existing.getAttribute('aria-pressed') !== wantedPressed) existing.setAttribute('aria-pressed', wantedPressed);
        return;
      }
      var cell = tr.querySelector('td:last-child');
      if (!cell) return;
      var btn = mk('button', 'cmp-toggle', isPicked ? '✓ Compared' : '+ Compare');
      btn.setAttribute('type', 'button');
      btn.setAttribute('aria-pressed', isPicked ? 'true' : 'false');
      btn.addEventListener('click', function (event) {
        event.stopPropagation();
        togglePick(slug);
      });
      cell.appendChild(btn);
    });
  }

  function watchBoard() {
    var board = document.getElementById('board');
    if (!board || typeof MutationObserver === 'undefined') return;
    var observer = new MutationObserver(function () {
      decorateBoard();
      if (picks.length > 0) pushHash();
    });
    observer.observe(board, { childList: true, subtree: true });
  }

  function boot(data) {
    radar = data || window.RADAR || null;
    if (!radar) return;
    trayEl = document.getElementById('compare-tray');
    picks = hashPicks().filter(function (slug) {
      return findRow(slug) !== null;
    }).slice(0, MAX_PICKS);
    renderTray();
    decorateBoard();
    watchBoard();
  }

  window.__radarCompare = { boot: boot, toggle: togglePick };
})();
