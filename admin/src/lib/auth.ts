export function persistAdminSession(session: any, user?: any) {
  if (session?.access_token) {
    localStorage.setItem('kp_access_token', session.access_token);
  } else {
    localStorage.removeItem('kp_access_token');
  }

  if (session?.refresh_token) {
    localStorage.setItem('kp_refresh_token', session.refresh_token);
  } else {
    localStorage.removeItem('kp_refresh_token');
  }

  if (user) {
    localStorage.setItem('kp_user', JSON.stringify(user));
  }
}

export function clearAdminSession() {
  localStorage.removeItem('kp_access_token');
  localStorage.removeItem('kp_refresh_token');
  localStorage.removeItem('kp_user');
}
