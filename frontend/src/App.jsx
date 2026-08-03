import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Goods from './pages/Goods';
import GoodsDetails from './pages/GoodsDetails';
import Transactions from './pages/Transactions';
import AccountHolders from './pages/AccountHolders';
import Expenses from './pages/Expenses';
import Reports from './pages/Reports';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/goods" element={<Goods />} />
        <Route path="/goods/:id" element={<GoodsDetails />} />
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/account-holders" element={<AccountHolders />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/reports" element={<Reports />} />
      </Routes>
    </Router>
  );
}
