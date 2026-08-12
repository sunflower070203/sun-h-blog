import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import "./public-routes.css";
import "./admin/admin.css";

createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
