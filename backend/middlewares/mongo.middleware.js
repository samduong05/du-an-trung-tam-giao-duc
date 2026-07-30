const mongoose = require("mongoose");

const isMongoConnected = () => mongoose.connection.readyState === 1;

const requireMongoConnection = (req, res, next) => {
  if (isMongoConnected()) {
    return next();
  }

  return res.status(503).json({
    message: "Chua ket noi duoc MongoDB. Kiem tra IP whitelist trong MongoDB Atlas.",
  });
};

module.exports = {
  isMongoConnected,
  requireMongoConnection,
};
