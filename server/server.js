const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const authRouter = require("./router/auth-router");
const connectDb = require("./utils/db");
const errorMiddleware = require("./middlewares/error-middleware");

const corsOptions = {
  origin: process.env.CLIENT_ORIGIN || true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: false,
};
app.use(cors(corsOptions));
// to get the json data in express app.
app.use(express.json());

// Mount the Router: To use the router in your main Express app, you can "mount" it at a specific URL prefix
app.use("/api/auth", authRouter);

app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
connectDb().then(() => {
  app.listen(PORT, () => {
    console.log(`server is running at port: ${PORT}`);
  });
}).catch((error) => {
  console.error(error.message);
  process.exit(1);
});
