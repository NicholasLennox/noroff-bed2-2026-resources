const app = require("./app");

// App Service sets PORT for us; 3000 is the local default.
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Listening on http://localhost:${PORT}`);
});
