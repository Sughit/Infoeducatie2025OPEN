import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Home from './pages/Home';
import Lessons from './pages/Lessons';
import Games from './pages/Games';

import Eye from './pages/Eye';
import Face from './pages/Face';
import Silhouette from './pages/Silhouette';
import Whole from './pages/Whole';

import Room from './pages/Room';
import JoinRoom from './pages/JoinRoom';

import Admin from './pages/Admin';
import AdminAuth from './pages/AdminAuth';

import Caricature from './pages/Caricature';
import Realistic from './pages/Realistic';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/games" element={<Games />} />

          <Route path="/lessons/eye" element={<Eye />} />
          <Route path="/lessons/face" element={<Face />} />
          <Route path="/lessons/silhouette" element={<Silhouette />} />
          <Route path="/lessons/whole" element={<Whole />} />

          <Route path="/room/:roomName" element={<Room />} />
          <Route path="/join" element={<JoinRoom />} />
          
          <Route path="/admin" element={<Admin />} />
          <Route path="/adminAuth" element={<AdminAuth />} />

          <Route path="/caricature" element={<Caricature />} />
          <Route path="/realistic" element={<Realistic />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
