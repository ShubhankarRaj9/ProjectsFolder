// API Configuration and Authentication
const API_BASE_URL = 'http://localhost:3000/api';

// Token management
const getToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');
const setToken = (token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('authToken', token); // For backward compatibility
};

const removeToken = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
};

// API request helper
const apiRequest = async (endpoint, options = {}) => {
    const token = getToken();
    const config = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'x-auth-token': token }),
            ...options.headers,
        },
        ...options,
    };
    if (options.body instanceof FormData) {
        delete config.headers['Content-Type']; // Let browser set it for FormData
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'API request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
};

// Authentication API calls
const authAPI = {
    login: async (email, password) => {
        const response = await apiRequest('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ instituteEmailId: email, password }),
        });

        if (response.token) {
            // Save token
            setToken(response.token);

            // Save user details if backend sends them
            if (response.user) {
                localStorage.setItem("userId", response.user._id || "");
                localStorage.setItem("userName", response.user.name || response.user.instituteEmailId || "");
                localStorage.setItem("userRole", response.user.role || "");
            }
        }
        return response;
    },

    register: async (name, email, password, role) => {
        const response = await apiRequest('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, instituteEmailId: email, password, role }),
        });

        if (response.token) {
            setToken(response.token);
        }

        return response;
    },

    logout: () => {
        removeToken();
        window.location.href = '../logInPage/login.html';
    }
};

// Complaint API calls
const complaintAPI = {
    submit: async (formData) => {
        const token = getToken();
        const response = await fetch(`${API_BASE_URL}/complaints/submit`, {
            method: 'POST',
            headers: {
                'x-auth-token': token,
            },
            body: formData, // FormData for file upload
        });

        let data;

        try {
            data = await response.json();
        } catch {
            data = {};
        }

        if (!response.ok) {
            console.error("Server response:", data);
            throw new Error(data.message || 'Failed to submit complaint');
        }

        return data;
    },

    getMyComplaints: async (page = 1, limit = 10, status = '') => {
        const params = new URLSearchParams({ page, limit });
        if (status) params.append('status', status);

        return await apiRequest(`/complaints/my-complaints?${params}`);
    },

    getAdminDashboard: async () => {
        return await apiRequest('/complaints/admin/dashboard');
    },

    resolveComplaint: async (complaintId, resolutionNotes = '') => {
        return await apiRequest(`/complaints/${complaintId}/resolve`, {
            method: 'PATCH',
            body: JSON.stringify({ resolutionNotes }),
        });
    },

    deleteComplaint: async (complaintId) => {
        return await apiRequest(`/complaints/${complaintId}`, {
            method: 'DELETE',
        });
    }
};

// User API calls
const userAPI = {
    getProfile: async () => {
        return await apiRequest('/users/profile');
    },

    updateProfile: async (userData) => {
        return await apiRequest('/users/profile', {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    getAllUsers: async () => {
        return await apiRequest('/users');
    }
};

// Utility functions
const isAuthenticated = () => !!getToken();

// Redirect if not authenticated
const redirectIfNotAuthenticated = () => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return true;
    }
    return false;
};

// Define a global showMessage helper only if it doesn't already exist.
// Some pages (login/register) also define a local showMessage; guard to avoid redeclaration errors.
if (typeof window.showMessage === 'undefined') {
    window.showMessage = (message, type = 'info') => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            border-radius: 5px;
            color: white;
            z-index: 1000;
            background-color: ${type === 'error' ? '#dc3545' : type === 'success' ? '#28a745' : '#007bff'};
        `;

        document.body.appendChild(messageDiv);

        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    };
}
