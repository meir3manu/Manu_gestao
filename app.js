const STORAGE_KEY = "taskflow_pro_tasks_v3";
const CUSTOM_CATS_KEY = "taskflow_pro_custom_cats_v3";
const LAST_AUTHOR_KEY = "taskflow_pro_last_author_v3";

const BASE_CATEGORIES = [
  "Faculdade",
  "Trabalho",
  "Projetos",
  "Prazos de Editais",
  "Demandas Gerais"
];

const DEFAULT_TASKS = [
  {
    id: 1,
    title: "Submissão de Documentos — Edital de Pesquisa",
    desc: "Organizar histórico atualizado, currículo Lattes e documentação exigida no edital.",
    date: "2026-11-12",
    priority: "Alta",
    category: "Prazos de Editais",
    author: "Meire Emanuela",
    completed: false
  },
  {
    id: 2,
    title: "Entrega do Trabalho da Faculdade",
    desc: "Revisar formatação ABNT, slides da apresentação e tópicos do seminário.",
    date: "2026-11-12",
    priority: "Alta",
    category: "Faculdade",
    author: "Meire Emanuela",
    completed: true
  },
  {
    id: 3,
    title: "Relatório Mensal de Atividades",
    desc: "Consolidar entregas realizadas no mês e alinhar próximas etapas com a equipe.",
    date: "2026-11-14",
    priority: "Alta",
    category: "Trabalho",
    author: "Meire Emanuela",
    completed: false
  },
  {
    id: 4,
    title: "Cronograma do Novo Projeto",
    desc: "Definir metas principais, materiais de apoio e calendário de execução.",
    date: "2026-11-15",
    priority: "Média",
    category: "Projetos",
    author: "Meire Emanuela",
    completed: false
  },
  {
    id: 5,
    title: "Leitura e Fichamento dos Artigos",
    desc: "Resumir os textos principais para a aula da próxima semana.",
    date: "2026-11-10",
    priority: "Média",
    category: "Faculdade",
    author: "Meire Emanuela",
    completed: true
  },
  {
    id: 6,
    title: "Planejamento Semanal da Rotina",
    desc: "Definir as metas prioritárias da semana e organizar blocos de foco.",
    date: "2026-11-11",
    priority: "Baixa",
    category: "Demandas Gerais",
    author: "Meire Emanuela",
    completed: true
  },
  {
    id: 7,
    title: "Inscrição no Edital de Inovação & Extensão",
    desc: "Preencher formulário online e anexar plano de trabalho detalhado.",
    date: "2026-11-18",
    priority: "Média",
    category: "Prazos de Editais",
    author: "Meire Emanuela",
    completed: false
  },
  {
    id: 8,
    title: "Atualizar Documentação do Projeto",
    desc: "Incluir referências atualizadas e checklist de acompanhamento.",
    date: "2026-11-20",
    priority: "Baixa",
    category: "Projetos",
    author: "Meire Emanuela",
    completed: false
  }
];

function loadCustomCategories() {
  try {
    const raw = localStorage.getItem(CUSTOM_CATS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveCustomCategories(list) {
  try {
    localStorage.setItem(CUSTOM_CATS_KEY, JSON.stringify(list));
  } catch (e) {}
}

let customCategories = loadCustomCategories();

function getAllCategories() {
  const all = [...BASE_CATEGORIES];
  customCategories.forEach(c => {
    if (c && !all.includes(c)) all.push(c);
  });
  tasks.forEach(t => {
    if (t.category && !all.includes(t.category)) all.push(t.category);
  });
  return all;
}

function loadTasks() {
  try {
    if (window.location.hash && window.location.hash.startsWith("#plan=")) {
      const encoded = decodeURIComponent(window.location.hash.slice(6));
      const jsonStr = decodeURIComponent(escape(atob(encoded)));
      const sharedTasks = JSON.parse(jsonStr);
      if (Array.isArray(sharedTasks)) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sharedTasks));
        setTimeout(() => showToast("Planejamento compartilhado carregado com sucesso!"), 300);
        return sharedTasks;
      }
    }
  } catch (e) {}

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return JSON.parse(JSON.stringify(DEFAULT_TASKS));
}

function persistTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (e) {}
}

