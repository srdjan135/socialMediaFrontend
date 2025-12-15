const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const helmet = require("helmet");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const jwt = require("jsonwebtoken");

const postsRoutes = require("./routes/posts");
const commentsRoutes = require("./routes/comments");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/user");
const notRoutes = require("./routes/notification");
const chatsRoutes = require("./routes/chats");
const messagesRoutes = require("./routes/messages");

const Message = require("./models/message");

const onlineUsers = new Map();

const app = express();

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));

app.use("/images", express.static(path.join("backend/images")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "PUT, POST, GET, PATCH, DELETE"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
app.use((req, res, next) => {
  res.setHeader("Content-Security-Policy", "default-src 'self';");
  next();
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
});
app.use(apiLimiter);

app.use(postsRoutes);
app.use(commentsRoutes);
app.use(authRoutes);
app.use(userRoutes);
app.use(notRoutes);
app.use(chatsRoutes);
app.use(messagesRoutes);

const PORT = 3000;

mongoose
  .connect(
    `mongodb+srv://srdjanmihic3_db_user:${process.env.MONGO_DB_PW}@cluster0.chkmvbf.mongodb.net/socialMedia`
  )
  .then(() => {
    const server = app.listen(PORT, () => {
      console.log("Server radi na portu", PORT);
    });

    const io = require("./socket").init(server);

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
        next();
      } catch {
        next(new Error("Unauthorized"));
      }
    });

    io.on("connection", (socket) => {
      socket.join(socket.userId);

      socket.on("join_chat", (chatId) => {
        socket.join(chatId);
      });

      socket.on("messages-seen", async ({ chatId }) => {
        await Message.updateMany(
          {
            chatId,
            senderId: { $ne: socket.userId },
            isRead: { $ne: true },
          },
          { $set: { isRead: true } }
        );

        socket.to(chatId).emit("messages-seen", {
          chatId,
          userId: socket.userId,
        });
      });

      socket.on("typing", ({ chatId }) => {
        socket.to(chatId).emit("user_typing", {
          chatId,
          userId: socket.userId,
        });
      });

      socket.on("stop_typing", ({ chatId }) => {
        socket.to(chatId).emit("user_stop_typing", {
          chatId,
          userId: socket.userId,
        });
      });

      onlineUsers.set(socket.userId, socket.id);
      io.emit("online_users", Array.from(onlineUsers.keys()));

      socket.on("disconnect", () => {
        onlineUsers.delete(socket.userId);
        io.emit("online_users", Array.from(onlineUsers.keys()));
      });
    });
  })
  .catch((err) => {
    console.error(err);
  });
