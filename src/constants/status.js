const STATUS = {
  PENDING: "pending",
  PLANNED: "planned",
  IN_PROGRESS: "in-progress",
  COMPLETED: "completed"
};

const LEGACY_STATUS_MAP = {
  open: STATUS.PENDING,
  planned: STATUS.PLANNED,
  "in-progress": STATUS.IN_PROGRESS,
  resolved: STATUS.COMPLETED,
  completed: STATUS.COMPLETED,
  pending: STATUS.PENDING
};

module.exports = {
  STATUS,
  LEGACY_STATUS_MAP
};