function sharePlanLink() {
  try {
    const jsonStr = JSON.stringify(tasks);
    const encoded = btoa(unescape(encodeURIComponent(jsonStr)));
    const baseUrl = window.location.href.split("#")[0];
    const shareUrl = `${baseUrl}#plan=${encodeURIComponent(encoded)}`;
    window.history.replaceState(null, "", `#plan=${encodeURIComponent(encoded)}`);
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("Link com suas tarefas copiado! Envie para seu colega.");
      }).catch(() => {
        prompt("Copie o link abaixo para enviar ao seu colega:", shareUrl);
      });
    } else {
      prompt("Copie o link abaixo para enviar ao seu colega:", shareUrl);
    }
  } catch (e) {
    showToast("Não foi possível gerar o link de compartilhamento.");
  }
}

function resetDemoData() {
  tasks = JSON.parse(JSON.stringify(DEFAULT_TASKS));
  persistTasks();
  showToast("Dados de exemplo restaurados!");
  renderAll();
}

let tasks = loadTasks();
let currentPage = "dashboard";
let currentFilter = "all";
let currentCategory = "all";
let searchQuery = "";
let selectedCalendarDate = "2026-11-12";
let currentCalendarMonthKey = "2026-11";

const MONTH_NAMES_FULL = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

// Todos os meses de Novembro de 2026 até Dezembro de 2028
const AVAILABLE_MONTHS = [];
for (let y = 2026; y <= 2028; y++) {
  const startM = y === 2026 ? 11 : 1;
  for (let m = startM; m <= 12; m++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    AVAILABLE_MONTHS.push({
      key,
      year: y,
      month: m,
      label: `${MONTH_NAMES_FULL[m - 1]} ${y}`
    });
  }
}

const pageMeta = {
  dashboard: { title: "Dashboard de Produtividade", subtitle: "Visão Geral Executiva" },
  tasks: { title: "Lista de Tarefas", subtitle: "Gerenciamento Detalhado em Cards" },
  calendar: { title: "Calendário de Atividades", subtitle: "Agenda Completa • Nov 2026 a Dez 2028" },
  analytics: { title: "Gráficos & Indicadores", subtitle: "Métricas Visuais de Performance" }
};

function formatDateBR(dateStr) {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const mIndex = parseInt(parts[1], 10) - 1;
  return `${parts[2]} ${months[mIndex] || parts[1]}, ${parts[0]}`;
}

function getPriorityBadge(priority) {
  if (priority === "Alta") {
    return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200/60">Alta</span>`;
  }
  if (priority === "Média") {
    return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/60">Média</span>`;
  }
  return `<span class="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200/60">Baixa</span>`;
}

function getCategoryBadge(category) {
  return `<span class="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-600">${category}</span>`;
}

function getAuthorBadge(author) {
  if (!author) return "";
  return `<span class="px-2 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700">👤 ${author}</span>`;
}

function showToast(msg) {
  const toast = document.getElementById("toast");
  document.getElementById("toast-msg").textContent = msg;
  toast.classList.remove("hidden");
  toast.classList.add("flex");
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => {
    toast.classList.add("hidden");
    toast.classList.remove("flex");
  }, 2600);
}

function populateCategoryDropdowns(selectedValue = "Faculdade") {
  const allCats = getAllCategories();

  // 1. Filtro na página Lista de Tarefas
  const filterSelect = document.getElementById("category-select");
  if (filterSelect) {
    const currentVal = currentCategory;
    filterSelect.innerHTML = `<option value="all">Todas as Categorias</option>` +
      allCats.map(c => `<option value="${c}">${c}</option>`).join("");
    filterSelect.value = allCats.includes(currentVal) ? currentVal : "all";
  }

  // 2. Select dentro do modal de Nova Tarefa
  const modalSelect = document.getElementById("task-category");
  if (modalSelect) {
    modalSelect.innerHTML =
      allCats.map(c => `<option value="${c}">${c}</option>`).join("") +
      `<option value="Outros">Outros (Adicionar título de categoria...)</option>`;

    if (allCats.includes(selectedValue)) {
      modalSelect.value = selectedValue;
      handleCategorySelectChange(selectedValue);
    } else {
      modalSelect.value = allCats[0] || "Faculdade";
      handleCategorySelectChange(modalSelect.value);
    }
  }
}

