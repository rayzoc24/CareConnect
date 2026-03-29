const Issue = require("../models/Issue");

function getRangeStart(range) {
  const now = new Date();
  const key = String(range || "monthly").toLowerCase();

  if (key === "weekly") {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (key === "monthly") {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return null;
}

function buildRangeMatch(start) {
  if (!start) return {};
  return { createdAt: { $gte: start } };
}

async function getVolunteerLeaderboard(req, res) {
  const range = String(req.query.range || "monthly").toLowerCase();
  const start = getRangeStart(range);

  if (!start) {
    res.status(400).json({ error: "range must be weekly or monthly" });
    return;
  }

  const pipeline = [
    // 1) Keep only issues in selected date range.
    { $match: buildRangeMatch(start) },

    // 2) Convert each issue into volunteer score components.
    {
      $project: {
        _id: 0,
        userId: {
          $trim: {
            input: {
              $toString: {
                $ifNull: ["$createdByUid", "$postedBy"]
              }
            }
          }
        },
        issuesCreated: { $literal: 1 },
        issuesResolved: {
          $cond: [
            { $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["resolved", "completed"]] },
            1,
            0
          ]
        },
        votesGiven: { $literal: 0 },
        score: {
          $add: [
            5,
            {
              $cond: [
                { $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["resolved", "completed"]] },
                10,
                0
              ]
            }
          ]
        }
      }
    },

    // 3) Add vote score rows (+1 each vote) from votes collection for the same date range.
    {
      $unionWith: {
        coll: "votes",
        pipeline: [
          { $match: buildRangeMatch(start) },
          {
            $project: {
              _id: 0,
              userId: {
                $trim: {
                  input: {
                    $toString: "$voterUid"
                  }
                }
              },
              issuesCreated: { $literal: 0 },
              issuesResolved: { $literal: 0 },
              votesGiven: { $literal: 1 },
              score: { $literal: 1 }
            }
          }
        ]
      }
    },

    // 4) Ignore empty user ids.
    {
      $match: {
        userId: { $ne: "" }
      }
    },

    // 5) Group by volunteer id and total all counters and score.
    {
      $group: {
        _id: "$userId",
        issuesCreated: { $sum: "$issuesCreated" },
        issuesResolved: { $sum: "$issuesResolved" },
        votesGiven: { $sum: "$votesGiven" },
        totalScore: { $sum: "$score" }
      }
    },

    // 6) Sort descending by total score.
    { $sort: { totalScore: -1, _id: 1 } },

    // 7) Add rank based on sorted score.
    {
      $setWindowFields: {
        sortBy: { totalScore: -1 },
        output: {
          rank: { $rank: {} }
        }
      }
    },

    // 8) Join user details for name and role.
    {
      $lookup: {
        from: "users",
        let: { uid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toString: "$_id" }, "$$uid"]
              }
            }
          },
          {
            $project: {
              _id: 0,
              role: 1,
              name: {
                $ifNull: ["$name", "$orgName"]
              },
              orgName: 1
            }
          }
        ],
        as: "user"
      }
    },

    // 9) Shape final output.
    {
      $project: {
        _id: 0,
        userId: "$_id",
        rank: 1,
        totalScore: 1,
        scoreBreakdown: {
          issuesCreated: "$issuesCreated",
          issuesResolved: "$issuesResolved",
          votesGiven: "$votesGiven"
        },
        name: {
          $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Unknown Volunteer"]
        },
        role: {
          $ifNull: [{ $arrayElemAt: ["$user.role", 0] }, "volunteer"]
        }
      }
    }
  ];

  const leaderboard = await Issue.aggregate(pipeline);

  res.json({
    leaderboardType: "volunteers",
    range,
    from: start.toISOString(),
    pointsModel: {
      issueCreated: 5,
      issueResolved: 10,
      voteGiven: 1
    },
    total: leaderboard.length,
    leaderboard
  });
}

