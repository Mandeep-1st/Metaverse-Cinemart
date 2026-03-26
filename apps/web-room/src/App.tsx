import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Space } from "./pages/Space";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Space />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
