const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/check-auth");
const notificationController = require("../controllers/notification");

router.put(
  "/api/notification/accept",
  checkAuth,
  notificationController.acceptFollow
);

router.put(
  "/api/notification/followBack",
  checkAuth,
  notificationController.followBack
);

router.delete(
  "/api/notification/:notId",
  checkAuth,
  notificationController.deleteNot
);

router.delete(
  "/api/notification/decline/:recipientId",
  checkAuth,
  notificationController.declineFollowBack
);

router.put(
  "/api/notification/mark-all-read",
  checkAuth,
  notificationController.markAllRead
);

module.exports = router;
