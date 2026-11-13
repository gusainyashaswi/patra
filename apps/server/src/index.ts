import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get("/", (_req, res) => {
  console.log("request in home");
  res.json({ status: "ok", message: "WELCOME TO PATRA API" });
});

app.get("/health", (_req, res) => {
  console.log("request in health");
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
