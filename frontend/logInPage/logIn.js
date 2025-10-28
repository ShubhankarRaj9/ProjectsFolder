// Authentication and form handling
document.addEventListener('DOMContentLoaded', function() {
    // Login form handler
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Register form handler
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
});

// Handle login
async function handleLogin(event) {
    if (event) event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;
    
    if (!email || !password || !role) {
        alert('Please fill in all fields');
        return;
    }

    console.log('Attempting login with:', { email, role });
    
    try {
        const response = await authAPI.login(email, password);
        console.log('Login response:', response);
        
        if (!response || !response.user) {
            console.log('No response or user data');
            alert('User does not exist. Please register first.');
            return;
        }
        
        if (response.user.role !== role) {
            console.log('Role mismatch:', response.user.role, 'vs', role);
            alert('Role mismatch. Please select the correct role.');
            return;
        }

        // Store user data
        localStorage.setItem('token', response.token);
        localStorage.setItem('authToken', response.token); // Set both token keys
        localStorage.setItem('userRole', response.user.role);
        localStorage.setItem('userId', response.user._id); // Changed from .id to ._id to match backend
        localStorage.setItem('userName', response.user.name || response.user.email);
        
        alert('Login successful!');
        console.log('User data stored, attempting redirect...');
        
        // Force redirect with timeout to ensure it happens
        setTimeout(() => {
            switch (role) {
                case 'student':
                    console.log('Redirecting to student.html');
                    window.location.href = '../HomePages/studentPage/student.html';
                    break;
                case 'faculty':
                    console.log('Redirecting to faculty dashboard');
                    window.location.href = '../HomePages/facultyPage/faculty.html';
                    break;
                case 'admin':
                    console.log('Redirecting to admin.html');
                    window.location.href = '../HomePages/adminPage/admin.html';
                    break;
                default:
                    alert('Invalid role selected.');
            }
        }, 1000);
        
    } catch (error) {
        console.error('Login error:', error);
        // Check if it's a user not found error
        if (error.message.includes('User not found') || error.message.includes('Invalid credentials')) {
            alert('User does not exist. Please register first.');
        } else {
            alert('Login failed: ' + error.message);
        }
    }
}

// Handle registration
async function handleRegister(event) {
    if (event) event.preventDefault();
    
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const role = document.getElementById('role').value;

    if (!name || !email || !password || !confirmPassword || !role) {
        alert('Please fill in all fields');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    if (password.length < 6) {
        alert('Password must be at least 6 characters long');
        return;
    }

    try {
        const response = await authAPI.register(name, email, password, role);
        alert('Registration successful!');
        
        // Store user data immediately after registration
        if (response.token && response.user) {
            localStorage.setItem('token', response.token);
            localStorage.setItem('userRole', response.user.role);
            localStorage.setItem('userId', response.user.id);
            localStorage.setItem('userName', response.user.name);
            
            // Redirect to appropriate homepage based on role
            setTimeout(() => {
                switch (role) {
                    case 'student':
                        window.location.href = '../HomePages/studentPage/student.html';
                        break;
                    case 'faculty':
                        window.location.href = '../HomePages/facultyPage/faculty.html';
                        break;
                    case 'admin':
                        window.location.href = '../HomePages/adminPage/admin.html';
                        break;
                    default:
                        alert('Invalid role selected.');
                }
            }, 1000);
        }
    } catch (error) {
        alert('Registration failed: ' + error.message);
    }
}

// Provide a page-level showMessage helper if one doesn't already exist on window.
if (typeof window.showMessage === 'undefined') {
    window.showMessage = function(message, type) {
        const messageDiv = document.getElementById('message');
        if (messageDiv) {
            messageDiv.innerHTML = `<div style="padding: 0.75rem; margin: 1rem 0; border-radius: 0.5rem; ${type === 'error' ? 'background: #fee; color: #c53030; border: 1px solid #fed7d7;' : 'background: #f0fff4; color: #2f855a; border: 1px solid #c6f6d5;'}">${message}</div>`;
            
            setTimeout(() => {
                messageDiv.innerHTML = '';
            }, 5000);
        }
    };
}

// Complaint form handling
function showContent(category) {
    const contents = document.querySelectorAll('.content');
    contents.forEach(content => content.style.display = 'none');
    
    const form = createComplaintForm(category);
    const contentDiv = document.getElementById('complaint-form') || createContentDiv();
    contentDiv.innerHTML = form;
    contentDiv.style.display = 'block';
}

function createContentDiv() {
    const div = document.createElement('div');
    div.id = 'complaint-form';
    div.className = 'content';
    document.body.appendChild(div);
    return div;
}

function createComplaintForm(category) {
    return `
        <h2>Submit ${category} Complaint</h2>
        <form onsubmit="submitComplaint(event, '${category}')">
            <label for="title">Title:</label>
            <input type="text" id="title" name="title" required>
            
            <label for="description">Description:</label>
            <textarea id="description" name="description" required></textarea>
            
            <label for="file">Attachment (optional):</label>
            <input type="file" id="file" name="file">
            
            <input type="submit" value="Submit Complaint">
        </form>
    `;
}

async function submitComplaint(event, category) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    formData.append('category', category);
    
    try {
        const response = await complaintAPI.submit(formData);
        alert('Complaint submitted successfully!');
        event.target.reset();
        
        // Hide form and show complaint list
        document.getElementById('complaint-form').style.display = 'none';
        document.getElementById('complaint-list').style.display = 'block';
        
        // Reload complaints if function exists
        if (typeof loadMyComplaints === 'function') {
            loadMyComplaints();
        }
    } catch (error) {
        alert('Error submitting complaint: ' + error.message);
    }
}

function logout() {
    // Clear all authentication data
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    
    // Redirect to login page
    window.location.href = '../logInPage/login.html';
}
