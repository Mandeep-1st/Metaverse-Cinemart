import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import SignupPage from "./pages/SignupPage";
import TrailerPage from "./pages/TrailerPage";
import LoginPage from "./pages/LoginPage";
import CommentsPage from "./pages/CommentsPage";
import MovieInfo from "./pages/MovieInfo";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/home" element={<HomePage/>} />
        <Route path="/signup" element={<SignupPage/>} />
        <Route path="/trailer" element={<TrailerPage/>} />
        <Route path="/login" element={<LoginPage />} />           
        <Route path="/comment" element={<CommentsPage />} />           
        <Route path="/info" element={<MovieInfo />} />           
      </Routes>
    </BrowserRouter>
  );
};

export default App;
