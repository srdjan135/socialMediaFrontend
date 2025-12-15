const express = require("express");
const router = express.Router();

const multer = require("multer");

const checkAuth = require("../middleware/check-auth");
const userController = require("../controllers/user");

const { storage } = require("../controllers/posts");

router.get("/api/is-online/:id", (req, res) => {
  const isOnline = onlineUsers.has(req.params.id);
  res.json({ online: isOnline });
});
router.get("/api/users", checkAuth, userController.getUsers);
router.get("/api/user", checkAuth, userController.getUser);
router.get("/api/users/search", checkAuth, userController.getSearchedUser);
router.get(
  "/api/profileUser/:username",
  checkAuth,
  userController.getProfileUser
);
router.get(
  "/api/profileUser/:username/followers",
  checkAuth,
  userController.getFollowersList
);
router.get(
  "/api/profileUser/:username/following",
  checkAuth,
  userController.getFollowingList
);
router.post("/api/user/:recipientId/follow", checkAuth, userController.follow);
router.post(
  "/api/user/:userId/followRequest",
  checkAuth,
  userController.followRequest
);
router.put(
  "/api/user/update",
  checkAuth,
  multer({ storage: storage }).single("imagePath"),
  userController.updateUser
);
router.delete(
  "/api/user/:userId/removeRequest",
  checkAuth,
  userController.removeRequest
);
router.delete(
  "/api/user/:followerId/removeFollower",
  checkAuth,
  userController.removeFollower
);
router.delete(
  "/api/user/:followingId/unfollow",
  checkAuth,
  userController.unfollowUser
);
router.delete("/api/user/delete", checkAuth, userController.deleteUser);

module.exports = router;
