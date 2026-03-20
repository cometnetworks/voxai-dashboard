import { useState, useEffect } from 'react';
import { defaultProspects, defaultMeetings } from '../data/mockData';

export function useData() {
  const [prospects, setProspects] = useState(() => {
    const saved = localStorage.getItem('vox_prospects');
    return saved ? JSON.parse(saved) : defaultProspects;
  });
  
  const [meetings, setMeetings] = useState(() => {
    const saved = localStorage.getItem('vox_meetings');
    return saved ? JSON.parse(saved) : defaultMeetings;
  });

  const [reportsHistory, setReportsHistory] = useState(() => {
    const saved = localStorage.getItem('vox_reports_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('vox_prospects', JSON.stringify(prospects));
  }, [prospects]);

  useEffect(() => {
    localStorage.setItem('vox_meetings', JSON.stringify(meetings));
  }, [meetings]);

  useEffect(() => {
    localStorage.setItem('vox_reports_history', JSON.stringify(reportsHistory));
  }, [reportsHistory]);

  return {
    prospects, setProspects,
    meetings, setMeetings,
    reportsHistory, setReportsHistory
  };
}
