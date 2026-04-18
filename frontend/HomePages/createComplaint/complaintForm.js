// complaintForm.js — attach listeners when the template/form is present
document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('active-complaint-form');
    const backBtn = document.querySelector('.btn-back');

    if (backBtn) {
        backBtn.addEventListener('click', function () {
            if (typeof showCategories === 'function') showCategories();
            else window.location.href = '/HomePages/studentPage/student.html';
        });
    }

    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const category = form.dataset.category || '';

            try {
                const title = form.querySelector('#title') ? form.querySelector('#title').value : '';
                const description = form.querySelector('#description') ? form.querySelector('#description').value : '';
                const fileInput = form.querySelector('#file');
                const file = fileInput && fileInput.files ? fileInput.files[0] : null;

                const formData = new FormData();
                formData.append('title', title);
                formData.append('description', description);
                formData.append('category', category);
                if (file) formData.append('file', file);

                await complaintAPI.submit(formData);
                // feedback
                const msg = document.createElement('div');
                msg.className = 'success-message';
                msg.textContent = 'Complaint submitted successfully!';
                document.body.appendChild(msg);
                setTimeout(() => { msg.remove(); }, 2000);

                // try to show complaints list if available
                if (typeof loadMyComplaints === 'function') loadMyComplaints();
                if (typeof showMyComplaints === 'function') showMyComplaints();
            } catch (err) {
                const msg = document.createElement('div');
                msg.className = 'error-message';
                msg.textContent = 'Error submitting complaint: ' + (err.message || err);
                document.body.appendChild(msg);
                setTimeout(() => { msg.remove(); }, 3000);
            }
        });
    }
});