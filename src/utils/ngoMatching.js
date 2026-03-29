function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeList(values) {
  if (!Array.isArray(values)) return [];
  return values
    .map((value) => normalize(value))
    .filter(Boolean);
}

const DEMO_SCORING_WEIGHTS = {
  category: 60,
  state: 20,
  district: 12,
  area: 8,
  capacity: 10
};

function scoreCategory(issue, ngo) {
  const issueCategory = normalize(issue.category);
  const ngoType = normalize(ngo.type);
  const focusCategories = normalizeList(ngo.focusCategories);
  const mission = normalize(ngo.mission);

  if (!issueCategory) {
    return { score: 0, reason: "no issue category" };
  }

  if (focusCategories.includes(issueCategory) || ngoType === issueCategory) {
    return { score: DEMO_SCORING_WEIGHTS.category, reason: "category match" };
  }

  if (mission.includes(issueCategory)) {
    return { score: 30, reason: "category hinted by mission" };
  }

  return { score: 0, reason: "no category match" };
}

function scoreLocation(issue, ngo) {
  const issueState = normalize(issue?.location?.state);
  const issueDistrict = normalize(issue?.location?.district);
  const issueArea = normalize(issue?.location?.area);
  const coverage = ngo.coverage || {};

  const coverageStates = normalizeList(coverage.states);
  const coverageDistricts = normalizeList(coverage.districts);
  const coverageAreas = normalizeList(coverage.areas);

  let score = 0;
  const reasons = [];

  if (issueState && coverageStates.includes(issueState)) {
    score += DEMO_SCORING_WEIGHTS.state;
    reasons.push("state match");
  }

  if (issueDistrict && coverageDistricts.includes(issueDistrict)) {
    score += DEMO_SCORING_WEIGHTS.district;
    reasons.push("district match");
  }

  if (issueArea && coverageAreas.includes(issueArea)) {
    score += DEMO_SCORING_WEIGHTS.area;
    reasons.push("area match");
  }

  if (!reasons.length) {
    reasons.push("no explicit location match");
  }

  return {
    score,
    reason: reasons.join(", ")
  };
}

function scoreOperationalSignals(ngo) {
  const volunteers = Number(ngo.volunteersCount || 0);
  let volunteerScore = 2;
  if (volunteers >= 300) volunteerScore = 10;
  else if (volunteers >= 150) volunteerScore = 7;
  else if (volunteers >= 50) volunteerScore = 4;

  return {
    score: volunteerScore,
    reason: `capacity tier (${volunteerScore}/${DEMO_SCORING_WEIGHTS.capacity})`
  };
}

function scoreNgoForIssue(issue, ngo) {
  const category = scoreCategory(issue, ngo);
  const location = scoreLocation(issue, ngo);
  const operational = scoreOperationalSignals(ngo);

  const total = category.score + location.score + operational.score;

  return {
    ngoId: String(ngo._id),
    ngoName: ngo.name,
    ngoType: ngo.type,
    relevanceScore: total,
    scoreBreakdown: {
      category: category.score,
      location: location.score,
      operational: operational.score
    },
    reasons: [category.reason, location.reason, operational.reason]
  };
}

module.exports = {
  scoreNgoForIssue,
  DEMO_SCORING_WEIGHTS
};