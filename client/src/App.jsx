import { useState } from 'react';
import './App.css';
import Navbar from './components/Navbar';
import ScheduleModal from './components/ScheduleModal';
import HomePage from './pages/HomePage';
import RoomsPage from './pages/RoomsPage';

export default function App() {
  const [page, setPage] = useState('home');
  const [pageProps, setPageProps] = useState({});
  const [showSchedule, setShowSchedule] = useState(false);

  const navigate = (newPage, props = {}) => {
    setPage(newPage);
    setPageProps(props);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="app">
      <Navbar
        currentPage={page}
        onNavigate={navigate}
        onOpenSchedule={() => setShowSchedule(true)}
      />

      <main className="page-content">
        {page === 'home' && (
          <HomePage
            onNavigate={navigate}
            onBook={(room) => {
              setPage('rooms');
              setPageProps(prev => ({ ...prev, autoBookRoom: room }));
            }}
          />
        )}
        {page === 'rooms' && (
          <RoomsPage
            student={pageProps.student}
            groupSize={pageProps.groupSize}
            onNavigate={navigate}
          />
        )}
      </main>

      {showSchedule && (
        <ScheduleModal onClose={() => setShowSchedule(false)} />
      )}
    </div>
  );
}
