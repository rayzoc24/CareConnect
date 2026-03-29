(function () {
  const LOCATION_TREE = {
    Maharashtra: {
      Pune: ["Sector 4", "Hadapsar", "Kothrud"],
      Mumbai: ["Andheri", "Kurla", "Dadar"]
    },
    Karnataka: {
      "Bengaluru Urban": ["Yelahanka", "Whitefield", "Jayanagar"],
      Mysuru: ["Nazarbad", "Hebbal", "Vijayanagar"]
    },
    Delhi: {
      "New Delhi": ["Karol Bagh", "Dwarka", "Rohini"]
    }
  };

  function toTags(raw) {
    return String(raw || "")
      .split(/[,\s]+/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .map((tag) => (tag.startsWith("#") ? tag : `#${tag}`));
  }

  function requireVolunteer(user) {
    if (!user || user.role !== "volunteer") {
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

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function setOptions(select, options, placeholder) {
    select.innerHTML = "";
    const first = document.createElement("option");
    first.value = "";
    first.textContent = placeholder;
    select.appendChild(first);

    options.forEach((item) => {
      const option = document.createElement("option");
      option.value = item;
      option.textContent = item;
      select.appendChild(option);
    });
  }

  function normalizeText(value) {
    return String(value || "").trim().toLowerCase();
  }

  function getCategoryHints(category) {
    const key = normalizeText(category);
    const map = {
      infrastructure: ["infrastructure", "environment", "safety", "urban"],
      education: ["education", "learning", "students", "school"],
      healthcare: ["healthcare", "health", "medical", "clinic"],
      food: ["food", "nutrition", "hunger", "ration"],
      environment: ["environment", "cleanliness", "waste", "water"],
      safety: ["safety", "emergency", "health", "infrastructure"],
      other: ["community", "support"]
    };
    return map[key] || [key];
  }

  function computeNgoCategoryScore(ngo, category) {
    const categoryKey = normalizeText(category);
    const ngoType = normalizeText(ngo.type);
    const focus = Array.isArray(ngo.focusCategories) ? ngo.focusCategories.map(normalizeText) : [];
    const mission = normalizeText(ngo.mission);
    const hints = getCategoryHints(category);

    let score = 0;

    if (focus.includes(categoryKey)) score += 60;
    if (ngoType === categoryKey) score += 45;
    if (hints.includes(ngoType)) score += 24;
    if (hints.some((hint) => focus.includes(hint))) score += 30;
    if (mission.includes(categoryKey)) score += 14;
    if (hints.some((hint) => mission.includes(hint))) score += 8;

    score += Math.min(8, Math.floor(Number(ngo.volunteersCount || 0) / 80));
    return score;
  }

  function pickDefaultNgoForCategory(ngos, category) {
    if (!category || !Array.isArray(ngos) || ngos.length === 0) return "";

    let bestNgo = null;
    let bestScore = -1;

    ngos.forEach((ngo) => {
      const score = computeNgoCategoryScore(ngo, category);
      if (score > bestScore) {
        bestScore = score;
        bestNgo = ngo;
      }
    });

    return bestNgo ? bestNgo.id : "";
  }

  function setupIssueNgoDefaulting(ngos) {
    const issueCategory = document.getElementById("issueCategory");
    const issueNgo = document.getElementById("issueNgo");

    const applyDefaultNgo = () => {
      const defaultNgoId = pickDefaultNgoForCategory(ngos, issueCategory.value);
      if (defaultNgoId) {
        issueNgo.value = defaultNgoId;
      }
    };

    issueCategory.addEventListener("change", applyDefaultNgo);
    applyDefaultNgo();
  }

  function setupLocationSelectors() {
    const stateSelect = document.getElementById("issueState");
    const districtSelect = document.getElementById("issueDistrict");
    const areaSelect = document.getElementById("issueArea");
    const filterState = document.getElementById("filterState");

    const states = Object.keys(LOCATION_TREE);
    setOptions(stateSelect, states, "State");
    setOptions(filterState, states, "All states");
    setOptions(districtSelect, [], "District");
    setOptions(areaSelect, [], "Area");

    stateSelect.addEventListener("change", () => {
      const districts = Object.keys(LOCATION_TREE[stateSelect.value] || {});
      setOptions(districtSelect, districts, "District");
      setOptions(areaSelect, [], "Area");
    });

    districtSelect.addEventListener("change", () => {
      const areas = LOCATION_TREE[stateSelect.value]?.[districtSelect.value] || [];
      setOptions(areaSelect, areas, "Area");
    });
  }

  function setupFilterOptions() {
    const filterCategory = document.getElementById("filterCategory");
    const categories = ["Infrastructure", "Education", "Healthcare", "Food", "Environment", "Safety", "Other"];
    setOptions(filterCategory, categories, "All categories");
  }

  function setupCreateIssueToggle() {
    const panel = document.getElementById("issueFormPanel");
    const toggle = document.getElementById("toggleIssueForm");
    toggle.addEventListener("click", () => {
      panel.classList.toggle("show");
      toggle.textContent = panel.classList.contains("show") ? "- Hide Form" : "+ Create Issue";
    });
  }

  function renderNgos(ngos) {
    const ngoSelect = document.getElementById("issueNgo");
    const donateNgo = document.getElementById("donateNgo");
    const ngoList = document.getElementById("ngoList");

    ngoSelect.innerHTML = "<option value=''>Select NGO</option>";
    donateNgo.innerHTML = "<option value=''>Select NGO</option>";
    ngoList.innerHTML = "";

    ngos.forEach((ngo) => {
      const option1 = document.createElement("option");
      option1.value = ngo.id;
      option1.textContent = `${ngo.name} (${ngo.type})`;
      ngoSelect.appendChild(option1);

      const option2 = document.createElement("option");
      option2.value = ngo.id;
      option2.textContent = ngo.name;
      donateNgo.appendChild(option2);

      const card = document.createElement("article");
      card.className = "ngo-card";
      card.innerHTML = `
        <h4>${ngo.name}</h4>
        <p class="small"><strong>Type:</strong> ${ngo.type}</p>
        <p class="small"><strong>Volunteers:</strong> ${ngo.volunteersCount}</p>
        <p class="small">${ngo.mission || ""}</p>
        <p class="small"><strong>Website:</strong> <a href="${ngo.website}" target="_blank" rel="noopener noreferrer">${ngo.website}</a></p>
        <p class="small"><strong>Instagram:</strong> ${ngo.social?.instagram || "-"}</p>
        <p class="small"><strong>X:</strong> ${ngo.social?.x || "-"}</p>
        <p class="small"><strong>Facebook:</strong> ${ngo.social?.facebook || "-"}</p>
      `;
      ngoList.appendChild(card);
    });
  }

  async function renderFoundationWorks() {
    const root = document.getElementById("foundationWorksList");
    const works = (await window.CareConnectData.getIssues())
      .filter((issue) => issue.claimedBy && issue.claimedBy.ngoName)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    root.innerHTML = "";
    if (!works.length) {
      root.innerHTML = "<p class='small'>No foundation work updates yet. Claimed issues will appear here.</p>";
      return;
    }

    works.forEach((issue) => {
      const item = document.createElement("article");
      item.className = "item";
      const latestUpdates = (issue.history || [])
        .slice(-3)
        .reverse()
        .map((entry) => `<li><strong>${escapeHtml(entry.event)}</strong> - ${escapeHtml(entry.note || "")}</li>`)
        .join("");

      item.innerHTML = `
        <div class="item-head">
          <strong>${issue.title}</strong>
          <span class="badge status-${issue.status}">${issue.status}</span>
        </div>
        <p class="small"><strong>Foundation:</strong> ${issue.claimedBy.ngoName}</p>
        <p class="small"><strong>Location:</strong> ${window.CareConnectData.getLocationLabel(issue)}</p>
        <p class="small"><strong>Latest Work:</strong></p>
        <ul class="timeline compact-timeline">${latestUpdates || "<li class='small'>No updates yet.</li>"}</ul>
      `;
      root.appendChild(item);
    });
  }

  async function renderIssues(user) {
    const issuesList = document.getElementById("issuesList");
    const filterCategory = document.getElementById("filterCategory").value;
    const filterPriority = document.getElementById("filterPriority").value;
    const filterState = document.getElementById("filterState").value;
    const sortValue = document.getElementById("filterSort").value;
    const { sortBy, sortOrder } = parseSortSelection(sortValue);

    const issues = (await window.CareConnectData.getIssues({ sortBy, sortOrder }))
      .filter((issue) => !filterCategory || issue.category === filterCategory)
      .filter((issue) => !filterPriority || priorityBucket(issue) === filterPriority)
      .filter((issue) => !filterState || issue.location?.state === filterState);

    issuesList.innerHTML = "";
    if (!issues.length) {
      issuesList.innerHTML = "<p class='small'>No issues yet.</p>";
      return;
    }

    issues.forEach((issue) => {
      const item = document.createElement("article");
      item.className = "item";
      const tags = (issue.hashtags || []).map((tag) => `<span class='tag'>#${tag.replace(/^#/, "")}</span>`).join("");
      const imageUrl = issue.photoUrl || issue.photoDataUrl;
      const photo = imageUrl ? `<img class='photo-proof' src='${imageUrl}' alt='Issue proof' />` : "";
      const bucket = priorityBucket(issue);
      const canRate = issue.status === window.CareConnectData.STATUS.COMPLETED;
      const ratedAlready = Array.isArray(issue.ratings) && issue.ratings.some((entry) => entry.volunteerUid === user.uid);
      const voteAction = issue.votedByMe ? "remove" : "add";
      const voteLabel = issue.votedByMe ? "De-vote" : "Vote";

      const ratingBlock = canRate && !ratedAlready
        ? `
          <form class="rating-form" data-rate-form="${issue.id}">
            <label class="small">Rate resolution quality</label>
            <div class="inline">
              <select data-stars="${issue.id}" required>
                <option value="">Stars</option>
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
              <input data-feedback="${issue.id}" type="text" placeholder="Feedback" />
              <button class="btn btn-primary" type="submit">Submit Rating</button>
            </div>
          </form>
        `
        : "";

      const historyMarkup = (issue.history || [])
        .slice(-4)
        .reverse()
        .map((entry) => {
          const note = escapeHtml(entry.note || "");
          return `<li><strong>${escapeHtml(entry.event)}</strong> - ${note} <span class="small">(${new Date(entry.createdAt).toLocaleString()})</span></li>`;
        })
        .join("");

      item.innerHTML = `
        <div class="item-head">
          <strong>${issue.title}</strong>
          <span class="badge priority-${bucket}">${bucket.toUpperCase()} priority (${issue.votes || 0} votes)</span>
        </div>
        <p class="small"><strong>Category:</strong> ${issue.category} | <strong>Status:</strong> ${issue.status}</p>
        <p class="small"><strong>Location:</strong> ${window.CareConnectData.getLocationLabel(issue)}</p>
        <p class="small"><strong>AI:</strong> ${issue.ai?.autoCategory || issue.category} | Score ${issue.ai?.priority || 0}</p>
        <p>${issue.description}</p>
        <div class="tags">${tags}</div>
        ${photo}
        <div class="inline" style="margin-top:0.6rem;">
          <button class="btn btn-muted" data-vote="${issue.id}" data-vote-action="${voteAction}">${voteLabel} (${issue.votes || 0})</button>
          <button class="btn btn-muted" data-toggle-details="${issue.id}">View Details</button>
        </div>
        <div class="details" id="details-${issue.id}">
          <p class="small"><strong>Reasoning:</strong> ${issue.ai?.reasoning || "No AI note available."}</p>
          <p class="small"><strong>Average Rating:</strong> ${Number(issue.averageRating || 0).toFixed(2)} (${(issue.ratings || []).length} ratings)</p>
          <ul class="timeline">${historyMarkup || "<li class='small'>No updates yet.</li>"}</ul>
          ${ratingBlock}
        </div>
      `;
      issuesList.appendChild(item);
    });

    issuesList.querySelectorAll("button[data-vote]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        try {
          if (btn.dataset.voteAction === "remove") {
            await window.CareConnectData.unvoteIssue(btn.dataset.vote);
          } else {
            await window.CareConnectData.voteIssue(btn.dataset.vote);
          }
          await renderIssues(user);
          await renderFoundationWorks();
        } catch (error) {
          alert(error.message);
        }
      });
    });

    issuesList.querySelectorAll("button[data-toggle-details]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const details = document.getElementById(`details-${btn.dataset.toggleDetails}`);
        if (details) {
          details.classList.toggle("show");
        }
      });
    });

    issuesList.querySelectorAll("form[data-rate-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const issueId = form.dataset.rateForm;
        const stars = form.querySelector(`select[data-stars='${issueId}']`).value;
        const feedback = form.querySelector(`input[data-feedback='${issueId}']`).value;
        try {
          await window.CareConnectData.addIssueRating(issueId, Number(stars), feedback);
          await renderIssues(user);
          await renderFoundationWorks();
        } catch (error) {
          alert(error.message || "Rating failed.");
        }
      });
    });
  }

  async function init() {
    await window.CareConnectData.ensureSeedData();
    const user = window.CareConnectData.getCurrentUser();
    if (!requireVolunteer(user)) return;

    document.getElementById("userMeta").textContent = `${user.name || "Volunteer"} (${user.email || ""})`;
    document.getElementById("logoutBtn").addEventListener("click", () => window.CareConnectData.logout());

    const ngos = await window.CareConnectData.getNgos();
    setupCreateIssueToggle();
    setupLocationSelectors();
    setupFilterOptions();
    renderNgos(ngos);
    setupIssueNgoDefaulting(ngos);
    await renderIssues(user);
    await renderFoundationWorks();

    ["filterCategory", "filterPriority", "filterState", "filterSort"].forEach((id) => {
      const control = document.getElementById(id);
      control.addEventListener("change", () => {
        renderIssues(user).catch((error) => alert(error.message || "Failed to load issues."));
      });
    });

    const issueForm = document.getElementById("issueForm");
    issueForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const statusEl = document.getElementById("issueFormStatus");
      try {
        const file = document.getElementById("issuePhoto").files[0];
        let photoUrl = "";

        if (file) {
          statusEl.textContent = "Uploading image...";
          photoUrl = await window.CareConnectData.uploadIssueImage(file);
        }

        statusEl.textContent = "Creating issue...";

        await window.CareConnectData.addIssue({
          title: document.getElementById("issueTitle").value,
          category: document.getElementById("issueCategory").value,
          ngoId: document.getElementById("issueNgo").value,
          location: {
            state: document.getElementById("issueState").value,
            district: document.getElementById("issueDistrict").value,
            area: document.getElementById("issueArea").value
          },
          description: document.getElementById("issueDescription").value,
          hashtags: toTags(document.getElementById("issueTags").value),
          photoUrl
        });

        statusEl.textContent = "Issue created successfully.";
        issueForm.reset();
        document.getElementById("issueFormPanel").classList.remove("show");
        document.getElementById("toggleIssueForm").textContent = "+ Create Issue";
        await renderIssues(user);
        await renderFoundationWorks();
      } catch (error) {
        statusEl.textContent = error.message || "Failed to create issue.";
      }
    });

    const donateForm = document.getElementById("donateForm");
    donateForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const statusEl = document.getElementById("donateStatus");
      try {
        await window.CareConnectData.donate({
          ngoId: document.getElementById("donateNgo").value,
          amount: Number(document.getElementById("donateAmount").value),
          note: document.getElementById("donateNote").value
        });
        statusEl.textContent = "Donation recorded. Thank you!";
        donateForm.reset();
      } catch (error) {
        statusEl.textContent = error.message || "Donation failed.";
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    init().catch((error) => {
      console.error(error);
      alert(error.message || "Failed to initialize volunteer dashboard.");
    });
  });
})();
