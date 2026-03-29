(function () {
  function requireFoundation(user) {
    if (!user || user.role !== "foundation") {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  function priorityBucket(issue) {
    if (issue?.votePriority) return String(issue.votePriority).toLowerCase();
    const votes = Number(issue?.votes || 0);
    if (votes >= 20) return "critical";
    if (votes >= 10) return "high";
    if (votes >= 5) return "medium";
    return "low";
  }

  function parseSortSelection(value) {
    const selected = String(value || "priority_desc");
    const [sortByRaw, sortOrderRaw] = selected.split("_");
    const sortBy = ["priority", "votes", "newest", "oldest"].includes(sortByRaw) ? sortByRaw : "priority";
    const sortOrder = sortOrderRaw === "asc" ? "asc" : "desc";
    return { sortBy, sortOrder };
  }

  function setOptions(select, options, placeholder) {
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);

    options.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    });
  }

  async function setupFilters() {
    const categorySet = new Set((await window.CareConnectData.getIssues()).map((issue) => issue.category));
    setOptions(document.getElementById("ngoFilterCategory"), Array.from(categorySet).sort(), "All categories");
  }

  async function renderIssues(user) {
    const root = document.getElementById("ngoIssues");
    const filterCategory = document.getElementById("ngoFilterCategory").value;
    const filterPriority = document.getElementById("ngoFilterPriority").value;
    const filterStatus = document.getElementById("ngoFilterStatus").value;
    const sortValue = document.getElementById("ngoSortBy").value;
    const mineOnly = document.getElementById("mineOnly").checked;
    const { sortBy, sortOrder } = parseSortSelection(sortValue);

    const issues = (await window.CareConnectData.getIssues({ sortBy, sortOrder }))
      .filter((issue) => !filterCategory || issue.category === filterCategory)
      .filter((issue) => !filterPriority || priorityBucket(issue) === filterPriority)
      .filter((issue) => !filterStatus || issue.status === filterStatus)
      .filter((issue) => {
        if (!mineOnly) return true;
        return issue.claimedBy && issue.claimedBy.ngoUid === user.uid;
      });

    root.innerHTML = "";

    if (!issues.length) {
      root.innerHTML = "<p class='small'>No issues in queue.</p>";
      return;
    }

    issues.forEach((issue) => {
      const item = document.createElement("article");
      item.className = "item";
      const mine = issue.claimedBy && issue.claimedBy.ngoUid === user.uid;
      const claimedLabel = issue.claimedBy && issue.claimedBy.ngoName ? `Claimed by ${issue.claimedBy.ngoName}` : "Unclaimed";
      const imageUrl = issue.photoUrl || issue.photoDataUrl;
      const photo = imageUrl ? `<img class='photo-proof' src='${imageUrl}' alt='Issue proof' />` : "";
      const detailsId = `ngo-details-${issue.id}`;
      const historyMarkup = (issue.history || [])
        .slice(-5)
        .reverse()
        .map((entry) => {
          const date = new Date(entry.createdAt).toLocaleString();
          return `<li><strong>${entry.event}</strong> - ${entry.note || ""} <span class='small'>(${date})</span></li>`;
        })
        .join("");

      item.innerHTML = `
        <div class="item-head">
          <strong>${issue.title}</strong>
          <span class="badge priority-${priorityBucket(issue)}">${priorityBucket(issue).toUpperCase()} priority (${issue.votes || 0} votes)</span>
        </div>
        <p class="small">${issue.category} | Status: <strong class="status-${issue.status}">${issue.status}</strong></p>
        <p class="small"><strong>Location:</strong> ${window.CareConnectData.getLocationLabel(issue)} | <strong>Votes:</strong> ${issue.votes || 0}</p>
        <p class="small"><strong>AI:</strong> ${issue.ai?.autoCategory || issue.category} | Score ${issue.ai?.priority || 0}</p>
        <p class="small"><strong>Ownership:</strong> ${claimedLabel}</p>
        <p>${issue.description}</p>
        ${photo}
        <div class="inline">
          <button class="btn btn-muted" data-view="${issue.id}">View Details</button>
          ${!issue.claimedBy || !issue.claimedBy.ngoUid ? `<button class="btn btn-primary" data-claim="${issue.id}">Claim Issue</button>` : ""}
          ${mine && issue.status === window.CareConnectData.STATUS.PLANNED ? `<button class="btn btn-muted" data-status="in-progress" data-id="${issue.id}">Start Work</button>` : ""}
          ${mine && issue.status === window.CareConnectData.STATUS.IN_PROGRESS ? `<button class="btn btn-primary" data-status="completed" data-id="${issue.id}">Mark Complete</button>` : ""}
        </div>
        <div class="details" id="${detailsId}">
          <p class="small"><strong>Reasoning:</strong> ${issue.ai?.reasoning || "No reasoning available."}</p>
          <ul class="timeline">${historyMarkup || "<li class='small'>No timeline events yet.</li>"}</ul>
          ${mine ? `
            <form class="progress-form" data-progress="${issue.id}">
              <div class="inline">
                <input data-progress-text="${issue.id}" type="text" placeholder="Add progress update" />
                <button class="btn btn-muted" type="submit">Post Update</button>
              </div>
            </form>
          ` : ""}
        </div>
      `;
      root.appendChild(item);
    });

    root.querySelectorAll("button[data-view]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const section = document.getElementById(`ngo-details-${btn.dataset.view}`);
        if (section) {
          section.classList.toggle("show");
        }
      });
    });

    root.querySelectorAll("button[data-claim]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await window.CareConnectData.claimIssue(btn.dataset.claim);
          await renderIssues(user);
          await renderImpact();
        } catch (error) {
          alert(error.message || "Claim failed.");
        }
      });
    });

    root.querySelectorAll("button[data-id]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          await window.CareConnectData.updateIssueStatus(btn.dataset.id, btn.dataset.status);
          await renderIssues(user);
          await renderImpact();
        } catch (error) {
          alert(error.message || "Status update failed.");
        }
      });
    });

    root.querySelectorAll("form[data-progress]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const issueId = form.dataset.progress;
        const textField = form.querySelector(`input[data-progress-text='${issueId}']`);
        try {
          await window.CareConnectData.addProgressUpdate(issueId, textField.value);
          await renderIssues(user);
        } catch (error) {
          alert(error.message || "Progress update failed.");
        }
      });
    });
  }

  async function renderDonations() {
    const root = document.getElementById("donationList");
    const donations = await window.CareConnectData.getDonations();
    root.innerHTML = "";

    if (!donations.length) {
      root.innerHTML = "<p class='small'>No donations yet.</p>";
      return;
    }

    donations
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .forEach((don) => {
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

  async function renderNgos() {
    const root = document.getElementById("ngoCards");
    const ngos = await window.CareConnectData.getNgos();
    root.innerHTML = "";

    ngos.forEach((ngo) => {
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

  async function renderImpact() {
    const stats = await window.CareConnectData.getImpactStats();
    document.getElementById("impactSolved").textContent = String(stats.solvedIssues || 0);
    document.getElementById("impactNgos").textContent = String(stats.activeNgos || 0);
    document.getElementById("impactRate").textContent = `${stats.completionRate || 0}%`;
  }

  async function init() {
    await window.CareConnectData.ensureSeedData();
    const user = window.CareConnectData.getCurrentUser();
    if (!requireFoundation(user)) return;

    document.getElementById("userMeta").textContent = `${user.name || "Foundation"} (${user.email || ""})`;
    document.getElementById("logoutBtn").addEventListener("click", () => window.CareConnectData.logout());

    await setupFilters();
    await renderIssues(user);
    await renderDonations();
    await renderNgos();
    await renderImpact();

    ["ngoFilterCategory", "ngoFilterPriority", "ngoFilterStatus", "ngoSortBy", "mineOnly"].forEach((id) => {
      document.getElementById(id).addEventListener("change", () => {
        renderIssues(user).catch((error) => alert(error.message || "Failed to load issues."));
      });
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error(error);
      alert(error.message || "Failed to initialize NGO dashboard.");
    });
  });
})();
