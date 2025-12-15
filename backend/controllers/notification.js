const Notification = require("../models/notification");
const User = require("../models/user");
const io = require("../socket");

exports.acceptFollow = async (req, res) => {
  const { senderId, currentUserId } = req.body;

  try {
    const notification = await Notification.create({
      recipientId: senderId,
      senderId: currentUserId,
      type: "acceptRequest",
      isRead: false,
    });

    await Promise.all([
      User.updateOne(
        { _id: senderId },
        {
          $push: {
            notifications: notification._id,
            following: currentUserId,
          },
          $pull: { sentFollowRequests: currentUserId },
        }
      ),
      User.updateOne(
        { _id: currentUserId },
        { $push: { followers: senderId } }
      ),
    ]);

    io.getIO()
      .to(senderId.toString())
      .emit("notifications", { action: "new", notification });

    res.status(200).json({ message: "Accepted" });
  } catch {
    res.status(500).json({ message: "Failed to accept follow request" });
  }
};

exports.followBack = async (req, res) => {
  const { recipientId, senderId } = req.body;

  try {
    const notification = await Notification.create({
      recipientId,
      senderId,
      type: "followRequest",
      isRead: false,
    });

    await Promise.all([
      User.updateOne(
        { _id: recipientId },
        { $push: { notifications: notification._id } }
      ),
      User.updateOne(
        { _id: senderId },
        { $addToSet: { sentFollowRequests: recipientId } }
      ),
    ]);

    io.getIO()
      .to(recipientId.toString())
      .emit("notifications", { action: "new", notification });

    res.status(200).json({ message: "Follow back request sent" });
  } catch {
    res.status(500).json({ message: "Failed to send follow back request" });
  }
};

exports.deleteNot = async (req, res) => {
  const { notId } = req.params;
  const senderId = req.body.senderId;
  const userId = req.userData.userId;

  try {
    const notification = await Notification.findById(notId);
    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await Promise.all([
      Notification.deleteOne({ _id: notId }),
      User.updateOne({ _id: userId }, { $pull: { notifications: notId } }),
      User.updateOne(
        { _id: senderId },
        { $pull: { sentFollowRequests: userId } }
      ),
    ]);

    res.status(200).json({ message: "Notification deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete notification" });
  }
};

exports.declineFollowBack = async (req, res) => {
  const { recipientId } = req.params;
  const senderId = req.userData.userId;

  try {
    const notification = await Notification.findOne({
      senderId,
      recipientId,
      type: "followRequest",
    });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    await Promise.all([
      Notification.deleteOne({ _id: notification._id }),
      User.updateOne(
        { _id: recipientId },
        { $pull: { notifications: notification._id } }
      ),
      User.updateOne(
        { _id: senderId },
        { $pull: { sentFollowRequests: recipientId } }
      ),
    ]);

    res.status(200).json({ message: "Notification deleted" });
  } catch {
    res.status(500).json({ message: "Failed to decline follow back" });
  }
};

exports.markAllRead = async (req, res) => {
  const userId = req.userData.userId;

  try {
    await Notification.updateMany(
      { recipientId: userId, isRead: false },
      { $set: { isRead: true } }
    );

    res.status(200).json({ message: "All notifications marked as read" });
  } catch {
    res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};
