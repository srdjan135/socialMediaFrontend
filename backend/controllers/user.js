const fs = require("fs");
const path = require("path");
const io = require("../socket");

const User = require("../models/user");
const Notification = require("../models/notification");
const Post = require("../models/post");
const Comment = require("../models/comment");

function deleteFile(filePath) {
  if (fs.existsSync(filePath) && !filePath.includes("user_blank.png")) {
    fs.unlinkSync(filePath);
  }
}

exports.getUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) return res.status(404).json({ message: "Users not found" });
    res.json({ message: "Users found", users });
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err });
  }
};

exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).populate(
      "notifications"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ message: "Error fetching user", error: err });
  }
};

exports.getProfileUser = async (req, res) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username })
      .populate("posts")
      .populate("followers")
      .populate("following");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.getFollowersList = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate(
      "followers"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ followers: user.followers });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.getFollowingList = async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username }).populate(
      "following"
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json({ following: user.following });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.follow = async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    const senderId = req.userData.userId;

    const recipientUser = await User.findById(recipientId);
    const senderUser = await User.findById(senderId);
    if (!recipientUser || !senderUser)
      return res.status(404).json({ message: "User not found" });

    const notification = await Notification.create({
      recipientId,
      senderId,
      type: "follow",
      isRead: false,
    });

    io.getIO()
      .to(recipientId)
      .emit("notifications", { action: "new", notification });

    recipientUser.notifications.push(notification._id);
    recipientUser.followers.push(senderId);

    senderUser.following.push(recipientId);

    await Promise.all([recipientUser.save(), senderUser.save()]);

    res.status(201).json({ message: "Success", notification });
  } catch (err) {
    res.status(500).json({ message: "Follow failed", error: err });
  }
};

exports.followRequest = async (req, res) => {
  try {
    const followedUserId = req.params.userId;
    const senderUserId = req.userData.userId;

    const recipientUser = await User.findById(followedUserId);
    const senderUser = await User.findById(senderUserId);
    if (!recipientUser || !senderUser)
      return res.status(404).json({ message: "User not found" });

    const notification = await Notification.create({
      recipientId: followedUserId,
      senderId: senderUserId,
      type: "followRequest",
      isRead: false,
    });

    io.getIO()
      .to(followedUserId)
      .emit("notifications", { action: "new", notification });

    recipientUser.notifications.push(notification._id);
    senderUser.sentFollowRequests.push(followedUserId);

    await Promise.all([recipientUser.save(), senderUser.save()]);

    res.status(201).json({ message: "Request sent", notification });
  } catch (err) {
    res.status(500).json({ message: "Follow request failed", error: err });
  }
};

exports.removeRequest = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      recipientId: req.params.userId,
      senderId: req.userData.userId,
      type: "followRequest",
    });
    if (!notification) throw new Error("Notification not found");

    const recipientUser = await User.findById(req.params.userId);
    const senderUser = await User.findById(req.userData.userId);
    if (!recipientUser || !senderUser) throw new Error("User not found");

    recipientUser.notifications.pull(notification._id);
    senderUser.sentFollowRequests.pull(recipientUser._id);

    await Promise.all([
      recipientUser.save(),
      senderUser.save(),
      Notification.deleteOne({ _id: notification._id }),
    ]);

    res.json({ message: "Request removed" });
  } catch (err) {
    res.status(400).json({ message: err.message || "Error" });
  }
};

exports.removeFollower = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);
    const follower = await User.findById(req.params.followerId);
    if (!user || !follower)
      return res.status(404).json({ message: "User not found" });

    user.followers.pull(follower._id);
    follower.following.pull(user._id);

    const notifications = await Notification.find({
      senderId: follower._id,
      recipientId: user._id,
      type: { $in: ["follow", "acceptRequest", "followRequest"] },
    });

    const notifIds = notifications.map((n) => n._id.toString());

    user.notifications = user.notifications.filter(
      (n) => !notifIds.includes(n.toString())
    );
    follower.notifications = follower.notifications.filter(
      (n) => !notifIds.includes(n.toString())
    );

    await Notification.deleteMany({ _id: { $in: notifIds } });

    await Promise.all([user.save(), follower.save()]);

    res.status(200).json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);
    const following = await User.findById(req.params.followingId);
    if (!user || !following)
      return res.status(404).json({ message: "User not found" });

    user.following.pull(following._id);
    following.followers.pull(user._id);

    const notifications = await Notification.find({
      senderId: user._id,
      recipientId: following._id,
      type: { $in: ["follow", "acceptRequest", "followRequest"] },
    });

    const notifIds = notifications.map((n) => n._id.toString());

    user.notifications = user.notifications.filter(
      (n) => !notifIds.includes(n.toString())
    );
    following.notifications = following.notifications.filter(
      (n) => !notifIds.includes(n.toString())
    );

    await Notification.deleteMany({ _id: { $in: notifIds } });

    await Promise.all([user.save(), following.save()]);

    res.status(200).json({ message: "Success" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.getSearchedUser = async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ message: "Username required" });

  try {
    const users = await User.find({
      username: { $regex: username, $options: "i" },
    }).limit(10);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const updateData = {
      email: req.body.email ?? user.email,
      username: req.body.username ?? user.username,
      biography: req.body.biography ?? user.biography,
      isPrivate:
        req.body.isPrivate !== undefined
          ? req.body.isPrivate === "true"
          : user.isPrivate,
    };

    if (req.file) {
      updateData.imagePath = `${req.protocol}://${req.get("host")}/images/${
        req.file.filename
      }`;
    } else if (req.body.deleteImage === "true" && user.imagePath) {
      const oldFilePath = path.join(
        __dirname,
        "..",
        user.imagePath.replace(`${req.protocol}://${req.get("host")}/`, "")
      );
      deleteFile(oldFilePath);
      updateData.imagePath = null;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userData.userId,
      updateData,
      { new: true }
    );

    if (req.file && user.imagePath) {
      const oldFilePath = path.join(
        __dirname,
        "..",
        user.imagePath.replace(`${req.protocol}://${req.get("host")}/`, "")
      );
      deleteFile(oldFilePath);
    }

    res.status(200).json({ message: "Profile updated", user: updatedUser });
  } catch (err) {
    res.status(500).json({ message: "Update failed", error: err });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const userId = req.userData.userId;

    await Promise.all([
      Post.deleteMany({ userId }),
      Comment.deleteMany({ userId }),
      Notification.deleteMany({ senderId: userId }),
      User.updateMany({ following: userId }, { $pull: { following: userId } }),
      User.updateMany({ followers: userId }, { $pull: { followers: userId } }),
      User.updateMany(
        { sentFollowRequests: userId },
        { $pull: { sentFollowRequests: userId } }
      ),
    ]);

    await User.findByIdAndDelete(userId);

    res
      .status(200)
      .json({ message: "User and all related data deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete user", error: err });
  }
};
