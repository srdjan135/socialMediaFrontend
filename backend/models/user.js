const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const userSchema = mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
  messages: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }],
  notifications: [
    { type: mongoose.Schema.Types.ObjectId, ref: "Notification" },
  ],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  sentFollowRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  biography: { type: String, required: false },
  imagePath: { type: String, required: false },
  isPrivate: { type: Boolean, required: false, default: true },
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", userSchema);
