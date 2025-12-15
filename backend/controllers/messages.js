const Message = require("../models/message");
const Chat = require("../models/chat");
const User = require("../models/user");
const io = require("../socket");

exports.getMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chatId });
    res.status(200).json({ messages });
  } catch {
    res.status(500).json({ message: "Failed to fetch messages" });
  }
};

exports.sendMessage = async (req, res) => {
  const { chatId } = req.params;
  const { recipientId, senderId, messageText } = req.body;

  try {
    const message = await Message.create({
      recipientId,
      senderId,
      chatId,
      text: messageText,
      isRead: false,
    });

    await Promise.all([
      Chat.updateOne({ _id: chatId }, { $push: { messages: message._id } }),
      User.updateOne({ _id: senderId }, { $push: { messages: message._id } }),
    ]);

    io.getIO().to(recipientId.toString()).emit("messages", {
      action: "new",
      message,
    });

    res.status(201).json(message);
  } catch {
    res.status(500).json({ message: "Failed to send message" });
  }
};

exports.deleteMessage = async (req, res) => {
  const { messageId } = req.params;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    await Promise.all([
      Message.deleteOne({ _id: messageId }),
      Chat.updateOne(
        { _id: message.chatId },
        { $pull: { messages: messageId } }
      ),
      User.updateOne(
        { _id: message.senderId },
        { $pull: { messages: messageId } }
      ),
    ]);

    io.getIO()
      .to(message.chatId.toString())
      .emit("messages", { action: "delete", messageId });

    res.status(200).json({ message: "Message deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete message" });
  }
};
