const express = require("express");
const router = express.Router();

const isAuth = require("../middleware/check-auth");
const messagesController = require("../controllers/messages");

router.get("/api/messages/:chatId", isAuth, messagesController.getMessages);
router.post("/api/messages/:chatId", isAuth, messagesController.sendMessage);
router.delete(
  "/api/messages/:messageId",
  isAuth,
  messagesController.deleteMessage
);

module.exports = router;
