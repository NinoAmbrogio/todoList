const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const storageKey = "todo.it.v1";

// Stato + persistenza
const state = {
  items: [],
  filter: "tutte" // "tutte" | "attive" | "completate"
};

const save = () => {
  localStorage.setItem(storageKey, JSON.stringify(state));
};

const load = () => {
  try {
    const s = JSON.parse(localStorage.getItem(storageKey));
    if (s && Array.isArray(s.items)) {
      state.items = s.items;
      state.filter = s.filter || "tutte";
    }
  } catch (e) {
    console.error("loading error", e);
  }
};

// Render
function render() {
  const list = $("#list");
  list.innerHTML = "";

  // evidenzia filtro attivo
  $$(".filter").forEach(btn => {
    btn.setAttribute("aria-pressed", btn.dataset.filter === state.filter ? "true" : "false");
  });

  // filtra
  const visible = state.items.filter(it => {
    if (state.filter === "attive") return !it.done;
    if (state.filter === "completate") return it.done;
    return true; // tutte
  });

  // stato "vuoto"
  $("#empty").hidden = visible.length !== 0;

  for (const it of visible) {
    const li = document.createElement("li");
    li.className = "item" + (it.done ? " done" : "");
    li.dataset.id = it.id;

    const chk = document.createElement("input");
    chk.type = "checkbox";
    chk.className = "chk";
    chk.checked = it.done;
    chk.title = it.done ? "Segna come attiva" : "Segna come completata";
    chk.addEventListener("change", () => toggle(it.id));

    const txt = document.createElement("div");
    txt.className = "txt";
    txt.textContent = it.text;
    txt.title = "Doppio clic per modificare";
    txt.addEventListener("dblclick", () => startEdit(txt, it));

    const actions = document.createElement("div");
    actions.className = "actions";

    const delBtn = document.createElement("button");
    delBtn.className = "btn-icon danger";
    delBtn.textContent = "Elimina";
    delBtn.addEventListener("click", () => removeItem(it.id));

    actions.append(delBtn);
    li.append(chk, txt, actions);
    list.append(li);
  }

  const rimanenti = state.items.filter(i => !i.done).length;
  $("#counter").textContent = `${rimanenti} rimanenti`;

  save();
}

// Azioni
function add(text) {
  const t = (text || "").trim();
  if (!t) return;
  state.items.unshift({
    id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random()),
    text: t,
    done: false,
    createdAt: Date.now()
  });
  $("#new").value = "";
  render();
}

function toggle(id) {
  const it = state.items.find(x => x.id === id);
  if (!it) return;
  it.done = !it.done;
  render();
}

function removeItem(id) {
  const i = state.items.findIndex(x => x.id === id);
  if (i >= 0) {
    state.items.splice(i, 1);
    render();
  }
}

function cleanEmpty() {
  const before = state.items.length;
  state.items = state.items.filter(i => !i.done);
  if (state.items.length !== before) render();
}

function startEdit(node, it) {
  node.setAttribute("contenteditable", "true");
  node.focus();
  placeCaretAtEnd(node);

  const finish = (commit) => {
    node.removeAttribute("contenteditable");
    node.removeEventListener("keydown", onKey);
    node.removeEventListener("blur", onBlur);
    if (commit) {
      const nuovo = node.textContent.trim();
      if (nuovo) {
        it.text = nuovo;
      } else {
        removeItem(it.id); // testo vuoto = elimina
        return;
      }
      render();
    } else {
      node.textContent = it.text; // annulla
    }
  };

  const onKey = (e) => {
    if (e.key === "Enter") { e.preventDefault(); finish(true); }
    if (e.key === "Escape") { e.preventDefault(); finish(false); }
  };
  const onBlur = () => finish(true);

  node.addEventListener("keydown", onKey);
  node.addEventListener("blur", onBlur);
}

function placeCaretAtEnd(el) {
  const range = document.createRange();
  range.selectNodeContents(el);
  range.collapse(false);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
}

// Eventi UI
$("#add").addEventListener("click", () => add($("#new").value));
$("#new").addEventListener("keydown", (e) => {
  if (e.key === "Enter") add(e.currentTarget.value);
});

$$(".filter").forEach(btn => {
  btn.addEventListener("click", () => {
    state.filter = btn.dataset.filter; // "tutte" | "attive" | "completate"
    render();
  });
});

$("#cleanEmpty").addEventListener("click", cleanEmpty);

// Init
load();
render();