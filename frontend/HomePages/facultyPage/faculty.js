// Make functions globally accessible first
window.showCategories = function() {

    document.getElementById('categories-section').style.display = 'block';
    document.getElementById('complaint-list').style.display = 'none';
    const complaintForm = document.getElementById('complaint-form');

    if (complaintForm) complaintForm.style.display = 'none';
    // Update nav buttons
    document.getElementById('categories-btn').classList.add('active');
    document.getElementById('my-complaints-btn').classList.remove('active');

};





window.showMyComplaints = function() {
    // Hide complaint form and categories
    const complaintForm = document.getElementById('complaint-form');
    if (complaintForm) complaintForm.style.display = 'none';
    
    document.getElementById('categories-section').style.display = 'none';
    document.getElementById('complaint-list').style.display = 'block';
    
    // Update nav buttons
    document.getElementById('categories-btn').classList.remove('active');
    document.getElementById('my-complaints-btn').classList.add('active');
    
    // Reload complaints
    loadMyComplaints();
};





window.showComplaintSection = function(category) {
    // Hide all content sections
    document.getElementById('categories-section').style.display = 'none';
    document.getElementById('complaint-list').style.display = 'none';
    
    // Create and show complaint form for the selected category
    const form = createComplaintForm(category);
    const contentDiv = document.getElementById('complaint-form') || createContentDiv();
    contentDiv.innerHTML = form;
    contentDiv.style.display = 'block';

};





window.submitComplaint = async function(event, category) {
    event.preventDefault();
    try {
            const title = document.getElementById('title').value;
            const description = document.getElementById('description').value;
            const file = document.getElementById('file').files[0];
    
    
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            formData.append('category', category);
        if (file) formData.append('file', file);
        
        console.log('Submitting complaint:', { title, description, category, file });
        
        await complaintAPI.submit(formData);
        showMessage('Complaint submitted successfully!','success');
        
        // Show my complaints after successful submission
        showMyComplaints();   
    } 
    catch (error) {
        alert('Error submitting complaint: ' + (error.message ||error));
    }
};





window.deleteComplaint = async function(complaintId) {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    try {
        await complaintAPI.deleteComplaint(complaintId);
        loadMyComplaints(); 
    } 
    catch (error) {
        alert('Error deleting complaint: ' + (error.message || error));
    }
};





window.logout = function() {
    // Clear all user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    localStorage.removeItem('userName');
    localStorage.removeItem('authToken');
    
    // Redirect to login page
    window.location.href = '../../logInPage/login.html';
};






// Faculty Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication and role
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (!token || userRole !== 'faculty') {
        window.location.href = '../../logInPage/login.html';
        return;
    }
    // Load initial data
    showCategories();
    
    // Set user name in header
    const userName = localStorage.getItem('userName');
    if (userName) {
        document.querySelector('.header h1').textContent = `Faculty Dashboard - ${userName}`;
    }
});






// Check if user is authenticated
function isFacultyAuthenticated() {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    return token && userRole === 'faculty';
}






// Load user's complaints
async function loadMyComplaints() {
    try {
        console.log('fetching  complaints from API...');
        const response = await complaintAPI.getMyComplaints();
        console.log('Api response:', response);

        const complaints = response.complaints;
        console.log('Complaints data:', complaints);
        const container = document.getElementById('complaints-container');
        
        if (!Array.isArray(complaints)||complaints.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No complaints found. Click "Submit Complaint" to create your first complaint.</p>';
            return;
        }
        
        container.innerHTML = `<div class="complaints-grid">${complaints.map(complaint => `
            <div class="complaint-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div>
                        <h3 style="color: var(--primary-color); margin: 0 0 0.5rem 0; font-size: 1.2rem;">${complaint.title}</h3>
                        <div style="display: flex; gap: 1rem; margin-bottom: 0.5rem;">
                            <span style="background: var(--primary-color); color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 500;">${complaint.category}</span>
                            <span style="background: ${complaint.status === 'resolved' ? '#10b981' : complaint.status === 'in-progress' ? '#f59e0b' : '#ef4444'}; color: white; padding: 0.25rem 0.75rem; border-radius: 1rem; font-size: 0.875rem; font-weight: 500;">${complaint.status}</span>
                        </div>
                        <p style="color: #666; font-size: 0.875rem; margin: 0;">${new Date(complaint.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onclick="deleteComplaint('${complaint._id}')" style="background: #ef4444; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer; font-size: 0.875rem;">Delete</button>
                </div>
                <div style="background: #f8f9fa; padding: 1rem; border-radius: 0.25rem; margin-bottom: 1rem;">
                    <p style="margin: 0; color: var(--text-primary); line-height: 1.5;">${complaint.description}</p>
                </div>
                ${complaint.attachment ? `<div style="margin-top: 1rem;"><strong style="color: var(--text-primary);">Attachment:</strong> <a href="${complaint.attachment}" target="_blank" style="color: var(--primary-color); text-decoration: none;">📎 View File</a></div>` : ''}
                ${complaint.adminResponse ? `<div style="background: #e0f2fe; padding: 1rem; border-radius: 0.25rem; margin-top: 1rem; border-left: 3px solid #0288d1;"><strong style="color: #0277bd;">Admin Response:</strong><p style="margin: 0.5rem 0 0 0; color: #01579b;">${complaint.adminResponse}</p></div>` : ''}
            </div>
        `).join('')}</div>`;
    } catch (error) {
        console.error('Error loading complaints:', error);
        document.getElementById('complaints-container').innerHTML = '<p style="color: #ef4444; text-align: center; padding: 2rem;">Error loading complaints. Please try again.</p>';
    }
}





// Delete resolved complaint
async function deleteComplaint(complaintId) {
    if (!confirm('Are you sure you want to delete this complaint?')) return;
    
    try {
        await complaintAPI.deleteComplaint(complaintId);
        loadMyComplaints(); // Refresh the list
    } catch (error) {
        alert('Error deleting complaint: ' + error.message);
    }
}





// Show complaint form (legacy function for backward compatibility)
function showContent(category) {
    showComplaintSection(category);
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
        <div style="background: var(--bg-secondary); padding: 2rem; border-radius: 0.5rem; box-shadow: var(--shadow); margin: 1rem 0;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color: var(--text-primary); margin: 0;">Submit ${category} Complaint</h2>
                <button onclick="showCategories()" style="background: var(--secondary-color); color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.25rem; cursor: pointer;">Back to Categories</button>
            </div>
            <form onsubmit="submitComplaint(event, '${category}')" style="display: flex; flex-direction: column; gap: 1rem;">
                <div>
                    <label for="title" style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Title:</label>
                    <input type="text" id="title" name="title" required style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.25rem; font-size: 1rem;">
                </div>
                
                <div>
                    <label for="description" style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Description:</label>
                    <textarea id="description" name="description" required rows="5" style="width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 0.25rem; font-size: 1rem; resize: vertical;"></textarea>
                </div>
                
                <div>
                    <label for="file" style="display: block; margin-bottom: 0.5rem; color: var(--text-primary); font-weight: 500;">Attachment (optional):</label>
                    <input type="file" id="file" name="file" style="width: 100%; padding: 0.5rem; border: 1px solid #ddd; border-radius: 0.25rem;">
                </div>
                
                <button type="submit" style="background: var(--primary-color); color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 0.25rem; cursor: pointer; font-size: 1rem; font-weight: 500; margin-top: 1rem;">Submit Complaint</button>
            </form>
        </div>
    `;
}


