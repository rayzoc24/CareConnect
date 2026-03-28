(function () {
  function readPhotoAsDataUrl(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve("");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image."));
      reader.readAsDataURL(file);
    });
  }

  function toTags(raw) {
    return String(raw || "")
      .split(/[,\s]+/)
      .map(tag => tag.trim())
      .filter(Boolean)
      .map(tag => tag.startsWith("#") ? tag : `#${tag}`);
  }

  function requireVolunteer(user) {
    if (!user || user.role !== "volunteer") {
      window.location.href = "index.html";
      return false;
    }
    return true;
  }

  function renderNgos(ngos) {
    const ngoSelect = document.getElementById("issueNgo");
    const donateNgo = document.getElementById("donateNgo");
    const ngoList = document.getElementById("ngoList");

    ngoSelect.innerHTML = "<option value=''>Select NGO</option>";
    donateNgo.innerHTML = "<option value=''>Select NGO</option>";
    ngoList.innerHTML = "";

    ngos.forEach(ngo => {
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

  function renderIssues(user) {
    const issuesList = document.getElementById("issuesList");
    const issues = window.CareConnectData.getIssues()
      .sort((a, b) => window.CareConnectData.scoreIssue(b) - window.CareConnectData.scoreIssue(a));

    issuesList.innerHTML = "";
    if (!issues.length) {
      issuesList.innerHTML = "<p class='small'>No issues yet.</p>";
      return;
    }

    issues.forEach(issue => {
      const item = document.createElement("article");
      item.className = "item";
      const tags = (issue.hashtags || []).map(tag => `<span class='tag'>#${tag.replace(/^#/, "")}</span>`).join("");
      const photo = issue.photoDataUrl ? `<img class='photo-proof' src='${issue.photoDataUrl}' alt='Issue proof' />` : "";
      item.innerHTML = `
        <div class="item-head">
          <strong>${issue.title}</strong>
          <span class="badge ${issue.status === "open" ? "badge-warn" : ""}">${issue.status}</span>
        </div>
        <p class="small"><strong>Category:</strong> ${issue.category}</p>
        <p>${issue.description}</p>
        <div class="tags">${tags}</div>
        ${photo}
        <div class="inline" style="margin-top:0.6rem;">
          <button class="btn btn-muted" data-vote="${issue.id}">Vote (${issue.votes || 0})</button>
        </div>
      `;
      issuesList.appendChild(item);
    });

    issuesList.querySelectorAll("button[data-vote]").forEach(btn => {
      btn.addEventListener("click", () => {
        try {
          window.CareConnectData.voteIssue(btn.dataset.vote, user.uid);
          renderIssues(user);
        } catch (error) {
          alert(error.message);
        }
      });
    });
  }

  async function init() {
    window.CareConnectData.ensureSeedData();
    const user = window.CareConnectData.getCurrentUser();
    if (!requireVolunteer(user)) return;

    document.getElementById("userMeta").textContent = `${user.name || "Volunteer"} (${user.email || ""})`;
    document.getElementById("logoutBtn").addEventListener("click", window.CareConnectData.logout);

    const ngos = window.CareConnectData.getNgos();
    renderNgos(ngos);
    renderIssues(user);

    const issueForm = document.getElementById("issueForm");
    issueForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const statusEl = document.getElementById("issueFormStatus");
      try {
        const file = document.getElementById("issuePhoto").files[0];
        const photoDataUrl = await readPhotoAsDataUrl(file);

        window.CareConnectData.addIssue({
          title: document.getElementById("issueTitle").value,
          category: document.getElementById("issueCategory").value,
          ngoId: document.getElementById("issueNgo").value,
          description: document.getElementById("issueDescription").value,
          hashtags: toTags(document.getElementById("issueTags").value),
          photoDataUrl,
          createdByUid: user.uid,
          createdByName: user.name
        });

        statusEl.textContent = "Issue created successfully.";
        issueForm.reset();
        renderIssues(user);
      } catch (error) {
        statusEl.textContent = error.message || "Failed to create issue.";
      }
    });

    const donateForm = document.getElementById("donateForm");
    donateForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const statusEl = document.getElementById("donateStatus");
      try {
        window.CareConnectData.donate({
          ngoId: document.getElementById("donateNgo").value,
          volunteerUid: user.uid,
          volunteerName: user.name,
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

  document.addEventListener("DOMContentLoaded", init);
})();