const API_URL = '/api';

class ApiService {
    static getToken() {
        return localStorage.getItem('token');
    }

    static async request(endpoint, method = 'GET', data = null) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const config = {
            method,
            headers
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${API_URL}${endpoint}`, config);
            const result = await response.json();
            
            if (!response.ok) {
                throw new Error(result.message || 'Something went wrong');
            }
            
            return result;
        } catch (error) {
            throw error;
        }
    }

    static login(username, password) {
        return this.request('/auth/login', 'POST', { username, password });
    }

    static register(username, password) {
        return this.request('/auth/register', 'POST', { username, password });
    }

    static getSheets() {
        return this.request('/sheets');
    }

    static createSheet(title) {
        return this.request('/sheets', 'POST', { title });
    }

    static deleteSheet(id) {
        return this.request(`/sheets/${id}`, 'DELETE');
    }

    static getExpenses(sheetId) {
        return this.request(`/expenses?sheetId=${sheetId}`);
    }

    static addExpense(data) {
        return this.request('/expenses', 'POST', data);
    }

    static updateExpense(id, data) {
        return this.request(`/expenses/${id}`, 'PUT', data);
    }

    static deleteExpense(id) {
        return this.request(`/expenses/${id}`, 'DELETE');
    }
}
