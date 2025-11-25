import { Route, Routes, BrowserRouter as Router } from "react-router-dom"
import NotFound from './pages/notfound/index.js';
import Home from './pages/home'

function App() {
  return (
    <Router>
      <Routes>
        {/* Home handles all product routes internally */}
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Home />} />
        <Route path="/strategic_map" element={<Home />} />
        <Route path="/strategic_map_v2" element={<Home />} />
        <Route path="/document_parser" element={<Home />} />
        <Route path="/contact_management" element={<Home />} />
        <Route path="/sales_management" element={<Home />} />
        <Route path="/inventory" element={<Home />} />
        <Route path="/integrations" element={<Home />} />
        <Route path="/project_management" element={<Home />} />
        <Route path="/account" element={<Home />} />
        <Route path="/users" element={<Home />} />
        <Route path="/audit_log" element={<Home />} />
        <Route path="/audit_logs" element={<Home />} />
        <Route path="/organization" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;



