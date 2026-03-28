(function () {
  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      console.error("Failed to parse", key, error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function makeId(prefix) {
    return prefix + "_" + Date.now() + "_" + Math.floor(Math.random() * 100000);
  }

  function normalizeTag(tag) {
    return String(tag || "")
      .trim()
      .toLowerCase()
      .replace(/^#/, "")
      .replace(/[^a-z0-9_]/g, "");
  }

  const defaultNgos = [
    {
      id: "ngo_1",
      name: "GreenSteps Foundation",
      type: "Environment",
      volunteersCount: 240,
      website: "https://greensteps.example.org",
      social: {
        instagram: "@greensteps_org",
        x: "@greensteps_org",
        facebook: "greenstepsfoundation"
      },
      mission: "Urban cleanup, water restoration, and tree drives."
    },
    {
      id: "ngo_2",
      name: "EduBridge Trust",
      type: "Education",
      volunteersCount: 412,
      website: "https://edubridge.example.org",
      social: {
        instagram: "@edubridge_trust",
        x: "@edubridge_india",
        facebook: "edubridge"
      },
      mission: "Digital literacy and after-school learning support."
    },
    {
      id: "ngo_3",
      name: "HealthFirst Collective",
      type: "Healthcare",
      volunteersCount: 178,
      website: "https://healthfirst.example.org",
      social: {
        instagram: "@healthfirst_collective",
        x: "@healthfirstngo",
        facebook: "healthfirstcollective"
      },
      mission: "Community health camps and medicine access support."
    }
  ];

  function ensureSeedData() {
    const ngos = readJson("careconnect_ngos", null);
    if (!ngos || !Array.isArray(ngos) || ngos.length === 0) {
      writeJson("careconnect_ngos", defaultNgos);
    }

    const issues = readJson("careconnect_issues", null);
    if (!issues || !Array.isArray(issues) || issues.length === 0) {
      writeJson("careconnect_issues", [
        {
          id: makeId("issue"),
          title: "Streetlight not working near Sector 4 school",
          category: "Infrastructure",
          description: "The road is dark after 7 PM and children feel unsafe while returning home.",
          ngoId: "ngo_1",
          createdByUid: "seed",
          createdByName: "Community Reporter",
          hashtags: ["safety", "school", "night"],
          photoDataUrl: "",
          votes: 9,
          status: "open",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString()
        },
        {
          id: makeId("issue"),
          title: "Need weekend tutoring support for class 8 students",
          category: "Education",
          description: "About 35 students require math and science tutoring before board prep.",
          ngoId: "ngo_2",
          createdByUid: "seed",
          createdByName: "Parent Group",
          hashtags: ["education", "students"],
          photoDataUrl: "",
          votes: 14,
          status: "in-progress",
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString()
        }
      ]);
    }

    const donations = readJson("careconnect_donations", null);
    if (!donations || !Array.isArray(donations)) {
      writeJson("careconnect_donations", []);
    }

    const votes = readJson("careconnect_votes", null);
    if (!votes || typeof votes !== "object") {
      writeJson("careconnect_votes", {});
    }
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
    const user = readJson("currentUser", null);
    return user;
  }

  function logout() {
    sessionStorage.removeItem("currentUser");
    window.location.href = "index.html";
  }

  function getNgos() {
    return readJson("careconnect_ngos", []);
  }

  function getIssues() {
    return readJson("careconnect_issues", []);
  }

  function getDonations() {
    return readJson("careconnect_donations", []);
  }

  function getVotesMap() {
    return readJson("careconnect_votes", {});
  }

  function scoreIssue(issue) {
    const hashtagsCount = (issue.hashtags || []).length;
    const votesCount = Number(issue.votes || 0);
    return hashtagsCount * 4 + votesCount * 2;
  }

  function addIssue(payload) {
    const issues = getIssues();
    const hashtags = (payload.hashtags || [])
      .map(normalizeTag)
      .filter(Boolean)
      .slice(0, 10);

    const issue = {
      id: makeId("issue"),
      title: String(payload.title || "").trim(),
      category: String(payload.category || "General").trim(),
      description: String(payload.description || "").trim(),
      ngoId: String(payload.ngoId || "").trim(),
      createdByUid: String(payload.createdByUid || "").trim(),
      createdByName: String(payload.createdByName || "Volunteer").trim(),
      hashtags,
      photoDataUrl: String(payload.photoDataUrl || ""),
      votes: 0,
      status: "open",
      createdAt: new Date().toISOString()
    };

    issues.push(issue);
    writeJson("careconnect_issues", issues);
    return issue;
  }

  function voteIssue(issueId, voterUid) {
    const issues = getIssues();
    const votesMap = getVotesMap();
    const voteKey = String(voterUid || "") + ":" + String(issueId || "");

    if (votesMap[voteKey]) {
      throw new Error("You already voted for this issue.");
    }

    const issue = issues.find(item => item.id === issueId);
    if (!issue) {
      throw new Error("Issue not found.");
    }

    issue.votes = Number(issue.votes || 0) + 1;
    votesMap[voteKey] = true;

    writeJson("careconnect_issues", issues);
    writeJson("careconnect_votes", votesMap);
    return issue;
  }

  function donate(payload) {
    const donations = getDonations();
    const entry = {
      id: makeId("don"),
      ngoId: String(payload.ngoId || ""),
      volunteerUid: String(payload.volunteerUid || ""),
      volunteerName: String(payload.volunteerName || "Anonymous"),
      amount: Number(payload.amount || 0),
      note: String(payload.note || "").trim(),
      createdAt: new Date().toISOString()
    };
    donations.push(entry);
    writeJson("careconnect_donations", donations);
    return entry;
  }

  function updateIssueStatus(issueId, status) {
    const issues = getIssues();
    const issue = issues.find(item => item.id === issueId);
    if (!issue) {
      throw new Error("Issue not found.");
    }
    issue.status = status;
    writeJson("careconnect_issues", issues);
    return issue;
  }

  window.CareConnectData = {
    ensureSeedData,
    getCurrentUser,
    logout,
    getNgos,
    getIssues,
    getDonations,
    addIssue,
    voteIssue,
    donate,
    scoreIssue,
    updateIssueStatus
  };
})();
