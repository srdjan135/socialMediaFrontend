const { Type } = require("@angular-devkit/build-angular");
const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
  content: { type: String, required: true },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  isUserLiked: { type: Boolean },
  likes: [{ type: String }],
});

module.exports = mongoose.model("Comment", commentSchema);
