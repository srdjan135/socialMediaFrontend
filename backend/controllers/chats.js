const io = require("../socket");
const Chat = require("../models/chat");
const User = require("../models/user");
const Message = require("../models/message");

exports.getChats = async (req, res) => {
  const userId = req.userData.userId;

  try {
    const user = await User.findById(userId).populate("chats");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      chats: user.chats,
    });
  } catch {
    res.status(500).json({ message: "Failed to fetch chats" });
  }
};

exports.getChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    res.status(200).json({ chat });
  } catch {
    res.status(500).json({ message: "Failed to fetch chat" });
  }
};

exports.createChat = async (req, res) => {
  const { senderId, recipientId } = req.body;

  try {
    const chat = await Chat.findOne({
      $or: [
        { senderId, recipientId },
        { senderId: recipientId, recipientId: senderId },
      ],
    });

    if (chat) {
      return res.status(200).json({ chat });
    }

    const newChat = await Chat.create({ senderId, recipientId });

    await User.updateMany(
      { _id: { $in: [senderId, recipientId] } },
      { $addToSet: { chats: newChat._id } }
    );

    io.getIO().to(senderId.toString()).emit("chat-created", { chat: newChat });
    io.getIO()
      .to(recipientId.toString())
      .emit("chat-created", { chat: newChat });

    res.status(201).json({ chat: newChat });
  } catch {
    res.status(500).json({ message: "Failed to create chat" });
  }
};

exports.deleteChat = async (req, res) => {
  const { chatId } = req.params;

  try {
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }

    await Promise.all([
      Message.deleteMany({ chatId }),
      User.updateMany({ chats: chatId }, { $pull: { chats: chatId } }),
      Chat.findByIdAndDelete(chatId),
    ]);

    io.getIO().to(chat.senderId.toString()).emit("chat-deleted", { chatId });
    io.getIO().to(chat.recipientId.toString()).emit("chat-deleted", { chatId });
    io.getIO().to(chatId).emit("chat-deleted", { chatId });

    res.status(200).json({ message: "Chat deleted" });
  } catch {
    res.status(500).json({ message: "Failed to delete chat" });
  }
};
