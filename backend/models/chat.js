const express = require("express");
const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  unreadCount: { type: Number },
});

module.exports = mongoose.model("Chat", chatSchema);
