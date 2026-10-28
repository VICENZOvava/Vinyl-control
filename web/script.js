'use strict';

const $ = (selector) => document.querySelector(selector);
const API_BASE_URL = (window.API_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
const SESSION_KEY = 'vinyl-control-user';
let currentUser = readSession();
let discs = [];
let activeView = 'dashboard';
let searchTerm = '';

const views = {
  dashboard: { id: 'dashboardView', title: 'Visão geral', eyebrow: 'PAINEL' },
  discs: { id: 'discsView', title: 'Cadastro de discos', eyebrow: 'ACERVO' },
  stock: { id: 'stockView', title: 'Acervo e vendas', eyebrow: 'ESTOQUE' }
};

function readSession() {
  try {
    const user = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    return user && user.id_usuario ? user : null;
  } catch { return null; }
}

function saveSession(user) {
  currentUser = user;
  try { localStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* sessão segue ativa nesta aba */ }
}

function clearSession() {
  currentUser = null;
  try { localStorage.removeItem(SESSION_KEY); } catch { /* armazenamento indisponível */ }
}

function setNotice(element, message, type) {
  element.textContent = message || '';
  element.className = 'notice' + (type ? ' ' + type : '');
  element.hidden = !message;
}

async function api(path, options) {
  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      ...(options || {}),
      headers: {
        ...((options && options.body) ? { 'Content-Type': 'application/json' } : {}),
        ...((options && options.headers) || {})
      }
    });
  } catch {
    throw new Error('Não foi possível conectar à API. Confira se o servidor está ativo em ' + API_BASE_URL + '.');
  }
  const raw = await response.text();
  let data = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { /* resposta sem JSON */ }
  if (!response.ok) {
    const message = data && (data.message || data.error);
    throw new Error(message || 'A API respondeu com erro (' + response.status + ').');
  }
  return data;
}

function showLogin(message) {
  $('#appScreen').hidden = true;
  $('#loginScreen').hidden = false;
  setNotice($('#loginFeedback'), message || '', message ? 'error' : '');
  if (message) $('#password').value = '';
}

function showApp() {
  if (!currentUser) {
    showLogin('Sua sessão terminou. Entre novamente para continuar.');
    return;
  }
  $('#loginScreen').hidden = true;
  $('#appScreen').hidden = false;
  $('#userName').textContent = currentUser.nome || currentUser.email;
  $('#userEmail').textContent = currentUser.email || '';
  showView(activeView);
}

function showView(name) {
  if (!currentUser) return showLogin('Entre para acessar o sistema.');
  const view = views[name] ? name : 'dashboard';
  activeView = view;
  Object.entries(views).forEach(([key, config]) => { $('#' + config.id).hidden = key !== view; });
  $('#pageTitle').textContent = views[view].title;
  $('#pageEyebrow').textContent = views[view].eyebrow;
  document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
  if (view === 'dashboard') loadDashboard();
  if (view === 'discs' || view === 'stock') loadDiscs();
}

function formatMoney(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount) : '—';
}

