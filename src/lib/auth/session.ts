const TOKEN_KEY = 'clinica_token';
const USER_KEY = 'clinica_user';

export interface SessionUser {
  usuarioId: number;
  username: string;
  nombreCompleto: string;
  email: string;
  roles: string[];
  pacienteId?: number;
}

export const session = {
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setUser: (user: SessionUser) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  getUser: (): SessionUser | null => {
    const data = localStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) as SessionUser : null;
  },
  clear: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
  isAuthenticated: () => !!localStorage.getItem(TOKEN_KEY),
};