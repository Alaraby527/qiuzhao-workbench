import React, { useEffect } from 'react';
import { Route, Routes, useLocation, Navigate } from 'react-router-dom';

import Layout from './components/Layout';
import NotFound from './pages/NotFound/NotFound';
import HomePage from './pages/HomePage/HomePage';
import JobsPage from './pages/JobsPage/JobsPage';
import RhythmPage from './pages/RhythmPage/RhythmPage';
import TrainingHubPage from './pages/TrainingHubPage/TrainingHubPage';
import SettingsPage from './pages/SettingsPage/SettingsPage';
import PreparationPage from './pages/PreparationPage/PreparationPage';
import { registerServiceWorker } from './utils/register-sw';

registerServiceWorker();

const RoutesComponent = () => {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
  }, [location.pathname]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="jobs" element={<JobsPage />} />
        <Route path="kanban" element={<Navigate to="/jobs?tab=kanban" replace />} />
        <Route path="auto-apply" element={<Navigate to="/jobs?tab=auto" replace />} />
        <Route path="review" element={<Navigate to="/training?tab=review" replace />} />
        <Route path="rhythm" element={<RhythmPage />} />
        <Route path="training" element={<TrainingHubPage />} />
        <Route path="training/:category" element={<TrainingHubPage />} />
        <Route path="training/:category/:submodule" element={<TrainingHubPage />} />
        <Route path="training/:category/:submodule/:extra" element={<TrainingHubPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="preparation" element={<PreparationPage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default RoutesComponent;
