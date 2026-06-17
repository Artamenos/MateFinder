import cors from "cors";
import express from "express";
import morgan from "morgan";
import { config } from "./config.js";
import { authRouter } from "./routes/auth.js";
import { faceitRouter } from "./routes/faceit.js";
import { inviteRouter } from "./routes/invites.js";
import { profileRouter } from "./routes/profiles.js";

const app = express();

app.use(cors({ origin: config.clientOrigin, credentials: true }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", project: "CS2 Team Finder" });
});

app.use("/api/auth", authRouter);
app.use("/api/profiles", profileRouter);
app.use("/api/faceit", faceitRouter);
app.use("/api/invites", inviteRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(config.port, () => {
  console.log(`API listening on http://localhost:${config.port}/api`);
});
