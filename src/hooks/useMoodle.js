// src/hooks/useMoodle.js
import { useState, useEffect, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_MOODLE_SERVICE_URL || 'http://localhost:5050';

async function fetchMoodle(endpoint, params = {}) {
  const cleanParams = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== 0 && v !== '')
  );
  const query    = new URLSearchParams(cleanParams).toString();
  const url      = `${BASE_URL}${endpoint}${query ? '?' + query : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
  const data = await response.json();
  if (data.error) throw new Error(data.error);
  return data;
}

function useMoodleData(endpoint, params, dataKey) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const paramsKey = JSON.stringify(params);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchMoodle(endpoint, params);
      setData(dataKey ? (result[dataKey] || []) : result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [endpoint, paramsKey]);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

export function useDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchMoodle('/api/moodle/dashboard');
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

export function useCursos() {
  return useMoodleData('/api/moodle/cursos', {}, 'cursos');
}

export function useUsuarios() {
  return useMoodleData('/api/moodle/usuarios', {}, 'usuarios');
}

export function useProgreso({ courseid, userid } = {}) {
  const params = {};
  if (courseid) params.courseid = courseid;
  if (userid)   params.userid   = userid;
  return useMoodleData('/api/moodle/progreso', params, 'progreso');
}

export function useCalificaciones({ courseid, userid } = {}) {
  const params = {};
  if (courseid) params.courseid = courseid;
  if (userid)   params.userid   = userid;
  return useMoodleData('/api/moodle/calificaciones', params, 'calificaciones');
}

export function useMatriculas({ courseid, userid } = {}) {
  const params = {};
  if (courseid) params.courseid = courseid;
  if (userid)   params.userid   = userid;
  return useMoodleData('/api/moodle/matriculas', params, 'matriculas');
}

export function useActividad({ courseid, userid, eventname } = {}) {
  const params = {};
  if (courseid)  params.courseid  = courseid;
  if (userid)    params.userid    = userid;
  if (eventname) params.eventname = eventname;
  return useMoodleData('/api/moodle/actividad', params, 'actividad');
}
