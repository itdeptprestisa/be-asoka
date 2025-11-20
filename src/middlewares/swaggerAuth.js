const auth = require("basic-auth");
const bcrypt = require("bcrypt");
const Users = require("../models/users");

module.exports = async (req, res, next) => {
  const credentials = auth(req);

  if (!credentials || !credentials.name || !credentials.pass) {
    res.set("WWW-Authenticate", 'Basic realm="Swagger"');
    return res.status(401).send("Authentication required.");
  }

  try {
    const foundUser = await Users.findOne({
      where: {
        email: credentials.name,
        dept: "IT",
      },
    });

    if (
      !foundUser ||
      !(await bcrypt.compare(
        credentials.pass,
        foundUser.password.replace("$2y$", "$2b$")
      ))
    ) {
      res.set("WWW-Authenticate", 'Basic realm="Swagger"');
      return res.status(401).send("Invalid credentials.");
    }

    // Optional: attach user info to req for later use
    req.authUser = foundUser;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).send("Internal Server Error");
  }
};
