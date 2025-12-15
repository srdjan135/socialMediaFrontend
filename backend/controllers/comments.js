const Comment = require("../models/comment");
const Post = require("../models/post");
const User = require("../models/user");
const Notification = require("../models/notification");
const io = require("../socket");

exports.createComment = async (req, res) => {
  const { postId, content, recipientId } = req.body;
  const userId = req.userData.userId;

  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      content,
      postId,
      userId,
    });

    const notification = await Notification.create({
      recipientId,
      senderId: userId,
      type: "comment",
      commentId: comment._id,
      isRead: false,
    });

    await Promise.all([
      Post.updateOne({ _id: postId }, { $push: { comments: comment._id } }),
      User.updateOne({ _id: userId }, { $push: { comments: comment._id } }),
      User.updateOne(
        { _id: recipientId },
        { $push: { notifications: notification._id } }
      ),
    ]);

    io.getIO()
      .to(recipientId.toString())
      .emit("notifications", { action: "new", notification });

    io.getIO().emit("comments", {
      action: "create",
      comment,
    });

    res.status(201).json({ comment });
  } catch {
    res.status(500).json({ message: "Failed to create comment" });
  }
};

exports.getComments = async (req, res) => {
  const { postId } = req.query;

  if (!postId) {
    return res.status(400).json({ message: "postId is required" });
  }

  try {
    const post = await Post.findById(postId).populate("comments");
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json({ comments: post.comments });
  } catch {
    res.status(500).json({ message: "Failed to fetch comments" });
  }
};

exports.likeComment = async (req, res) => {
  const { commentId } = req.params;
  const userId = req.userData.userId;
  const { recipientId } = req.body;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const isLiked = comment.likes.includes(userId);

    if (isLiked) {
      comment.likes.pull(userId);

      const notification = await Notification.findOneAndDelete({
        recipientId,
        senderId: userId,
        type: "likeComment",
        commentId,
      });

      if (notification) {
        await User.updateOne(
          { _id: recipientId },
          { $pull: { notifications: notification._id } }
        );
      }
    } else {
      comment.likes.addToSet(userId);

      const notification = await Notification.create({
        recipientId,
        senderId: userId,
        type: "likeComment",
        commentId,
        isRead: false,
      });

      await User.updateOne(
        { _id: recipientId },
        { $push: { notifications: notification._id } }
      );

      io.getIO()
        .to(recipientId.toString())
        .emit("notifications", { action: "new", notification });
    }

    await comment.save();

    io.getIO().emit("comments", {
      action: "like",
      commentId,
      userId,
      isLiked: !isLiked,
      likesCount: comment.likes.length,
    });

    res.status(200).json({ likesCount: comment.likes.length });
  } catch {
    res.status(500).json({ message: "Failed to update comment like" });
  }
};

exports.deleteComment = async (req, res) => {
  const { commentId } = req.params;

  try {
    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    const { postId, userId } = comment;

    const post = await Post.findById(postId);
    const recipientId = post?.userId;

    const notification = await Notification.findOne({
      senderId: userId,
      recipientId,
      type: "comment",
      commentId,
    });

    await Promise.all([
      Comment.deleteOne({ _id: commentId }),
      Post.updateOne({ _id: postId }, { $pull: { comments: commentId } }),
      User.updateOne({ _id: userId }, { $pull: { comments: commentId } }),
      notification && Notification.deleteOne({ _id: notification._id }),
      notification &&
        User.updateOne(
          { _id: recipientId },
          { $pull: { notifications: notification._id } }
        ),
    ]);

    io.getIO().emit("comments", {
      action: "delete",
      commentId,
    });

    res.status(200).json({ message: "Comment deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete comment" });
  }
};
