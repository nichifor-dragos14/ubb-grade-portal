import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'auth_token';

export interface DecodedToken {
  id?: string;
  name?: string;
  email?: string;
  exp?: number;
  role?: string | string[];
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?:
    | string
    | string[];
}

function decodeJwt(token: string): DecodedToken | null {
  try {
    const payload = token.split('.')[1];
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));

    return JSON.parse(decodeURIComponent(escape(json)));
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  token = signal<string | null>(null);
  userId = signal<string | null>(null);
  name = signal<string | null>(null);
  roles = signal<string[]>([]);
  expiresAt = signal<number | null>(null);

  constructor() {
    this.restore();
  }

  setToken(accessToken: string) {
    localStorage.setItem(TOKEN_KEY, accessToken);
    this.apply(accessToken);
  }

  getToken(): string | null {
    const memoryToken = this.token();

    if (memoryToken && !this.isExpired()) {
      return memoryToken;
    }

    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (!storedToken) {
      return null;
    }

    const decoded = decodeJwt(storedToken);
    const expMs = decoded?.exp ? decoded.exp * 1000 : null;

    if (expMs && Date.now() >= expMs) {
      this.logout();

      return null;
    }

    this.apply(storedToken);

    return storedToken;
  }

  logout() {
    localStorage.removeItem(TOKEN_KEY);

    this.token.set(null);
    this.userId.set(null);
    this.name.set(null);
    this.roles.set([]);
    this.expiresAt.set(null);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private restore() {
    const storedToken = localStorage.getItem(TOKEN_KEY);

    if (storedToken) {
      this.apply(storedToken);
    }
  }

  private apply(accessToken: string) {
    this.token.set(accessToken);

    const decoded = decodeJwt(accessToken);
    const expMs = decoded?.exp ? decoded.exp * 1000 : null;

    this.expiresAt.set(expMs);
    this.userId.set((decoded?.id as string) ?? null);
    this.name.set((decoded?.name as string) ?? null);

    const raw =
      decoded?.role ??
      decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

    const roles = Array.isArray(raw) ? raw : raw ? [raw] : [];
    this.roles.set(roles);
  }

  private isExpired(): boolean {
    const exp = this.expiresAt();

    return !!exp && Date.now() >= exp;
  }
}
