const express = require("express");
const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
  imagePath: { type: String, required: true },
  description: { type: String, required: true },
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  isUserLiked: { type: Boolean },
  likes: [{ type: String }],
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Post", postSchema);