function numberOrZero(value) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function normalized(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

function sortedDiscs(items) {
  return [...items].sort((a, b) => String(a.titulo || '').localeCompare(String(b.titulo || ''), 'pt-BR', { sensitivity: 'base' }));
}

function diskDescription(disk) {
  return [disk.titulo || 'Sem título', disk.artista || 'Artista não informado'].join(' — ');
}

async function loadDashboard() {
  const notice = $('#dashboardFeedback');
  try {
    const result = await api('/disco/listar');
    discs = Array.isArray(result) ? result : [];
    const units = discs.reduce((sum, disk) => sum + numberOrZero(disk.quantidade_estoque), 0);
    const low = discs.filter((disk) => numberOrZero(disk.quantidade_estoque) < numberOrZero(disk.estoque_minimo)).length;
    $('#metricDiscs').textContent = String(discs.length);
    $('#metricUnits').textContent = String(units);
    $('#metricLow').textContent = String(low);
    setNotice(notice, '', '');
  } catch (error) {
    $('#metricDiscs').textContent = '—';
    $('#metricUnits').textContent = '—';
    $('#metricLow').textContent = '—';
    setNotice(notice, error.message, 'error');
  }
}

async function loadDiscs() {
  const notice = activeView === 'stock' ? $('#stockFeedback') : $('#discsFeedback');
  setNotice(notice, '', '');
  try {
    const result = await api('/disco/listar');
    discs = Array.isArray(result) ? result : [];
    renderDiscsTable();
    renderInventory();
    updateMovementOptions();
    if (activeView === 'discs') setNotice(notice, '', '');
    return true;
  } catch (error) {
    renderDiscsTable();
    renderInventory();
    setNotice(notice, error.message, 'error');
    return false;
  }
}

function makeCell(text, className) {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderDiscsTable() {
  const body = $('#discsTableBody');
  body.replaceChildren();
  const visible = sortedDiscs(discs).filter((disk) => {
    const haystack = normalized([disk.titulo, disk.artista, disk.genero].join(' '));
    return !searchTerm || haystack.includes(normalized(searchTerm));
  });
  visible.forEach((disk) => {
    const row = document.createElement('tr');
    const info = document.createElement('td');
    info.className = 'disk-cell';
    const title = document.createElement('strong');
    title.textContent = disk.titulo || 'Sem título';
    const artist = document.createElement('span');
    artist.textContent = disk.artista || 'Artista não informado';
    info.append(title, artist);
    row.append(info, makeCell(disk.genero || '—'), makeCell(formatMoney(disk.preco_custo)), makeCell(formatMoney(disk.preco_venda), 'price-cell'), makeCell(String(numberOrZero(disk.quantidade_estoque))), makeCell(String(numberOrZero(disk.estoque_minimo))));
    const actions = document.createElement('td');
    actions.className = 'actions-cell';
    const edit = document.createElement('button');
    edit.type = 'button'; edit.className = 'table-action'; edit.textContent = 'Editar'; edit.dataset.action = 'edit'; edit.dataset.id = String(disk.id_disco);
    edit.setAttribute('aria-label', 'Editar ' + (disk.titulo || 'disco'));
    const remove = document.createElement('button');
    remove.type = 'button'; remove.className = 'table-action danger-text'; remove.textContent = 'Excluir'; remove.dataset.action = 'delete'; remove.dataset.id = String(disk.id_disco);
    remove.setAttribute('aria-label', 'Excluir ' + (disk.titulo || 'disco'));
    actions.append(edit, remove);
    row.append(actions);
    body.append(row);
  });
  $('#discCount').textContent = visible.length + (visible.length === 1 ? ' disco' : ' discos');
  $('#discsEmpty').hidden = visible.length !== 0;
}

function renderInventory() {
  const list = $('#inventoryList');
  list.replaceChildren();
  const ordered = sortedDiscs(discs);
  ordered.forEach((disk) => {
    const quantity = numberOrZero(disk.quantidade_estoque);
    const low = quantity < numberOrZero(disk.estoque_minimo);
    const item = document.createElement('article');
    item.className = 'inventory-item';
    const copy = document.createElement('div');
    copy.className = 'inventory-copy';
    const title = document.createElement('strong');
    title.textContent = disk.titulo || 'Sem título';
    const artist = document.createElement('span');
    artist.textContent = disk.artista || 'Artista não informado';
    copy.append(title, artist);
    const status = document.createElement('span');
    status.className = 'stock-badge' + (low ? ' low' : '');
    status.textContent = low ? 'Abaixo do mínimo' : quantity + ' un.';
    item.append(copy, status);
    list.append(item);
  });
  $('#inventoryEmpty').hidden = ordered.length !== 0;
}

function updateMovementOptions() {
  const select = $('#movementDisk');
  const selected = select.value;
  select.replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = 'Selecione um disco';
  select.append(placeholder);
  sortedDiscs(discs).forEach((disk) => {
    const option = document.createElement('option');
    option.value = String(disk.id_disco);
    option.textContent = diskDescription(disk);
    select.append(option);
  });
  if (discs.some((disk) => String(disk.id_disco) === selected)) select.value = selected;
  updateSelectedDiskInfo();
}

function updateSelectedDiskInfo() {
  const id = $('#movementDisk').value;
  const disk = discs.find((item) => String(item.id_disco) === id);
  $('#selectedDiskInfo').textContent = disk
    ? 'Estoque atual: ' + numberOrZero(disk.quantidade_estoque) + ' unidade(s) • mínimo: ' + numberOrZero(disk.estoque_minimo)
    : 'Escolha um disco para ver o estoque atual.';
}

function openDiskDialog(disk) {
  $('#diskForm').reset();
  $('#diskFormFeedback').hidden = true;
  $('#diskId').value = disk ? String(disk.id_disco) : '';
  $('#diskDialogTitle').textContent = disk ? 'Editar disco' : 'Cadastrar disco';
  $('#diskDialogEyebrow').textContent = disk ? 'ATUALIZAR ITEM' : 'NOVO ITEM';
  if (disk) {
    $('#diskTitle').value = disk.titulo || '';
    $('#diskArtist').value = disk.artista || '';
    $('#diskGenre').value = disk.genero || '';
    $('#diskCost').value = disk.preco_custo == null ? '' : String(disk.preco_custo);
    $('#diskPrice').value = disk.preco_venda == null ? '' : String(disk.preco_venda);
    $('#diskQuantity').value = String(numberOrZero(disk.quantidade_estoque));
    $('#diskMinimum').value = String(numberOrZero(disk.estoque_minimo));
  }
  $('#diskDialog').showModal();
  $('#diskTitle').focus();
}

function closeDiskDialog() { $('#diskDialog').close(); }

function validDiskForm() {
  const form = $('#diskForm');
  if (!form.reportValidity()) return false;
  const values = ['#diskCost', '#diskPrice', '#diskQuantity', '#diskMinimum'].map((selector) => Number($(selector).value));
  const [cost, price, quantity, minimum] = values;
  if (!values.every(Number.isFinite) || cost < 0 || price < 0 || quantity < 0 || minimum < 0 || !Number.isInteger(quantity) || !Number.isInteger(minimum)) {
    setNotice($('#diskFormFeedback'), 'Confira os preços e as quantidades. Preços devem ser positivos e quantidades devem ser números inteiros a partir de zero.', 'error');
    return false;
  }
  setNotice($('#diskFormFeedback'), '', '');
  return true;
}

async function saveDisk(event) {
  event.preventDefault();
  if (!validDiskForm()) return;
  const id = $('#diskId').value;
  const payload = {
    titulo: $('#diskTitle').value.trim(), artista: $('#diskArtist').value.trim(), genero: $('#diskGenre').value.trim(),
    preco_custo: Number($('#diskCost').value), preco_venda: Number($('#diskPrice').value),
    quantidade_estoque: Number($('#diskQuantity').value), estoque_minimo: Number($('#diskMinimum').value)
  };
  const button = $('#saveDiskButton');
  button.disabled = true;
  try {
    await api(id ? '/disco/atualizar/' + encodeURIComponent(id) : '/disco/cadastrar', {
      method: id ? 'PUT' : 'POST', body: JSON.stringify(payload)
    });
    closeDiskDialog();
    const refreshed = await loadDiscs();
    const message = refreshed
      ? (id ? 'Disco atualizado com sucesso.' : 'Disco cadastrado com sucesso.')
      : 'Disco salvo, mas não foi possível atualizar a lista.';
    setNotice($('#discsFeedback'), message, refreshed ? 'success' : 'error');
  } catch (error) {
    setNotice($('#diskFormFeedback'), error.message, 'error');
  } finally { button.disabled = false; }
}

async function handleDiscAction(event) {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const disk = discs.find((item) => String(item.id_disco) === button.dataset.id);
  if (!disk) return;
  if (button.dataset.action === 'edit') return openDiskDialog(disk);
  if (button.dataset.action === 'delete' && window.confirm('Remover "' + (disk.titulo || 'este disco') + '" do acervo? O disco sairá das listas ativas, mas seu histórico será preservado.')) {
    try {
      await api('/disco/excluir/' + encodeURIComponent(disk.id_disco), { method: 'DELETE' });
      const refreshed = await loadDiscs();
      setNotice($('#discsFeedback'), refreshed ? 'Disco excluído do acervo.' : 'Disco excluído, mas não foi possível atualizar a lista.', refreshed ? 'success' : 'error');
    } catch (error) { setNotice($('#discsFeedback'), error.message, 'error'); }
  }
}

function setLocalDate() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  $('#movementDate').value = now.toISOString().slice(0, 10);
}

async function saveMovement(event) {
  event.preventDefault();
  const form = $('#movementForm');
  if (!form.reportValidity()) return;
  if (!currentUser || !Number.isInteger(Number(currentUser.id_usuario))) {
    clearSession();
    showLogin('Não foi possível identificar seu usuário. Entre novamente para continuar.');
    return;
  }
  const disk = discs.find((item) => String(item.id_disco) === $('#movementDisk').value);
  if (!disk) return setNotice($('#stockFeedback'), 'Selecione um disco cadastrado.', 'error');
  const quantity = Number($('#movementQuantity').value);
  if (!Number.isInteger(quantity) || quantity < 1) return setNotice($('#stockFeedback'), 'A quantidade deve ser um número inteiro maior que zero.', 'error');
  const type = $('#movementType').value;
  const oldQuantity = numberOrZero(disk.quantidade_estoque);
  const newQuantity = type === 'entrada' ? oldQuantity + quantity : oldQuantity - quantity;
  if (type === 'saida' && newQuantity < 0) return setNotice($('#stockFeedback'), 'A venda não pode ser maior que a quantidade disponível (' + oldQuantity + ').', 'error');

  const button = $('#movementButton');
  button.disabled = true;
  setNotice($('#stockFeedback'), '', '');
  try {
    await api('/disco/atualizar/' + encodeURIComponent(disk.id_disco), {
      method: 'PUT', body: JSON.stringify({ quantidade_estoque: newQuantity })
    });
    try {
      await api('/movimentacao_estoque/cadastrar', {
        method: 'POST',
        body: JSON.stringify({
          id_disco: Number(disk.id_disco), id_usuario: Number(currentUser.id_usuario),
          tipo_movimentacao: type, quantidade,
          data_movimentacao: $('#movementDate').value + 'T12:00:00.000Z',
          observacao: $('#movementNote').value.trim() || null
        })
      });
    } catch (movementError) {
      try {
        await api('/disco/atualizar/' + encodeURIComponent(disk.id_disco), {
          method: 'PUT', body: JSON.stringify({ quantidade_estoque: oldQuantity })
        });
      } catch {
        throw new Error(movementError.message + ' O estoque foi alterado, mas não foi possível reverter a alteração.');
      }
      throw movementError;
    }
    const refreshed = await loadDiscs();
    form.reset();
    setLocalDate();
    const message = refreshed
      ? (type === 'entrada' ? 'Reposição registrada e estoque atualizado.' : 'Venda registrada e estoque atualizado.')
      : 'Movimentação salva, mas não foi possível atualizar a lista de estoque.';
    setNotice($('#stockFeedback'), message, refreshed ? 'success' : 'error');
    if (type === 'saida' && newQuantity < numberOrZero(disk.estoque_minimo)) {
      window.alert('Atenção: o estoque de "' + (disk.titulo || 'este disco') + '" ficou abaixo do mínimo configurado (' + numberOrZero(disk.estoque_minimo) + ' unidade(s)).');
    }
  } catch (error) { setNotice($('#stockFeedback'), error.message, 'error'); }
  finally { button.disabled = false; }
}

$('#togglePassword').addEventListener('click', () => {
  const input = $('#password');
  const visible = input.type === 'password';
  input.type = visible ? 'text' : 'password';
  $('#togglePassword').textContent = visible ? 'Ocultar' : 'Mostrar';
  $('#togglePassword').setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
  $('#togglePassword').setAttribute('aria-pressed', String(visible));
});

$('#loginForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('#email').value.trim();
  const senha = $('#password').value;
  const form = event.currentTarget;
  if (!form.reportValidity()) return;
  const button = $('#loginButton');
  button.disabled = true;
  button.textContent = 'Verificando...';
  setNotice($('#loginFeedback'), '', '');
  try {
    const result = await api('/usuario/login', { method: 'POST', body: JSON.stringify({ email, senha }) });
    if (!result || !result.usuario || !result.usuario.id_usuario) throw new Error('A API não retornou os dados do usuário autenticado.');
    saveSession(result.usuario);
    form.reset();
    showApp();
  } catch (error) { showLogin(error.message); }
  finally {
    button.disabled = false;
    button.innerHTML = 'Entrar <span aria-hidden="true">→</span>';
  }
});

document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => showView(button.dataset.view)));
$('#logoutButton').addEventListener('click', () => {
  clearSession();
  activeView = 'dashboard';
  showLogin('');
  $('#email').focus();
});
$('#newDiskButton').addEventListener('click', () => openDiskDialog(null));
$('#diskForm').addEventListener('submit', saveDisk);
$('#closeDiskDialog').addEventListener('click', closeDiskDialog);
$('#cancelDiskButton').addEventListener('click', closeDiskDialog);
$('#diskDialog').addEventListener('click', (event) => { if (event.target === $('#diskDialog')) closeDiskDialog(); });
$('#discsTableBody').addEventListener('click', handleDiscAction);
$('#searchForm').addEventListener('submit', (event) => {
  event.preventDefault();
  searchTerm = $('#searchInput').value.trim();
  renderDiscsTable();
});
$('#clearSearchButton').addEventListener('click', () => {
  $('#searchInput').value = '';
  searchTerm = '';
  renderDiscsTable();
});
$('#movementDisk').addEventListener('change', updateSelectedDiskInfo);
$('#movementForm').addEventListener('submit', saveMovement);

setLocalDate();
if (currentUser) showApp();
else showLogin('');


