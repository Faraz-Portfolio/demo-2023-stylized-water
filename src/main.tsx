import { createRoot } from "react-dom/client";
import App from "./App";
import { Creds } from "./Creds";
import "./styles.css";

const container = document.getElementById("root");
const root = createRoot(container!);
root.render(
  <>
    <App />
    <Creds />
  </>
);
