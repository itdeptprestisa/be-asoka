if (
  process.env.NODE_ENV === "development" &&
  process.argv[1].includes("ts-node")
) {
  require("ts-node/register");
}

if (process.env.NODE_ENV === "production") {
  require("dotenv").config({ path: ".env.production" });
} else if (process.env.NODE_ENV === "staging") {
  require("dotenv").config({ path: ".env.staging" });
} else {
  require("dotenv").config({ path: ".env" });
}

require("./src/app");
