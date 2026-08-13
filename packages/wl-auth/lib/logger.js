function logEvent(level, message, fields = {}) {
  const entry = {
    ts: new Date().toISOString(),
    level,
    message,
    ...fields,
  };
  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

module.exports = {
  info: (message, fields) => logEvent("info", message, fields),
  warn: (message, fields) => logEvent("warn", message, fields),
  error: (message, fields) => logEvent("error", message, fields),
};
