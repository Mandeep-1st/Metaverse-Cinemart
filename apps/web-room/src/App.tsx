import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SocketProvider } from "./context/SocketProvider";
import { Space } from "./pages/Space";

function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <Routes>
          {/* Default redirect to a test room for now */}
          <Route
            path="/"
            element={<Navigate to="/room/test-movie-123" replace />}
          />
          <Route path="/room/:roomName" element={<Space />} />
        </Routes>
      </BrowserRouter>
    </SocketProvider>
  );
}

export default App;
