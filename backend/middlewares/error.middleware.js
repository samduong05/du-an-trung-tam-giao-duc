const errorMiddleware = (error, req, res, next) => {
  console.log("Loi server:", error);

  return res.status(500).json({
    message: "Loi server",
    error: process.env.NODE_ENV === "development" ? error.message : undefined,
  });
};

module.exports = errorMiddleware;
