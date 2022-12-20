function handleError(message, user, res) {
  if (message === "INVALID_USER") {
    renderError(400, `Sorry, "${user}" is an invalid user format`, res);
  } else if (message === "NO_USER") {
    renderError(
      400,
      `Sorry, there doesn't seem to be an account specified`,
      res
    );
  } else if (message === "FAILED_REDIRECT" || message === "REQUEST_ERROR") {
    renderError(
      500,
      `Sorry, there was an error trying to get to the server for "${user}"`,
      res
    );
  } else if (message === "INVALID_JSON") {
    renderError(
      500,
      `Sorry, there was an error trying process the data returned from the server for "${user}"`,
      res
    );
  } else if (message === "NETWORK_ERROR") {
    renderError(
      500,
      `Sorry, there was an error trying to get to the server for "${user}"`,
      res
    );
  } else {
    renderError(500, `Sorry, there was an error`, res);
  }
}

function renderError(status, message, res) {
  res.statusCode = status;
  return res.render(
    "error.njk",
    {
      message,
      title: "Error",
    },
    "layout.njk"
  );
}

module.exports = handleError;
