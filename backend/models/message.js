const express = require("express");
const mongoose = require("mongoose");

const messageSchema = mongoose.Schema(
  {
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
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
      required: true,
    },
    text: { type: String, required: true },
    isRead: { type: Boolean },
  },
  { timestamps: true, default: false }
);

module.exports = mongoose.model("Message", messageSchema);
