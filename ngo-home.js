(function () {
  function requireFoundation(user) {
    if (!user || user.role !== "foundation") {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  function renderIssues() {
    const root = document.getElementById("ngoIssues");
    const issues = window.CareConnectData.getIssues();
    root.innerHTML = "";

    if (!issues.length) {
      root.innerHTML = "<p class='small'>No issues in queue.</p>";
      return;
    }

    issues.forEach(issue => {
      const item = document.createElement("article");
      item.className = "item";
      item.innerHTML = `
        <div class="item-head">
          <strong>${issue.title}</strong>
          <span class="badge">Votes: ${issue.votes || 0}</span>
        </div>
        <p class="small">${issue.category} | Status: <strong class="status-${issue.status}">${issue.status}</strong></p>
        <p>${issue.description}</p>
        <div class="inline">
          <button class="btn btn-muted" data-status="open" data-id="${issue.id}">Mark Open</button>
          <button class="btn btn-muted" data-status="in-progress" data-id="${issue.id}">In Progress</button>
          <button class="btn btn-primary" data-status="resolved" data-id="${issue.id}">Resolve</button>
        </div>
      `;
      root.appendChild(item);
    });

    root.querySelectorAll("button[data-id]").forEach(btn => {
      btn.addEventListener("click", () => {
        window.CareConnectData.updateIssueStatus(btn.dataset.id, btn.dataset.status);
        renderIssues();
      });
    });
  }

  function renderDonations() {
    const root = document.getElementById("donationList");
    const donations = window.CareConnectData.getDonations();
    root.innerHTML = "";

    if (!donations.length) {
      root.innerHTML = "<p class='small'>No donations yet.</p>";
      return;
    }

    donations.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).forEach(don => {
      const item = document.createElement("article");
      item.className = "item";
      item.innerHTML = `
        <div class="item-head">
          <strong>INR ${Number(don.amount || 0).toLocaleString()}</strong>
          <span class="small">${new Date(don.createdAt).toLocaleString()}</span>
        </div>
        <p class="small">From: ${don.volunteerName || "Anonymous"}</p>
        <p class="small">Note: ${don.note || "-"}</p>
      `;
      root.appendChild(item);
    });
  }

  function renderNgos() {
    const root = document.getElementById("ngoCards");
    const ngos = window.CareConnectData.getNgos();
    root.innerHTML = "";

    ngos.forEach(ngo => {
      const card = document.createElement("article");
      card.className = "ngo-card";
      card.innerHTML = `
        <h4>${ngo.name}</h4>
        <p class="small"><strong>Type:</strong> ${ngo.type}</p>
        <p class="small"><strong>Volunteers:</strong> ${ngo.volunteersCount}</p>
        <p class="small"><strong>Website:</strong> <a href="${ngo.website}" target="_blank" rel="noopener noreferrer">${ngo.website}</a></p>
        <p class="small"><strong>Instagram:</strong> ${ngo.social?.instagram || "-"}</p>
      `;
      root.appendChild(card);
    });
  }

  function init() {
    window.CareConnectData.ensureSeedData();
    const user = window.CareConnectData.getCurrentUser();
    if (!requireFoundation(user)) return;

    document.getElementById("userMeta").textContent = `${user.name || "Foundation"} (${user.email || ""})`;
    document.getElementById("logoutBtn").addEventListener("click", window.CareConnectData.logout);

    renderIssues();
    renderDonations();
    renderNgos();
  }

  document.addEventListener("DOMContentLoaded", init);
})();