import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketProvider";
import Space from "./pages/Space";

function App() {
  return (
    <SocketProvider>
      <Space />
    </SocketProvider>
  );
}

export default App;
