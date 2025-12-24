import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://localhost:3000/api';

class ApiService {
  private token: string | null = null;

  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem('token', token);
  }

  async getToken() {
    if (!this.token) {
      this.token = await AsyncStorage.getItem('token');
    }
    return this.token;
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem('token');
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  }

  // auth
  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
  }

  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async getMe() {
    return this.request('/auth/me');
  }

  async updateProfile(data: { name?: string; currency?: string }) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  // expenses
  async getExpenses(params?: { category?: string; startDate?: string; endDate?: string; page?: number }) {
    const query = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return this.request(`/expenses${query}`);
  }

  async getExpense(id: string) {
    return this.request(`/expenses/${id}`);
  }

  async addExpense(data: {
    amount: number;
    category: string;
    paymentMethod: string;
    description?: string;
    date?: string;
    localId?: string;
  }) {
    return this.request('/expenses', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateExpense(id: string, data: {
    amount?: number;
    category?: string;
    paymentMethod?: string;
    description?: string;
    date?: string;
  }) {
    return this.request(`/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteExpense(id: string) {
    return this.request(`/expenses/${id}`, { method: 'DELETE' });
  }

  // stats
  async getDailyStats(date?: string) {
    const query = date ? `?date=${date}` : '';
    return this.request(`/expenses/stats/daily${query}`);
  }

  async getMonthlyStats(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/expenses/stats/monthly${query}`);
  }

  async getCategoryBreakdown(month?: number, year?: number) {
    const params = new URLSearchParams();
    if (month) params.append('month', month.toString());
    if (year) params.append('year', year.toString());
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request(`/expenses/stats/categories${query}`);
  }

  async getInsights() {
    return this.request('/expenses/stats/insights');
  }

  // sync
  async syncExpenses(expenses: any[]) {
    return this.request('/expenses/sync', {
      method: 'POST',
      body: JSON.stringify({ expenses })
    });
  }
}

export const api = new ApiService();