function handleCategorySelectChange(val) {
  const wrapper = document.getElementById("custom-category-wrapper");
  const customInput = document.getElementById("task-custom-category");
  if (!wrapper || !customInput) return;

  if (val === "Outros") {
    wrapper.classList.remove("hidden");
    customInput.required = true;
    setTimeout(() => customInput.focus(), 40);
  } else {
    wrapper.classList.add("hidden");
    customInput.required = false;
    customInput.value = "";
  }
}

function switchPage(page) {
  currentPage = page;
  ["dashboard", "tasks", "calendar", "analytics"].forEach(p => {
    const section = document.getElementById(`view-${p}`);
    const navBtn = document.getElementById(`nav-${p}`);
    if (p === page) {
      section.classList.remove("hidden");
      navBtn.className = "nav-btn flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-semibold transition-all cursor-pointer whitespace-nowrap bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border border-blue-200/60 shadow-2xs";
    } else {
      section.classList.add("hidden");
      navBtn.className = "nav-btn flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-sm font-medium text-slate-600 hover:bg-slate-100/80 transition-all cursor-pointer whitespace-nowrap";
    }
  });

  document.getElementById("page-title").textContent = pageMeta[page].title;
  document.getElementById("page-subtitle").textContent = pageMeta[page].subtitle;
  renderAll();
}

function handleSearch(val) {
  searchQuery = val.trim().toLowerCase();
  if (currentPage !== "tasks" && searchQuery.length > 0) {
    switchPage("tasks");
  } else {
    renderAll();
  }
}

function toggleTask(id) {
  const t = tasks.find(item => item.id === id);
  if (!t) return;
  t.completed = !t.completed;
  persistTasks();
  showToast(t.completed ? "Tarefa marcada como concluída!" : "Tarefa reaberta como pendente.");
  renderAll();
}

function deleteTask(id) {
  tasks = tasks.filter(item => item.id !== id);
  persistTasks();
  showToast("Tarefa excluída com sucesso.");
  renderAll();
}

function openTaskModal(editId = null, presetDate = null) {
  const modal = document.getElementById("task-modal");
  const titleEl = document.getElementById("modal-title");
  const idInput = document.getElementById("task-id");
  const titleInput = document.getElementById("task-title");
  const authorInput = document.getElementById("task-author");
  const descInput = document.getElementById("task-desc");
  const dateInput = document.getElementById("task-date");
  const priorityInput = document.getElementById("task-priority");

  const savedAuthor = localStorage.getItem(LAST_AUTHOR_KEY) || "Meire Emanuela";

  if (editId) {
    const task = tasks.find(t => t.id === editId);
    if (!task) return;
    titleEl.textContent = "Editar Tarefa";
    idInput.value = task.id;
    titleInput.value = task.title;
    authorInput.value = task.author || savedAuthor;
    descInput.value = task.desc;
    dateInput.value = task.date;
    priorityInput.value = task.priority;
    populateCategoryDropdowns(task.category);
  } else {
    titleEl.textContent = "Nova Tarefa";
    idInput.value = "";
    titleInput.value = "";
    authorInput.value = savedAuthor;
    descInput.value = "";
    dateInput.value = presetDate || selectedCalendarDate || "2026-11-12";
    priorityInput.value = "Média";
    populateCategoryDropdowns("Faculdade");
  }

  modal.classList.remove("hidden");
  modal.classList.add("flex");
  setTimeout(() => titleInput.focus(), 50);
}

function openTaskModalForSelectedDate() {
  openTaskModal(null, selectedCalendarDate);
}

function closeTaskModal() {
  const modal = document.getElementById("task-modal");
  modal.classList.add("hidden");
  modal.classList.remove("flex");
}

