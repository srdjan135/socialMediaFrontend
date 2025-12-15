const fs = require("fs");
const path = require("path");
const multer = require("multer");

const Post = require("../models/post");
const User = require("../models/user");
const Comment = require("../models/comment");
const Notification = require("../models/notification");
const io = require("../socket");

const MIME_TYPE_MAP = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
};

function deleteImageFromServer(imageUrl) {
  if (!imageUrl) return;
  const fileName = imageUrl.split("/").pop();
  const filePath = path.join(__dirname, "..", "images", fileName);
  fs.unlink(filePath, (err) => {
    if (err) console.log("Error deleting image:", err);
  });
}

exports.storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const isValid = MIME_TYPE_MAP[file.mimetype];
    cb(isValid ? null : new Error("Invalid mime type"), "backend/images");
  },
  filename: (req, file, cb) => {
    const name = file.originalname.toLowerCase().split(" ").join("-");
    const ext = MIME_TYPE_MAP[file.mimetype];
    cb(null, `${name}-${Date.now()}.${ext}`);
  },
});

exports.createPost = async (req, res) => {
  try {
    const url = req.protocol + "://" + req.get("host");
    const post = await Post.create({
      imagePath: `${url}/images/${req.file.filename}`,
      description: req.body.description,
      userId: req.userData.userId,
    });

    await User.findByIdAndUpdate(req.userData.userId, {
      $push: { posts: post._id },
    });

    io.getIO().emit("posts", { action: "create", post });

    res.status(201).json({ message: "Post created", post });
  } catch {
    res.status(500).json({ message: "Creating post failed" });
  }
};

exports.getPosts = async (req, res) => {
  try {
    const user = await User.findById(req.userData.userId).select("following");
    if (!user) return res.status(404).json({ message: "User not found" });

    const feedUsers = [...user.following, req.userData.userId];
    const posts = await Post.find({ userId: { $in: feedUsers } });

    res.status(200).json({ posts });
  } catch {
    res.status(500).json({ message: "Fetching posts failed" });
  }
};

exports.likePost = async (req, res) => {
  try {
    const { postId } = req.params;
    const recipientId = req.body.recipientId;
    const userId = req.userData.userId;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const isLiked = post.likes.includes(userId);
    if (isLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
      post.isUserLiked = false;

      const notification = await Notification.findOne({
        recipientId,
        senderId: userId,
        type: "likePost",
        postId,
      });
      if (notification) {
        await Promise.all([
          Notification.deleteOne({ _id: notification._id }),
          User.updateOne(
            { _id: recipientId },
            { $pull: { notifications: notification._id } }
          ),
        ]);
      }
    } else {
      post.likes.push(userId);
      post.isUserLiked = true;

      const likeNotification = await Notification.create({
        recipientId,
        senderId: userId,
        type: "likePost",
        postId,
        isRead: false,
      });

      await User.updateOne(
        { _id: recipientId },
        { $push: { notifications: likeNotification._id } }
      );

      io.getIO().to(recipientId.toString()).emit("notifications", {
        action: "new",
        notification: likeNotification,
      });
    }

    const updatedPost = await post.save();

    io.getIO().emit("posts", {
      action: "like",
      postId: post._id,
      userId,
      isLiked: !isLiked,
      likesCount: post.likes.length,
    });

    res.status(200).json({ updatedPost });
  } catch {
    res.status(500).json({ message: "Error updating likes" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await Post.findById(postId);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const comments = await Comment.find({ postId });
    const commentIds = comments.map((c) => c._id);

    const notifications = await Notification.find({
      $or: [{ postId: post._id }, { commentId: { $in: commentIds } }],
    });
    const notificationIds = notifications.map((n) => n._id);

    await Promise.all(
      notifications.map((n) =>
        User.updateOne(
          { notifications: n._id },
          { $pull: { notifications: n._id } }
        )
      )
    );

    await Promise.all([
      Comment.deleteMany({ postId }),
      Notification.deleteMany({ _id: { $in: notificationIds } }),
    ]);

    await User.updateOne(
      { posts: post._id },
      {
        $pull: {
          posts: post._id,
          comments: { $in: commentIds },
        },
      }
    );

    deleteImageFromServer(post.imagePath);
    await Post.deleteOne({ _id: post._id });

    io.getIO().emit("posts", { action: "delete", postId });

    res.status(200).json({
      message: "Post, comments, and related notifications deleted",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error deleting post", error: err });
  }
};
