import { Hono } from "hono";
const app = new Hono();

app.get("/", (c) => c.text("🧠 ImageGen Broker root alive!"));
export default app;
