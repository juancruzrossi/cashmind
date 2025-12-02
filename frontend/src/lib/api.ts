const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface TokenResponse {
  access: string;
  refresh: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
}

class ApiService {
  private accessToken: string | null = null;

  setToken(token: string) {
    this.accessToken = token;
  }

  clearToken() {
    this.accessToken = null;
  }

  getToken() {
    return this.accessToken;
  }

  private async refreshToken(): Promise<boolean> {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refresh) return false;

    try {
      const response = await fetch(`${API_URL}/auth/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh }),
      });

      if (!response.ok) return false;

      const data: TokenResponse = await response.json();
      this.accessToken = data.access;
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access);
        if (data.refresh) {
          localStorage.setItem('refresh_token', data.refresh);
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    let headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
    };

    if (options.headers) {
      const optHeaders = options.headers as Record<string, string>;
      headers = { ...headers, ...optHeaders };
    }

    let response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401 && this.accessToken) {
      const refreshed = await this.refreshToken();
      if (refreshed) {
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error de red' }));
      throw new Error(error.detail || `Error ${response.status}`);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  }

  async requestFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const headers: HeadersInit = {
      ...(this.accessToken && { Authorization: `Bearer ${this.accessToken}` }),
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Error de red' }));
      throw new Error(error.detail || `Error ${response.status}`);
    }

    return response.json();
  }

  // Auth
  async login(username: string, password: string): Promise<TokenResponse> {
    const data = await this.request<TokenResponse>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    this.accessToken = data.access;
    return data;
  }

  async register(username: string, password: string, invitationCode: string, email?: string): Promise<TokenResponse> {
    const data = await this.request<TokenResponse>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify({
        username,
        password,
        invitation_code: invitationCode,
        email: email || '',
      }),
    });
    this.accessToken = data.access;
    return data;
  }

  async logout(): Promise<void> {
    const refresh = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (refresh) {
      await this.request('/auth/logout/', {
        method: 'POST',
        body: JSON.stringify({ refresh }),
      }).catch(() => {});
    }
    this.clearToken();
  }

  async getMe(): Promise<User> {
    return this.request<User>('/auth/me/');
  }

  // Transactions
  async getTransactions(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/transactions/${query}`);
  }

  async createTransaction(data: Record<string, unknown>) {
    return this.request('/transactions/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTransaction(id: number, data: Record<string, unknown>) {
    return this.request(`/transactions/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTransaction(id: number) {
    return this.request(`/transactions/${id}/`, { method: 'DELETE' });
  }

  async getTransactionStats(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/transactions/stats/${query}`);
  }

  async getMonthlyData(params?: Record<string, string>) {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return this.request(`/transactions/monthly/${query}`);
  }

  async getCategoryBreakdown(type: 'income' | 'expense', params?: Record<string, string>) {
    const allParams = { type, ...params };
    const query = '?' + new URLSearchParams(allParams).toString();
    return this.request(`/transactions/categories/${query}`);
  }

  // Payslips
  async getPayslips() {
    return this.request('/payslips/');
  }

  async createPayslip(data: Record<string, unknown>) {
    return this.request('/payslips/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async deletePayslip(id: number) {
    return this.request(`/payslips/${id}/`, { method: 'DELETE' });
  }

  async analyzePayslip(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.requestFormData('/payslips/analyze/', formData);
  }

  // Budgets
  async getBudgets() {
    return this.request('/budgets/');
  }

  async createBudget(data: Record<string, unknown>) {
    return this.request('/budgets/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBudget(id: number, data: Record<string, unknown>) {
    return this.request(`/budgets/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBudget(id: number) {
    return this.request(`/budgets/${id}/`, { method: 'DELETE' });
  }

  // Goals
  async getGoals() {
    return this.request('/goals/');
  }

  async createGoal(data: Record<string, unknown>) {
    return this.request('/goals/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateGoal(id: number, data: Record<string, unknown>) {
    return this.request(`/goals/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteGoal(id: number) {
    return this.request(`/goals/${id}/`, { method: 'DELETE' });
  }

  async contributeToGoal(id: number, amount: number) {
    return this.request(`/goals/${id}/contribute/`, {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }
}

export const api = new ApiService();
