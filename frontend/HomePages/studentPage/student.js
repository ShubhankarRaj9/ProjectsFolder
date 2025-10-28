/* --- GLOBAL REFERENCES --- */
// Use the ID from your updated HTML structure: 'submit-complaint-form'
const SUBMIT_FORM_CONTAINER_ID = 'submit-complaint-form';
const CATEGORIES_SECTION_ID = 'categories-section';
const COMPLAINT_LIST_ID = 'complaint-list';

// Check authentication when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and role
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'student') {
        window.location.href = '../../logInPage/login.html';
        return;
    }
    
    // Set user name in header if available
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.querySelector('.header h1').textContent = `Student Dashboard - ${userName}`;
    }
    
    // Show initial view
    showCategories();
});


window.showCategories = function() {
    // Hide other sections
    document.getElementById(COMPLAINT_LIST_ID).style.display = 'none';
    document.getElementById(SUBMIT_FORM_CONTAINER_ID).style.display = 'none';

    // Show categories
    document.getElementById(CATEGORIES_SECTION_ID).style.display = 'block';

    // Update nav buttons
    document.getElementById('categories-btn').classList.add('active');
    document.getElementById('my-complaints-btn').classList.remove('active');
};


window.showMyComplaints = function() {
    // Hide categories and form
    document.getElementById(CATEGORIES_SECTION_ID).style.display = 'none';
    document.getElementById(SUBMIT_FORM_CONTAINER_ID).style.display = 'none';

    // Show complaints list
    document.getElementById(COMPLAINT_LIST_ID).style.display = 'block';

    // Update nav buttons
    document.getElementById('categories-btn').classList.remove('active');
    document.getElementById('my-complaints-btn').classList.add('active');

    // Reload complaints
    loadMyComplaints();
};


window.showComplaintSection = function(category) {
    // 1. Hide categories and list
    document.getElementById(CATEGORIES_SECTION_ID).style.display = 'none';
    document.getElementById(COMPLAINT_LIST_ID).style.display = 'none';
    
    // 2. Get the existing form container from HTML
    const formContainer = document.getElementById(SUBMIT_FORM_CONTAINER_ID);

    // 3. Update its content with the dynamic form HTML
    if (formContainer) {
        // You should define 'createComplaintForm' separately (it's already defined below)
        formContainer.innerHTML = createComplaintForm(category);
        
        // 4. Update the form title text
        document.getElementById('complaint-form-title').textContent = `Submit Complaint: ${category}`;
        
        // 5. Show the container
        formContainer.style.display = 'block';
    } else {
        console.error(`ERROR: HTML element with ID "${SUBMIT_FORM_CONTAINER_ID}" not found.`);
        // Fallback or alert logic here
    }

    // Since we are showing the form, ensure the nav button state reflects the main action: submitting a complaint
    document.getElementById('categories-btn').classList.add('active');
    document.getElementById('my-complaints-btn').classList.remove('active');
};


window.submitComplaint = async function(event, category) {
    event.preventDefault();
    
    try {
        const title = document.getElementById('title').value;
        const description = document.getElementById('description').value;
        const fileInput = document.getElementById('file');
        const file = fileInput.files[0];
        
        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        formData.append('category', category);
        if (file) formData.append('file', file);

        console.log('Submitting complaint:', { title, description, category });
        
        await complaintAPI.submit(formData);
        
        // Show success message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = 'Complaint submitted successfully!';
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
            showMyComplaints(); // Show complaints list after submission
        }, 2000);
        
    } catch (error) {
        console.error('Submission error:', error);
        
        // Show error message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.textContent = 'Error submitting complaint: ' + (error.message || error);
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
};

/* --- The rest of the JS code (logout, DOMContentLoaded, isStudentAuthenticated, loadMyComplaints, deleteComplaint) is mostly fine and should be kept as is. --- */

// --- FIX/IMPROVEMENT for createComplaintForm ---
// NOTE: I've updated the form to use the proper ID structure for the back button and form submission.

function createComplaintForm(category) {
    return `
        <div class="complaint-form-container">
            <div class="form-header">
                <h2 id="complaint-form-title">Submit ${category} Complaint</h2>
                <button type="button" onclick="showCategories()" class="back-button">Back to Categories</button>
            </div>
            <form id="active-complaint-form" onsubmit="window.submitComplaint(event, '${category}')">
                <div class="form-group">
                    <label for="title">Title:</label>
                    <input type="text" id="title" name="title" required placeholder="Enter complaint title">
                </div>
                
                <div class="form-group">
                    <label for="description">Description:</label>
                    <textarea id="description" name="description" required rows="5" placeholder="Describe your complaint in detail"></textarea>
                </div>
                
                <div class="form-group">
                    <label for="file">Attachment (optional):</label>
                    <input type="file" id="file" name="file">
                </div>
                
                <div class="form-actions">
                    <button type="submit" class="submit-button">Submit Complaint</button>
                </div>
            </form>
        </div>
    `;
}

async function loadMyComplaints() {
    try {
        const container = document.getElementById('complaints-container');
        container.innerHTML = 'Loading...';
        
    const response = await complaintAPI.getMyComplaints();
    console.log('Loaded complaints response:', response); // Debug log
    const complaints = (response && response.complaints) || [];

    if (!Array.isArray(complaints) || complaints.length === 0) {
            container.innerHTML = `
                <div class="no-complaints">
                    <h3>No complaints found</h3>
                    <p>You haven't submitted any complaints yet.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = complaints.map(complaint => `
                <div class="complaint-card">
                <div class="complaint-header">
                    <div>
                        <h3>${complaint.title}</h3>
                        <div class="complaint-tags">
                            <span class="category-tag">${complaint.category}</span>
                            <span class="status-tag ${complaint.status.toLowerCase()}">${complaint.status}</span>
                        </div>
                        <p class="date">Submitted on: ${new Date(complaint.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onclick="deleteComplaint('${complaint._id}')" class="delete-btn">Delete</button>
                </div>
                <div class="complaint-body">
                    <p>${complaint.description}</p>
                </div>
                ${complaint.filePath ? `
                    <div class="attachment">
                        <a href="/${complaint.filePath}" target="_blank">
                            <span>View Attachment</span>
                        </a>
                    </div>
                ` : ''}
                ${complaint.resolutionNotes ? `
                    <div class="admin-response">
                        <strong>Admin Response:</strong>
                        <p>${complaint.resolutionNotes}</p>
                    </div>
                ` : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading complaints:', error);
        document.getElementById('complaints-container').innerHTML = `
            <div class="error">
                <p>Error loading complaints: ${error.message}</p>
            </div>
        `;
    }
}

async function deleteComplaint(complaintId) {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
        await complaintAPI.deleteComplaint(complaintId);
        
        // Show success message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'success-message';
        messageDiv.textContent = 'Complaint deleted successfully!';
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
            loadMyComplaints(); // Reload the list
        }, 2000);
        
    } catch (error) {
        console.error('Error deleting complaint:', error);
        
        // Show error message
        const messageDiv = document.createElement('div');
        messageDiv.className = 'error-message';
        messageDiv.textContent = 'Error deleting complaint: ' + (error.message || error);
        document.body.appendChild(messageDiv);
        
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

function logout() {
    // Clear auth token from localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    // Redirect to login page
    window.location.href = '../../logInPage/login.html';
}