
import './App.css';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Nav from './components/Nav';
import HistoryScreen from './components/HistoryScreen';
import ReformScreen from './components/ReformScreen';
import FactoryScreen from './components/FactoryScreen';
import RegionalScreen from './components/RegionalScreen';
import FutureScreen from './components/FutureScreen';
import AgroScreen from './components/AgroScreen';
import Screen11 from './components/Screen11';
import Screen12 from './components/Screen12';
import CoverScreen from './components/CoverScreen';
import ConclusionScreen from './components/ConclusionScreen'; 
import FdiScreen from "./components/FdiScreen";

function AppContent() {
  const location = useLocation();
  const isCoverPage = location.pathname === '/screen-1' || location.pathname === '/conclusion';

  return (
    <>
      {!isCoverPage && <Nav />}

      <Routes>
        <Route path="/" element={<Navigate to="/screen-1" replace />} />
        <Route path="/screen-1" element={<CoverScreen />} />
        <Route path="/screen-2" element={<HistoryScreen />} />
        <Route path="/screen-3" element={<ReformScreen />} />
        <Route path="/phase-2" element={<RegionalScreen />} />
        <Route path="/factory" element={<FactoryScreen />} />
        <Route path="/fdi" element={<FdiScreen />} />
        <Route path="/future" element={<FutureScreen />} />
        <Route path="/agro" element={<AgroScreen />} />
        <Route path="/screen-11" element={<Screen11/>}/>
        <Route path="/screen-12" element={<Screen12/>}/>
        <Route path="/conclusion" element={<ConclusionScreen />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

export default App;