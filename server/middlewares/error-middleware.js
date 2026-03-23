const errorMiddleware = (err, req, res, next) => {
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({
      message: "Invalid JSON body",
      details: [],
    });
  }

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";
  const details = err.details || err?.issues?.map((issue) => issue.message) || [];

  return res.status(status).json({
    message,
    details,
  });
};

module.exports = errorMiddleware;
 
