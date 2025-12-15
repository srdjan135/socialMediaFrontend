const express = require("express");
const router = express.Router();

const chatsController = require("../controllers/chats");

const isAuth = require("../middleware/check-auth");

router.get("/api/chats", isAuth, chatsController.getChats);
router.get("/api/chats/:chatId", isAuth, chatsController.getChat);
router.post("/api/chats", isAuth, chatsController.createChat);
router.delete("/api/chats/:chatId", isAuth, chatsController.deleteChat);

module.exports = router;
