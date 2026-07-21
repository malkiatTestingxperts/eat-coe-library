/* ==========================================================================
   EAT COE — shared site behaviour (hero search, pillar filters, chatbot)
   ========================================================================== */

let allDeliverables = [];
let fuseIndex = null;
let activePillar = "All";

async function loadDeliverables() {
  try {
    const res = await fetch("data/documents.json");
    const data = await res.json();
    allDeliverables = data.documents;
    fuseIndex = new Fuse(allDeliverables, {
      keys: ["title", "pillar", "code", "description", "tags", "owner"],
      threshold: 0.38
    });
  } catch (e) {
    console.error("Could not load deliverables dataset:", e);
  }
}
loadDeliverables();

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

/* ---------------- home hero: search + pillar filter pills ---------------- */
function filterPillar(code, btn) {
  activePillar = code;
  document.querySelectorAll("#filterPills button").forEach(b => b.classList.remove("active"));
  if (btn) btn.classList.add("active");
  runHeroSearch();
}

function runHeroSearch() {
  const box = document.getElementById("heroResults");
  const input = document.getElementById("searchInput");
  if (!box || !input) return;
  const q = input.value.trim();

  let list;
  if (!q) {
    list = activePillar === "All" ? [] : allDeliverables.filter(d => d.pillarCode === activePillar);
  } else if (fuseIndex) {
    list = fuseIndex.search(q).map(r => r.item);
    if (activePillar !== "All") list = list.filter(d => d.pillarCode === activePillar);
  } else {
    list = [];
  }

  if (!q && activePillar === "All") {
    box.classList.remove("show");
    box.innerHTML = "";
    return;
  }

  box.classList.add("show");
  if (list.length === 0) {
    box.innerHTML = `<div class="results-empty">No deliverables match. Try a different pillar or keyword.</div>`;
    return;
  }
  box.innerHTML = list.slice(0, 12).map(renderResultCard).join("");
}

function renderResultCard(doc) {
  const statusClass = doc.status.toLowerCase().replace(/\s+/g, "");
  return `
    <div class="result-card">
      <div class="rc-top">
        <a class="rc-title" href="${doc.url}">${escapeHtml(doc.code)} · ${escapeHtml(doc.title)}</a>
        <span class="chip ${statusClass}">${escapeHtml(doc.status)}</span>
      </div>
      <div class="rc-meta">${escapeHtml(doc.pillar)} · Owner: ${escapeHtml(doc.owner)}</div>
      <p>${escapeHtml(doc.description)}</p>
    </div>`;
}

function initHeroSearch() {
  const input = document.getElementById("searchInput");
  if (!input) return;
  input.addEventListener("input", runHeroSearch);
}

/* ---------------- chatbot ---------------- */
let chatbotOpen = false;

function toggleChatbot() {
  const win = document.getElementById("chatbot-window");
  chatbotOpen = !chatbotOpen;
  win.classList.toggle("open", chatbotOpen);
}

function sendMessage() {
  const input = document.getElementById("chat-input");
  const message = input.value.trim();
  if (message === "") return;
  addUserMessage(message);
  answerFromKnowledgeBase(message);
  input.value = "";
}

function addUserMessage(message) {
  const body = document.getElementById("chat-body");
  body.innerHTML += `<div class="user-message">${escapeHtml(message)}</div>`;
  body.scrollTop = body.scrollHeight;
}

function addBotMessage(html) {
  const body = document.getElementById("chat-body");
  body.innerHTML += `<div class="bot-message">${html}</div>`;
  body.scrollTop = body.scrollHeight;
}

function answerFromKnowledgeBase(keyword) {
  if (!fuseIndex) {
    addBotMessage("Still loading the COE repository — try again in a second.");
    return;
  }
  const results = fuseIndex.search(keyword);
  if (results.length === 0) {
    addBotMessage("I couldn't find a matching deliverable. Try a pillar name (e.g. \"monitoring\"), a deliverable code (e.g. \"3.6\"), or a keyword like \"automation\" or \"defect trend\".");
    return;
  }
  let html = "<b>I found these deliverables:</b><ul>";
  results.slice(0, 5).forEach(r => {
    const doc = r.item;
    html += `<li>📄 <a href="${doc.url}">${escapeHtml(doc.code)} ${escapeHtml(doc.title)}</a> — <span style="color:#5B6B7A">${escapeHtml(doc.status)}</span></li>`;
  });
  html += "</ul>";
  addBotMessage(html);
}

/* ---------------- about modal ---------------- */
function toggleAbout() {
  const overlay = document.getElementById("about-overlay");
  const modal = document.getElementById("about-modal");
  if (!overlay || !modal) return;
  const isOpen = modal.classList.contains("open");
  overlay.classList.toggle("open", !isOpen);
  modal.classList.toggle("open", !isOpen);
}

document.addEventListener("DOMContentLoaded", initHeroSearch);
