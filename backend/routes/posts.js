const express = require("express");
const router = express.Router();

const checkAuth = require("../middleware/check-auth");

const multer = require("multer");

const postsController = require("../controllers/posts");
const { storage } = require("../controllers/posts");

router.post(
  "/api/posts",
  checkAuth,
  multer({ storage: storage }).single("imagePath"),
  postsController.createPost
);
router.get("/api/posts", checkAuth, postsController.getPosts);
router.put("/api/posts/:postId/like", checkAuth, postsController.likePost);
router.delete("/api/posts/:postId", checkAuth, postsController.deletePost);

module.exports = router;
