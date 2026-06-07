import { BrowserRouter, Routes, Route } from 'react-router-dom';
import FortuneWheel from './components/FortuneWheel';
import Dashboard from './pages/Dashboard';
import Validate from './pages/Validate';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FortuneWheel />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/validate/:id" element={<Validate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
