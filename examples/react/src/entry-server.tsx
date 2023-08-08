// @/src/entry-server.tsx
import ReactDOMServer from "react-dom/server";
import App from "./App";

export const render = () => {
  return ReactDOMServer.renderToString(
    <App />
  );
};