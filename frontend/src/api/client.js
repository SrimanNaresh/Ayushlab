import axios from 'axios';

const api = axios.create({ baseURL: '/api', timeout: 60000 });

export function setAuthToken(token) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/login')) {
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e?.response?.data?.error || (e?.code === 'ECONNABORTED' ? 'The server took too long to respond' : e?.message) || 'Something went wrong';

const d = (p) => p.then((r) => r.data);

export const authApi = {
  login: (username, password) => d(api.post('/auth/login', { username, password })),
  me: () => d(api.get('/auth/me')),
  changePassword: (currentPassword, newPassword) => d(api.post('/auth/change-password', { currentPassword, newPassword })),
};
export const userApi = {
  list: () => d(api.get('/users')),
  create: (b) => d(api.post('/users', b)),
  update: (id, b) => d(api.put(`/users/${id}`, b)),
  remove: (id) => d(api.delete(`/users/${id}`)),
};
export const settingsApi = { get: () => d(api.get('/settings')), save: (b) => d(api.put('/settings', b)) };
export const testApi = {
  list: (search = '') => d(api.get('/tests', { params: { search } })),
  get: (id) => d(api.get(`/tests/${id}`)),
  create: (b) => d(api.post('/tests', b)),
  update: (id, b) => d(api.put(`/tests/${id}`, b)),
  remove: (id) => d(api.delete(`/tests/${id}`)),
  exportRows: () => d(api.get('/tests/export')),
  importRows: (rows) => d(api.post('/tests/import', { rows }, { timeout: 600000 })),
};
export const feeApi = { list: () => d(api.get('/fees')), save: (rows) => d(api.put('/fees', { rows })), sync: () => d(api.post('/fees/sync')) };
export const patientApi = {
  list: (search = '', limit) => d(api.get('/patients', { params: { search, limit } })),
  get: (id) => d(api.get(`/patients/${id}`)),
  create: (b) => d(api.post('/patients', b)),
  update: (id, b) => d(api.put(`/patients/${id}`, b)),
  remove: (id) => d(api.delete(`/patients/${id}`)),
  exportRows: () => d(api.get('/patients/export')),
  importRows: (rows) => d(api.post('/patients/import', { rows }, { timeout: 600000 })),
};
export const assignmentApi = {
  list: (params) => d(api.get('/assignments', { params })),
  get: (id) => d(api.get(`/assignments/${id}`)),
  create: (b) => d(api.post('/assignments', b)),
  update: (id, b) => d(api.put(`/assignments/${id}`, b)),
  remove: (id) => d(api.delete(`/assignments/${id}`)),
  setStatus: (id, status) => d(api.patch(`/assignments/${id}/status`, { status })),
  setTestStatus: (id, atId, status) => d(api.patch(`/assignments/${id}/tests/${atId}/status`, { status })),
};
export const resultApi = {
  forPatient: (patientId) => d(api.get(`/results/patient/${patientId}`)),
  entry: (assignmentId) => d(api.get(`/results/assignment/${assignmentId}`)),
  save: (assignmentId, values, complete) => d(api.put(`/results/assignment/${assignmentId}`, { values, complete })),
  report: (assignmentId) => d(api.get(`/results/assignment/${assignmentId}/report`)),
};
export const dashboardApi = { get: () => d(api.get('/dashboard')) };

export default api;
