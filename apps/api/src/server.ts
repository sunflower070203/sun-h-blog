import { buildApp } from "./app.js";
import { config } from "./config.js";

const app = await buildApp();
await app.listen({ host: "0.0.0.0", port: config.PORT });
