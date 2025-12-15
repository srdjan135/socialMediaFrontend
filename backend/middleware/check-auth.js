const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    const token = authHeader.split(" ")[1];
    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    req.userData = {
      email: decodedToken.email,
      userId: decodedToken.userId,
    };

    next();
  } catch (error) {
    console.log("AUTH:", req.headers.authorization);
    return res.status(401).json({ message: "Invalid or expired token!" });
  }
};