function saveTask(e) {
  e.preventDefault();
  const idVal = document.getElementById("task-id").value;
  const title = document.getElementById("task-title").value.trim();
  const author = document.getElementById("task-author").value.trim() || "Meire Emanuela";
  const desc = document.getElementById("task-desc").value.trim() || "Sem descrição complementar.";
  const date = document.getElementById("task-date").value;
  const priority = document.getElementById("task-priority").value;
  const selectedCat = document.getElementById("task-category").value;
  const customCatInput = document.getElementById("task-custom-category").value.trim();

  if (!title) return;

  let finalCategory = selectedCat;
  if (selectedCat === "Outros") {
    finalCategory = customCatInput || "Outros";
    if (!BASE_CATEGORIES.includes(finalCategory) && !customCategories.includes(finalCategory)) {
      customCategories.push(finalCategory);
      saveCustomCategories(customCategories);
    }
  }

  try {
    localStorage.setItem(LAST_AUTHOR_KEY, author);
  } catch (err) {}

  if (idVal) {
    const task = tasks.find(t => t.id === Number(idVal));
    if (task) {
      task.title = title;
      task.author = author;
      task.desc = desc;
      task.date = date;
      task.priority = priority;
      task.category = finalCategory;
      showToast("Tarefa atualizada com sucesso!");
    }
  } else {
    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    tasks.unshift({
      id: newId,
      title,
      author,
      desc,
      date,
      priority,
      category: finalCategory,
      completed: false
    });
    showToast("Nova tarefa adicionada!");
  }

  if (date && date.slice(0, 7) >= "2026-11" && date.slice(0, 7) <= "2028-12") {
    currentCalendarMonthKey = date.slice(0, 7);
    selectedCalendarDate = date;
  }

  persistTasks();
  closeTaskModal();
  renderAll();
}

function setTaskFilter(filter) {
  currentFilter = filter;
  ["all", "pending", "completed", "Alta"].forEach(f => {
    const btn = document.getElementById(`filter-${f}`);
    if (!btn) return;
    if (f === filter) {
      btn.className = "filter-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm cursor-pointer";
    } else {
      btn.className = "filter-pill px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer";
    }
  });
  renderTasksPage();
}

function setCategoryFilter(cat) {
  currentCategory = cat;
  renderTasksPage();
}

function renderKPIs() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  const pending = total - completed;
  const highPending = tasks.filter(t => !t.completed && t.priority === "Alta").length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  document.getElementById("kpi-total").textContent = total;
  document.getElementById("kpi-completed").textContent = completed;
  document.getElementById("kpi-pending").textContent = pending;
  document.getElementById("kpi-high").textContent = highPending;
  document.getElementById("kpi-rate-badge").textContent = `${pct}% concluído`;

  document.getElementById("sidebar-pending-badge").textContent = pending;
  document.getElementById("sidebar-goal-pct").textContent = `${pct}%`;
  document.getElementById("sidebar-goal-bar").style.width = `${pct}%`;
  document.getElementById("sidebar-goal-text").textContent = `${completed} de ${total} tarefas finalizadas`;

  const circumference = 251.2;
  const offset = circumference - (pct / 100) * circumference;
  document.getElementById("dash-donut-ring").style.strokeDashoffset = offset;
  document.getElementById("dash-donut-pct").textContent = `${pct}%`;
  document.getElementById("dash-legend-done").textContent = completed;
  document.getElementById("dash-legend-pending").textContent = pending;
}

function renderDashboard() {
  const listEl = document.getElementById("dashboard-task-list");
  const displayTasks = tasks.slice(0, 5);

  if (displayTasks.length === 0) {
    listEl.innerHTML = `<div class="p-8 text-center text-xs text-slate-400">Nenhuma tarefa cadastrada. Clique em "Nova Tarefa" para começar!</div>`;
  } else {
    listEl.innerHTML = displayTasks.map(t => `
      <div class="p-3.5 rounded-2xl border ${t.completed ? 'bg-slate-50/70 border-slate-200/60' : 'bg-white border-slate-200 hover:border-blue-300'} flex items-start justify-between gap-3 transition-all">
        <div class="flex items-start gap-3 min-w-0">
          <button
            onclick="toggleTask(${t.id})"
            title="${t.completed ? 'Reabrir tarefa' : 'Concluir tarefa'}"
            class="mt-0.5 w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all cursor-pointer ${t.completed ? 'bg-gradient-to-r from-blue-600 to-purple-600 border-transparent text-white' : 'border-slate-300 hover:border-blue-600 bg-white'}"
          >
            ${t.completed ? `<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>` : ''}
          </button>
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2">
              <p class="text-sm font-semibold ${t.completed ? 'line-through text-slate-400' : 'text-slate-800'}">${t.title}</p>
              ${getPriorityBadge(t.priority)}
              ${getCategoryBadge(t.category)}
              ${getAuthorBadge(t.author)}
            </div>
            <p class="text-xs text-slate-500 mt-1 line-clamp-1">${t.desc}</p>
            <p class="text-xs text-slate-400 mt-1">Prazo: <strong class="text-slate-600">${formatDateBR(t.date)}</strong></p>
          </div>
        </div>

        <div class="flex items-center gap-1 shrink-0">
          <button onclick="openTaskModal(${t.id})" title="Editar" class="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button onclick="deleteTask(${t.id})" title="Excluir" class="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    `).join("");
  }

  const upcomingEl = document.getElementById("dashboard-upcoming");
  const pendingSorted = tasks
    .filter(t => !t.completed)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  if (pendingSorted.length === 0) {
    upcomingEl.innerHTML = `<p class="text-xs text-slate-400 py-3">Todas as tarefas estão concluídas!</p>`;
  } else {
    upcomingEl.innerHTML = pendingSorted.map(t => `
      <div class="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
        <div class="min-w-0 pr-2">
          <p class="text-xs font-semibold text-slate-800 truncate">${t.title}</p>
          <p class="text-xs text-slate-400">${formatDateBR(t.date)}</p>
        </div>
        ${getPriorityBadge(t.priority)}
      </div>
    `).join("");
  }
}

