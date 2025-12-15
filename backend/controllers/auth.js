const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { body, validationResult } = require("express-validator");
const User = require("../models/user");

const TOKEN_EXPIRES_IN = 3600;

exports.validateSignup = [
  body("email").isEmail().normalizeEmail(),
  body("username").isLength({ min: 3 }),
  body("password").isLength({ min: 5 }),
];

exports.signupUser = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, username, password } = req.body;

  try {
    const [emailExists, usernameExists] = await Promise.all([
      User.exists({ email }),
      User.exists({ username }),
    ]);

    if (emailExists) {
      return res.status(400).json({ message: "Email already in use" });
    }

    if (usernameExists) {
      return res.status(400).json({ message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email,
      username,
      password: hashedPassword,
      isPrivate: true,
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.status(201).json({
      token,
      expiresIn: TOKEN_EXPIRES_IN,
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Signup failed" });
  }
};

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  try {
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );

    res.status(200).json({
      token,
      expiresIn: TOKEN_EXPIRES_IN,
      userId: user._id,
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed" });
  }
};
