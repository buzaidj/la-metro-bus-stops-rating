import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { DataSummary } from './DataSummary.tsx';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path='/summary' element={<DataSummary />} />
        <Route path="*" element={<App />} />
      </Routes>
    </Router>
  </React.StrictMode>,
)