function renderTasksPage() {
  const grid = document.getElementById("tasks-cards-grid");
  const filtered = tasks.filter(t => {
    if (currentFilter === "pending" && t.completed) return false;
    if (currentFilter === "completed" && !t.completed) return false;
    if (currentFilter === "Alta" && t.priority !== "Alta") return false;
    if (currentCategory !== "all" && t.category !== currentCategory) return false;
    if (searchQuery) {
      const hay = `${t.title} ${t.desc} ${t.category} ${t.priority} ${t.author || ""}`.toLowerCase();
      if (!hay.includes(searchQuery)) return false;
    }
    return true;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full bg-white p-10 rounded-2xl border border-slate-200 text-center">
        <p class="text-sm font-bold text-slate-700">Nenhuma tarefa encontrada para este filtro</p>
        <p class="text-xs text-slate-400 mt-1">Experimente limpar a busca ou adicionar uma nova atividade.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(t => `
    <div class="bg-white rounded-2xl border ${t.completed ? 'border-slate-200/70 bg-slate-50/60' : 'border-slate-200/90 hover:border-purple-300 shadow-xs hover:shadow-md'} p-5 flex flex-col justify-between transition-all">
      <div>
        <div class="flex items-center justify-between gap-2 mb-3">
          <div class="flex flex-wrap items-center gap-1.5">
            ${getPriorityBadge(t.priority)}
            ${getCategoryBadge(t.category)}
          </div>
          <span class="text-xs font-medium ${t.completed ? 'text-emerald-600' : 'text-slate-400'}">
            ${t.completed ? '✓ Concluída' : 'Pendente'}
          </span>
        </div>

        <h3 class="text-base font-bold ${t.completed ? 'line-through text-slate-400' : 'text-slate-900'}">${t.title}</h3>
        <p class="text-xs text-slate-500 mt-1.5 leading-relaxed">${t.desc}</p>
        <div class="mt-3">
          ${getAuthorBadge(t.author)}
        </div>
      </div>

      <div class="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 text-xs text-slate-500">
          <svg class="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span>${formatDateBR(t.date)}</span>
        </div>

        <div class="flex items-center gap-1.5">
          <button
            onclick="toggleTask(${t.id})"
            class="px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${t.completed ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white'}"
          >
            ${t.completed ? 'Reabrir' : 'Concluir'}
          </button>
          <button
            onclick="openTaskModal(${t.id})"
            class="p-1.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 transition-colors cursor-pointer"
            title="Editar Tarefa"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
            </svg>
          </button>
          <button
            onclick="deleteTask(${t.id})"
            class="p-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
            title="Excluir Tarefa"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  `).join("");
}

function selectCalendarDate(dateStr) {
  selectedCalendarDate = dateStr;
  const mKey = dateStr.slice(0, 7);
  if (AVAILABLE_MONTHS.some(m => m.key === mKey)) {
    currentCalendarMonthKey = mKey;
  }
  renderCalendar();
}

function jumpToCalendarMonth(monthKey) {
  if (!AVAILABLE_MONTHS.some(m => m.key === monthKey)) return;
  currentCalendarMonthKey = monthKey;
  if (!selectedCalendarDate.startsWith(monthKey)) {
    selectedCalendarDate = `${monthKey}-01`;
  }
  renderCalendar();
}

function changeCalendarMonth(delta) {
  const idx = AVAILABLE_MONTHS.findIndex(m => m.key === currentCalendarMonthKey);
  if (idx === -1) return;
  const nextIdx = idx + delta;
  if (nextIdx >= 0 && nextIdx < AVAILABLE_MONTHS.length) {
    jumpToCalendarMonth(AVAILABLE_MONTHS[nextIdx].key);
  }
}

function renderCalendar() {
  const monthObj = AVAILABLE_MONTHS.find(m => m.key === currentCalendarMonthKey) || AVAILABLE_MONTHS[0];
  const { year, month, label, key } = monthObj;

  const titleEl = document.getElementById("calendar-month-title");
  if (titleEl) titleEl.textContent = label;

  const selectEl = document.getElementById("calendar-month-select");
  if (selectEl) {
    if (selectEl.options.length !== AVAILABLE_MONTHS.length) {
      selectEl.innerHTML = AVAILABLE_MONTHS.map(m =>
        `<option value="${m.key}">${m.label}</option>`
      ).join("");
    }
    selectEl.value = key;
  }

  const idx = AVAILABLE_MONTHS.findIndex(m => m.key === key);
  const prevBtn = document.getElementById("btn-prev-month");
  const nextBtn = document.getElementById("btn-next-month");
  if (prevBtn) {
    prevBtn.disabled = idx <= 0;
    prevBtn.style.opacity = idx <= 0 ? "0.4" : "1";
  }
  if (nextBtn) {
    nextBtn.disabled = idx >= AVAILABLE_MONTHS.length - 1;
    nextBtn.style.opacity = idx >= AVAILABLE_MONTHS.length - 1 ? "0.4" : "1";
  }

  const grid = document.getElementById("calendar-days-grid");
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  let html = "";

  for (let empty = 0; empty < firstWeekday; empty++) {
    html += `<div class="h-14 rounded-2xl bg-slate-50/30 border border-transparent"></div>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayTasks = tasks.filter(t => t.date === dStr);
    const isSelected = selectedCalendarDate === dStr;
    const isToday = dStr === "2026-11-12";

    const dotsHtml = dayTasks.slice(0, 3).map(t =>
      `<span class="w-1.5 h-1.5 rounded-full ${t.completed ? 'bg-blue-500' : 'bg-purple-600'}"></span>`
    ).join("");

    html += `
      <button
        onclick="selectCalendarDate('${dStr}')"
        class="h-14 rounded-2xl p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer ${
          isSelected
            ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white border-transparent shadow-md shadow-blue-500/20'
            : isToday
            ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
            : 'bg-slate-50/70 hover:bg-slate-100 border-slate-200/60 text-slate-700'
        }"
      >
        <span class="text-xs font-semibold">${day}</span>
        <div class="flex items-center gap-1">
          ${dotsHtml}
          ${dayTasks.length > 0 ? `<span class="text-xs ${isSelected ? 'text-blue-100' : 'text-slate-400'}">(${dayTasks.length})</span>` : ''}
        </div>
      </button>
    `;
  }
  grid.innerHTML = html;

  document.getElementById("selected-date-title").textContent = formatDateBR(selectedCalendarDate);
  const dayListEl = document.getElementById("calendar-day-tasks");
  const tasksForDay = tasks.filter(t => t.date === selectedCalendarDate);

  if (tasksForDay.length === 0) {
    dayListEl.innerHTML = `
      <div class="p-6 rounded-2xl bg-slate-50 border border-dashed border-slate-200 text-center">
        <p class="text-xs font-semibold text-slate-600">Nenhuma atividade para este dia</p>
        <p class="text-xs text-slate-400 mt-1">Clique em "+ Agendar" acima para criar uma tarefa em ${formatDateBR(selectedCalendarDate)}.</p>
      </div>
    `;
  } else {
    dayListEl.innerHTML = tasksForDay.map(t => `
      <div class="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-2">
        <div class="flex items-start gap-2.5 min-w-0">
          <button
            onclick="toggleTask(${t.id})"
            class="mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 cursor-pointer ${t.completed ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 bg-white'}"
          >
            ${t.completed ? '✓' : ''}
          </button>
          <div class="min-w-0">
            <p class="text-xs font-bold ${t.completed ? 'line-through text-slate-400' : 'text-slate-800'}">${t.title}</p>
            <div class="flex flex-wrap items-center gap-1.5 mt-1">
              ${getPriorityBadge(t.priority)}
              ${getCategoryBadge(t.category)}
              ${getAuthorBadge(t.author)}
            </div>
          </div>
        </div>
        <button onclick="openTaskModal(${t.id})" class="text-xs font-semibold text-blue-600 hover:underline shrink-0 cursor-pointer">Editar</button>
      </div>
    `).join("");
  }
}

function renderAnalytics() {
  const completedCount = tasks.filter(t => t.completed).length;
  const weeklyData = [
    { day: "Seg", planned: 4, done: 3 },
    { day: "Ter", planned: 5, done: 4 },
    { day: "Qua", planned: 3, done: 3 },
    { day: "Qui", planned: Math.max(3, tasks.length - 4), done: Math.min(completedCount, 5) },
    { day: "Sex", planned: 4, done: 2 },
    { day: "Sáb", planned: 2, done: 2 },
    { day: "Dom", planned: 1, done: 1 }
  ];

  const maxVal = 6;
  const barChartEl = document.getElementById("weekly-bar-chart");
  barChartEl.innerHTML = weeklyData.map(d => {
    const plannedH = Math.min(100, Math.round((d.planned / maxVal) * 100));
    const doneH = Math.min(100, Math.round((d.done / maxVal) * 100));
    return `
      <div class="flex-1 flex flex-col items-center h-full justify-end group">
        <div class="w-full flex items-end justify-center gap-1.5 h-36">
          <div class="w-3 sm:w-4 bg-gradient-to-t from-blue-600 to-purple-600 rounded-t-lg transition-all duration-500" style="height: ${doneH}%" title="Concluídas: ${d.done}"></div>
          <div class="w-3 sm:w-4 bg-purple-200 rounded-t-lg transition-all duration-500" style="height: ${plannedH}%" title="Planejadas: ${d.planned}"></div>
        </div>
        <span class="text-xs font-semibold text-slate-500 mt-2">${d.day}</span>
      </div>
    `;
  }).join("");

  const priorities = [
    { label: "Alta Prioridade", key: "Alta", color: "from-rose-500 to-purple-600" },
    { label: "Média Prioridade", key: "Média", color: "from-purple-500 to-indigo-600" },
    { label: "Baixa Prioridade", key: "Baixa", color: "from-blue-500 to-cyan-500" }
  ];

  const total = Math.max(1, tasks.length);
  document.getElementById("priority-bars-container").innerHTML = priorities.map(p => {
    const subset = tasks.filter(t => t.priority === p.key);
    const done = subset.filter(t => t.completed).length;
    const pct = Math.round((subset.length / total) * 100);
    return `
      <div>
        <div class="flex items-center justify-between text-xs mb-1">
          <span class="font-semibold text-slate-700">${p.label}</span>
          <span class="text-slate-500"><strong>${subset.length}</strong> tarefas (${done} concluídas • ${pct}%)</span>
        </div>
        <div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full bg-gradient-to-r ${p.color} rounded-full transition-all duration-500" style="width: ${pct}%"></div>
        </div>
      </div>
    `;
  }).join("");

  const allCategories = getAllCategories();
  document.getElementById("category-breakdown-grid").innerHTML = allCategories.map(cat => {
    const catTasks = tasks.filter(t => t.category === cat);
    const catDone = catTasks.filter(t => t.completed).length;
    return `
      <div class="p-3 rounded-2xl bg-slate-50 border border-slate-200/60">
        <span class="text-xs font-bold text-slate-800">${cat}</span>
        <p class="text-xs text-slate-500 mt-0.5">${catDone}/${catTasks.length} concluídas</p>
      </div>
    `;
  }).join("");
}

function renderAll() {
  populateCategoryDropdowns();
  renderKPIs();
  renderDashboard();
  renderTasksPage();
  renderCalendar();
  renderAnalytics();
}

document.addEventListener("DOMContentLoaded", renderAll);
