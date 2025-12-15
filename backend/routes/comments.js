const express = require("express");

const router = express.Router();

const checkAuth = require("../middleware/check-auth");

const commentsController = require("../controllers/comments");

router.post("/api/comments", checkAuth, commentsController.createComment);
router.get("/api/comments", checkAuth, commentsController.getComments);
router.put(
  "/api/comments/:commentId/like",
  checkAuth,
  commentsController.likeComment
);
router.delete(
  "/api/comments/:commentId",
  checkAuth,
  commentsController.deleteComment
);

module.exports = router;
