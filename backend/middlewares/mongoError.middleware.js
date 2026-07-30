const mongoErrorMiddleware = (error, req, res, next) => {
  if (error.type === "entity.too.large") {
    return res.status(413).json({
      message: "File qua lon. Vui long chon file nho hon.",
    });
  }

  return next(error);
};

module.exports = mongoErrorMiddleware;
