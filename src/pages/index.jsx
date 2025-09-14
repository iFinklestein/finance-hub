import Layout from "./Layout.jsx";

import Settings from "./Settings";

import Transactions from "./Transactions";

import Dashboard from "./Dashboard";

import Accounts from "./Accounts";

import Subscriptions from "./Subscriptions";

import Budget from "./Budget";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Settings: Settings,
    
    Transactions: Transactions,
    
    Dashboard: Dashboard,
    
    Accounts: Accounts,
    
    Subscriptions: Subscriptions,
    
    Budget: Budget,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Settings />} />
                
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Transactions" element={<Transactions />} />
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Accounts" element={<Accounts />} />
                
                <Route path="/Subscriptions" element={<Subscriptions />} />
                
                <Route path="/Budget" element={<Budget />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}