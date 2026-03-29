(function () {
  const STATUS = {
    PENDING: "pending",
    PLANNED: "planned",
    IN_PROGRESS: "in-progress",
    COMPLETED: "completed"
  };

  function getApiBase() {
    if (typeof window !== "undefined" && window.location && window.location.protocol === "file:") {
      return "http://localhost:3000";
    }
    return "";
  }

  async function request(path, options) {
    const isFormData = options && options.body instanceof FormData;
    const url = `${getApiBase()}${path}`;

    let response;
    try {
      response = await fetch(url, {
        credentials: "include",
        headers: isFormData ? {} : {
          "Content-Type": "application/json"
        },
        ...(options || {})
      });
    } catch (error) {
      throw new Error("Cannot reach backend. Use http://localhost:3000 and confirm server is running.");
    }

    let data = {};
    try {
      data = await response.json();
    } catch (error) {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.error || "Request failed.");
    }

    return data;
  }

  function scoreIssue(issue) {
    const hashtagsCount = (issue.hashtags || []).length;
    const votesCount = Number(issue.votes || 0);
    const priority = Number(issue.ai?.priority || 0);
    return priority * 1.5 + hashtagsCount * 4 + votesCount * 2;
  }

  function getCurrentUser() {
    try {
      const sessionRaw = sessionStorage.getItem("currentUser");
      if (sessionRaw) {
        return JSON.parse(sessionRaw);
      }
    } catch (error) {
      console.error("Failed reading session currentUser", error);
    }
    return null;
  }

  async function ensureSeedData() {
    await request("/api/ngos");
  }

  async function logout() {
    try {
      await request("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
    } catch (error) {
      console.warn("Logout API warning:", error.message);
    } finally {
      sessionStorage.removeItem("currentUser");
      window.location.href = "index.html";
    }
  }

  async function getNgos() {
    const data = await request("/api/ngos");
    return data.ngos || [];
  }

  async function getIssues(options = {}) {
    const params = new URLSearchParams();
    const entries = Object.entries(options || {});
    entries.forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      params.set(key, String(value));
    });

    const query = params.toString();
    const data = await request(`/api/issues${query ? `?${query}` : ""}`);
    return data.issues || [];
  }

  async function getDonations() {
    const data = await request("/api/donations");
    return data.donations || [];
  }

  async function addIssue(payload) {
    const data = await request("/api/issues", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return data.issue;
  }

  async function uploadIssueImage(file) {
    const formData = new FormData();
    formData.append("image", file);

    const data = await request("/api/uploads/issue-image", {
      method: "POST",
      body: formData
    });
    return data.imageUrl || "";
  }

  async function voteIssue(issueId) {
    const data = await request(`/api/issues/${encodeURIComponent(issueId)}/vote`, {
      method: "POST",
      body: JSON.stringify({})
    });
    return data.issue;
  }

  async function unvoteIssue(issueId) {
    const data = await request(`/api/issues/${encodeURIComponent(issueId)}/vote`, {
      method: "DELETE",
      body: JSON.stringify({})
    });
    return data.issue;
  }

  async function donate(payload) {
    const data = await request("/api/donations", {
      method: "POST",
      body: JSON.stringify(payload)
    });
    return data.donation;
  }

  async function claimIssue(issueId) {
    const data = await request(`/api/issues/${encodeURIComponent(issueId)}/claim`, {
      method: "POST",
      body: JSON.stringify({})
    });
    return data.issue;
  }

  async function updateIssueStatus(issueId, status) {
    const data = await request(`/api/issues/${encodeURIComponent(issueId)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status })
    });
    return data.issue;
  }

  async function addProgressUpdate(issueId, note) {
    const data = await request(`/api/issues/${encodeURIComponent(issueId)}/progress`, {
      method: "POST",
      body: JSON.stringify({ note })
    });
    return data.issue;
  }

  async function addIssueRating(issueId, stars, feedback) {
    const data = await request(`/api/issues/${encodeURIComponent(issueId)}/ratings`, {
      method: "POST",
      body: JSON.stringify({ stars, feedback })
    });
    return data.issue;
  }

  async function getRecommendedNgos(issueId, limit = 5) {
    const safeLimit = Math.min(Math.max(1, Number(limit) || 5), 25);
    const data = await request(`/api/issues/${encodeURIComponent(issueId)}/recommended-ngos?limit=${safeLimit}`);
    return data.recommendations || [];
  }

  async function getImpactStats() {
    return request("/api/impact");
  }

  function getLocationLabel(issue) {
    const location = issue?.location;
    if (!location) return "-";
    const parts = [location.area, location.district, location.state].filter(Boolean);
    return parts.length ? parts.join(", ") : "-";
  }

  window.CareConnectData = {
    STATUS,
    ensureSeedData,
    getCurrentUser,
    logout,
    getNgos,
    getIssues,
    getDonations,
    addIssue,
    uploadIssueImage,
    voteIssue,
    unvoteIssue,
    donate,
    scoreIssue,
    claimIssue,
    updateIssueStatus,
    addProgressUpdate,
    addIssueRating,
    getRecommendedNgos,
    getImpactStats,
    getLocationLabel
  };
})();
