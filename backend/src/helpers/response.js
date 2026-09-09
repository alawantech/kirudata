/** Send a success response */
function sendSuccess(res, data = {}, msg = "Success", statusCode = 200) {
  return res.status(statusCode).json({ status: "success", msg, data });
}

/** Send an error response */
function sendError(res, msg = "Something went wrong.", statusCode = 400) {
  return res.status(statusCode).json({ status: "error", msg });
}

module.exports = { sendSuccess, sendError };
