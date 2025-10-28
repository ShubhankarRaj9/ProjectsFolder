// complaintForm.js

// Template ko cache karne ke liye variable
let complaintFormTemplate = null;

// Function jo template ko fetch karke DOM mein daalti hai
export async function renderComplaintForm(category) {
    const SUBMIT_FORM_CONTAINER_ID = 'submit-complaint-form';
    const formContainer = document.getElementById(SUBMIT_FORM_CONTAINER_ID);

    if (!formContainer) {
        console.error(`ERROR: HTML element with ID "${SUBMIT_FORM_CONTAINER_ID}" not found.`);
        return;
    }
    
    // 1. Template ko fetch karna (Sirf pehli baar)
    if (complaintFormTemplate === null) {
        try {
            const response = await fetch('complaintFormTemplate.html'); // File ka naam use kiya
            if (!response.ok) throw new Error('Template file not found');
            complaintFormTemplate = await response.text();
        } catch (error) {
            formContainer.innerHTML = `<p style="color:red;">Error loading form template: ${error.message}</p>`;
            formContainer.style.display = 'block';
            return;
        }
    }

    // 2. HTML ko DOM mein inject karna
    formContainer.innerHTML = complaintFormTemplate;
    
    // 3. Category ke hisaab se dynamic data daalna
    document.getElementById('complaint-form-title').textContent = `Submit ${category} Complaint`;
    document.getElementById('active-complaint-form').dataset.category = category; // Submission ke liye category store karna
    
    // 4. Container ko show karna
    formContainer.style.display = 'block';
}


// --- (The submission logic remains here) ---

// Function to handle the form submission logic
async function submitComplaint(event, category) {
    // ... (Your existing submission logic) ...
}

// Submission logic ko globally attach karna
window.submitComplaint = submitComplaint;