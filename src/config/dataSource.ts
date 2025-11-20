import "reflect-metadata";
import { DataSource } from "typeorm";

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

const dataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306"),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
  synchronize: false,
  logging: true,
  entities: [__dirname + "/../entities/*.{js,ts}"],
  migrations: [],
  subscribers: [],
});

export default dataSource;