async function getNgoLeaderboard(req, res) {
  const range = String(req.query.range || "monthly").toLowerCase();
  const start = getRangeStart(range);

  if (!start) {
    res.status(400).json({ error: "range must be weekly or monthly" });
    return;
  }

  const pipeline = [
    // 1) Keep only issues in selected date range.
    { $match: buildRangeMatch(start) },

    // 2) Extract NGO id and score components from each issue.
    {
      $project: {
        _id: 0,
        userId: {
          $trim: {
            input: {
              $toString: {
                $ifNull: ["$claimedBy.ngoUid", "$assignedTo"]
              }
            }
          }
        },
        issuesClaimed: {
          $cond: [
            {
              $ne: [
                {
                  $trim: {
                    input: {
                      $toString: {
                        $ifNull: ["$claimedBy.ngoUid", "$assignedTo"]
                      }
                    }
                  }
                },
                ""
              ]
            },
            1,
            0
          ]
        },
        issuesResolved: {
          $cond: [
            {
              $and: [
                {
                  $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["resolved", "completed"]]
                },
                {
                  $ne: [
                    {
                      $trim: {
                        input: {
                          $toString: {
                            $ifNull: ["$claimedBy.ngoUid", "$assignedTo"]
                          }
                        }
                      }
                    },
                    ""
                  ]
                }
              ]
            },
            1,
            0
          ]
        },
        score: {
          $add: [
            {
              $cond: [
                {
                  $ne: [
                    {
                      $trim: {
                        input: {
                          $toString: {
                            $ifNull: ["$claimedBy.ngoUid", "$assignedTo"]
                          }
                        }
                      }
                    },
                    ""
                  ]
                },
                5,
                0
              ]
            },
            {
              $cond: [
                {
                  $and: [
                    {
                      $in: [{ $toLower: { $ifNull: ["$status", ""] } }, ["resolved", "completed"]]
                    },
                    {
                      $ne: [
                        {
                          $trim: {
                            input: {
                              $toString: {
                                $ifNull: ["$claimedBy.ngoUid", "$assignedTo"]
                              }
                            }
                          }
                        },
                        ""
                      ]
                    }
                  ]
                },
                15,
                0
              ]
            }
          ]
        }
      }
    },

    // 3) Ignore issues without NGO id.
    {
      $match: {
        userId: { $ne: "" }
      }
    },

    // 4) Group by NGO id and total all counters and score.
    {
      $group: {
        _id: "$userId",
        issuesClaimed: { $sum: "$issuesClaimed" },
        issuesResolved: { $sum: "$issuesResolved" },
        totalScore: { $sum: "$score" }
      }
    },

    // 5) Sort descending by score.
    { $sort: { totalScore: -1, _id: 1 } },

    // 6) Add rank.
    {
      $setWindowFields: {
        sortBy: { totalScore: -1 },
        output: {
          rank: { $rank: {} }
        }
      }
    },

    // 7) Join user details (name + role).
    {
      $lookup: {
        from: "users",
        let: { uid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $eq: [{ $toString: "$_id" }, "$$uid"]
              }
            }
          },
          {
            $project: {
              _id: 0,
              role: 1,
              name: {
                $ifNull: ["$orgName", "$name"]
              },
              orgName: 1
            }
          }
        ],
        as: "user"
      }
    },

    // 8) Shape final output.
    {
      $project: {
        _id: 0,
        userId: "$_id",
        rank: 1,
        totalScore: 1,
        scoreBreakdown: {
          issuesClaimed: "$issuesClaimed",
          issuesResolved: "$issuesResolved"
        },
        name: {
          $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Unknown NGO"]
        },
        role: {
          $ifNull: [{ $arrayElemAt: ["$user.role", 0] }, "foundation"]
        }
      }
    }
  ];

  const leaderboard = await Issue.aggregate(pipeline);

  res.json({
    leaderboardType: "ngos",
    range,
    from: start.toISOString(),
    pointsModel: {
      issueClaimed: 5,
      issueResolved: 15
    },
    total: leaderboard.length,
    leaderboard
  });
}

module.exports = {
  getVolunteerLeaderboard,
  getNgoLeaderboard
};