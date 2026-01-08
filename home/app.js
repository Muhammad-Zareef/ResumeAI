
const api = axios.create({
    baseURL: "https://resume-ai-backend-lyart.vercel.app",
    withCredentials: true,
});

// State Management
let state = {
    currentTab: "analyzer",
    currentFilter: "all",
};

// Initialize
document.addEventListener("DOMContentLoaded", async function () {
    await checkAuth();
    await renderHistory();
    await renderJobs();
});

async function checkAuth() {
    try {
        await api.get("/api/resume/auth");
    } catch (err) {
        window.location.href = "/index.html";
        console.error('Authorization Error:', err);
    }
}

function renderJobOptions(jobs) {
    const jobSelect = document.getElementById("jobSelect");
    jobSelect.innerHTML = '<option value="">Select a job</option>';
    jobs.forEach(job => {
        const option = document.createElement("option");
        option.value = job._id; // important for backend
        option.textContent = `${job.position} — ${job.company}`;
        option.dataset.job = JSON.stringify(job); // store full object if needed
        jobSelect.appendChild(option);
    });
}

// Tab Switching
function switchTab(tab) {
    state.currentTab = tab;
    document.getElementById("analyzerSection").className = tab === "analyzer" ? "visible-section" : "hidden-section";
    document.getElementById("trackerSection").className = tab === "tracker" ? "visible-section" : "hidden-section";
    document.getElementById("analyzerTab").style.borderColor = tab === "analyzer" ? "var(--primary)" : "transparent";
    document.getElementById("analyzerTab").style.color = tab === "analyzer" ? "var(--primary)" : "var(--secondary)";
    document.getElementById("trackerTab").style.borderColor = tab === "tracker" ? "var(--primary)" : "transparent";
    document.getElementById("trackerTab").style.color = tab === "tracker" ? "var(--primary)" : "var(--secondary)";
}

// Resume Analysis
async function analyzeResume(e) {
    e.preventDefault();
    const errorMsg = document.getElementById("errorMsg");
    const errorText = document.getElementById("errorText");
    const fileInput = document.getElementById("fileInput");
    const jobSelect = document.getElementById("jobSelect");
    const file = fileInput.files[0];
    // Nothing provided
    if (!file && !jobSelect.value) {
        showError("Please upload a PDF and select a job");
        return;
    }
    if (!file) {
        showError("Please upload PDF");
        return;
    }
    if (!jobSelect.value) {
        showError("Please select a job");
        return;
    }
    // Validate PDF
    if (file) {
        const isPdfMime = file.type === "application/pdf";
        const isPdfExt = file.name.toLowerCase().endsWith(".pdf");
        if (!isPdfMime || !isPdfExt) {
            showError("Only PDF files are allowed");
            fileInput.value = "";
            return;
        }
        // Optional: file size (5MB)
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            showError("PDF size must be less than 5MB");
            fileInput.value = "";
            return;
        }
    }
    errorMsg.classList.add("hidden");
    // Build FormData
    const formData = new FormData();
    formData.append("resume", file);
    formData.append("jobId", jobSelect.value);
    // UI loading state
    const btn = document.getElementById("analyzeBtn");
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyzing...';
    try {
        const res = await api.post('/api/resume/analyze', formData );
        if (res.data.status == 200){
            displayResults(res.data.newResume);
            renderHistory();
            document.getElementById("analyzeBtn").disabled = false;
            document.getElementById("analyzeBtn").innerHTML = '<i class="fas fa-magic mr-2"></i>Analyze Resume';
        }
    } catch (err) {
        document.getElementById("analyzeBtn").disabled = false;
        document.getElementById("analyzeBtn").innerHTML = '<i class="fas fa-magic mr-2"></i>Analyze Resume';
        showError("Internal Server Error");
        console.error('Resume Analyzed Error:', err);
    }
}

// Helper
function showError(message) {
    const errorMsg = document.getElementById("errorMsg");
    const errorText = document.getElementById("errorText");
    errorText.textContent = message;
    errorMsg.classList.remove("hidden");
}

function displayResults(data) {
    const overallDash = (data.aiScore / 100) * 283;
    const atsDash = (data.aiScore / 100) * 283;
    const jobMatchDash = (data.jobMatchPercentage / 100) * 283;
    document.getElementById("scoreValue").textContent = data.aiScore;
    document.getElementById("atsScoreValue").textContent = data.atsScore;
    document.getElementById("jobMatchValue").textContent = data.jobMatchPercentage;
    document.getElementById("overallCircle").setAttribute("stroke-dasharray", `${overallDash} 283`);
    document.getElementById("atsCircle").setAttribute("stroke-dasharray", `${atsDash} 283`);
    document.getElementById("jobMatchCircle").setAttribute("stroke-dasharray", `${jobMatchDash} 283`);
    document.getElementById("scoreStatus").innerHTML = data.aiScore >= 80 ? '<i class="fas fa-check-circle mr-1"></i>Excellent' : '<i class="fas fa-alert mr-1"></i>Good';
    document.getElementById("atsStatus").innerHTML = data.atsScore >= 75 ? '<i class="fas fa-thumbs-up mr-1"></i>Optimized' : '<i class="fas fa-wrench mr-1"></i>Needs Work';
    document.getElementById("jobMatchStatus").innerHTML = data.jobMatchPercentage >= 75 ? '<i class="fas fa-thumbs-up mr-1"></i>Optimized' : '<i class="fas fa-wrench mr-1"></i>Needs Work';
    const missingSkillsHtml = data.missingSkills.map((s, i) => `
                <li class="p-3 rounded-lg border-l-4 flex gap-3" style="background-color: var(--light-bg); border-color: var(--primary);">
                    <div class="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style="background-color: var(--primary);">${i + 1}</div>
                    <span style="color: var(--dark-text);">${s}</span>
                </li>
            `
        ).join("");
    const suggestionsHtml = data.suggestions.map((s, i) => `
                <li class="p-3 rounded-lg border-l-4 flex gap-3" style="background-color: var(--light-bg); border-color: var(--primary);">
                    <div class="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center flex-shrink-0" style="background-color: var(--primary);">${i + 1}</div>
                    <span style="color: var(--dark-text);">${s}</span>
                </li>
            `
        ).join("");
    document.getElementById("missingSkillsContainer").innerHTML = missingSkillsHtml;
    document.getElementById("suggestionsContainer").innerHTML = suggestionsHtml;
    const html = data.aiImprovedText.replace(/\n/g, "<br>");
    document.getElementById("grammarContainer").innerHTML = html;
    document.getElementById("analysisTime").textContent = `Analyzed on ${new Date(data.createdAt).toLocaleDateString()}`;
    document.getElementById("resultsSection").classList.remove("hidden-section");
    document.getElementById("resultsSection").classList.add("visible-section");
    setTimeout(() => document.getElementById("resultsSection").scrollIntoView({ behavior: "smooth" }), 100);
}

// Copy text
function copyGrammarText() {
    const text = document.getElementById("grammarContainer").innerText;
    const icon = document.getElementById("copyIcon");
    if (!text.trim()) return;
    navigator.clipboard.writeText(text)
        .then(() => {
            // Change icon to check
            icon.classList.remove("fa-copy");
            icon.classList.add("fa-check");
            icon.style.color = "green";
            // Revert back after 2 seconds
            setTimeout(() => {
                icon.classList.remove("fa-check");
                icon.classList.add("fa-copy");
                icon.style.color = "var(--secondary)";
            }, 2000);
        })
        .catch(() => {
            console.error("Failed to copy text");
            alert("Failed to copy text");
        });
}

// Download text file
async function downloadGrammarText(button) {
    const text = document.getElementById("grammarContainer").innerText;
    if (!text.trim()) {
        alert("Nothing to download!");
        return;
    }
    try {
        const response = await api.post('/api/resume/download', { content: text }, { responseType: "blob" });
        const blob = new Blob([response.data], { type: "text/plain" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "professional-summary.txt";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        const icon = button.querySelector("i");
        icon.classList.replace("fa-download", "fa-check");
        icon.style.color = "green";
        setTimeout(() => {
            icon.classList.replace("fa-check", "fa-download");
            icon.style.color = "var(--secondary)";
        }, 2000);
    } catch (error) {
        console.error(error);
        alert("Download failed");
    }
}

// Job Tracker
function toggleJobForm() {
    document.getElementById("jobForm").classList.toggle("hidden");
}

async function addJob(e) {
    e.preventDefault();
    let btn = document.getElementById("addJobBtn");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Adding job...';
    btn.disabled = true;
    const company = document.getElementById("jobCompany").value;
    const position = document.getElementById("jobPosition").value;
    const description = document.getElementById("jobDescription").value;
    const status = document.getElementById("jobStatus").value;
    const notes = document.getElementById("jobNotes").value;
    const link = document.getElementById("jobLink").value;
    try {
        if (company.trim() == "" || position.trim() == "" || description.trim() == "" || notes.trim() == "") {
            Swal.fire({
                icon: "error",
                title: "Missing Information!",
                text: "Please fill in all required fields"
            });
            btn.innerHTML = 'Add Job';
            btn.disabled = false;
            return;
        }
        if (description.length < 50) {
            alert("Job description must be at least 50 characters");
            btn.innerHTML = 'Add Job';
            btn.disabled = false;
            return;
        }
        const job = {
            company,
            position,
            description,
            status,
            link,
            notes,
            appliedDate: Date.now(),
        };
        const res = await api.post('/api/jobs', job);
        Swal.fire({
            title: "Job Published!",
            text: "Your Job has been published successfully",
            icon: "success",
            showConfirmButton: false,
            timer: 2000
        });
        document.getElementById("jobForm").reset();
        await renderJobs();
        toggleJobForm();
    } catch (error) {
        console.error('Add job error:', error);
    } finally {
        btn.innerHTML = 'Add Job';
        btn.disabled = false;
    }
}

async function deleteJob(id) {
    try {
        Swal.fire({
            title: "Are you sure?",
            text: "This Job will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                await api.delete(`/api/jobs/${id}`);
                Swal.fire({
                    title: "Deleted!",
                    text: "The Job has been successfully deleted",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000
                });
                renderJobs();
            }
        });
    } catch (error) {
        console.error('Delete job error:', error);
    }
}

function filterJobs(status) {
    state.currentFilter = status;
    document.querySelectorAll(".filterBtn").forEach((btn) => {
        btn.style.backgroundColor = btn.dataset.filter === status ? "var(--primary)" : "";
        btn.style.color = btn.dataset.filter === status ? "white" : "var(--secondary)";
        btn.style.borderColor = btn.dataset.filter === status ? "var(--primary)" : "var(--border)";
    });
    renderJobs(false, status);
}

async function renderJobs(renderOptions = true, status = 'all') {
    try {
        const res = await api.get(status === "all" ? "/api/jobs" : `/api/jobs/filter?status=${status}`);
        if (renderOptions) await renderJobOptions(res.data);
        const filtered = res.data;
        const html = filtered.length === 0 ? '<div class="bg-white rounded-lg border p-12 text-center" style="border-color: var(--border);"><i class="fas fa-briefcase text-4xl mb-4 block" style="color: var(--border);"></i><p class="font-medium" style="color: var(--secondary);">No jobs yet</p><p class="text-sm" style="color: var(--secondary);">Start tracking your applications</p></div>' : filtered.map((job) => getJobCard(job)).join("");
        document.getElementById("jobsList").innerHTML = html;
        document.getElementById("jobCount").textContent = res.data.length;
        document.getElementById("jobCount").style.display = res.data.length > 0 ? "inline-block" : "none";
    } catch (error) {
        console.error('Get jobs error:', error);
    }
}

function getJobCard(job) {
    const statusColors = {
        applied: { bg: "#e3f2fd", text: "#1976d2", icon: "fa-paper-plane" },
        interviewing: { bg: "#f3e5f5", text: "#000000ff", icon: "fa-phone" },
        offered: { bg: "var(--accent)", text: "white", icon: "fa-check-circle" },
        rejected: { bg: "#ffebee", text: "#c62828", icon: "fa-times-circle" },
    };
    const colors = statusColors[job.status];
    return `
                <div class="bg-white rounded-lg border p-6" style="border-color: var(--border);">
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold mb-1" style="color: var(--dark-text);">${job.position}</h3>
                            <p style="color: var(--secondary);">${job.company}</p>
                        </div>
                        <span class="px-3 py-1 rounded-full text-sm font-semibold border" style="background-color: ${colors.bg}; color: ${colors.text};">
                            <i class="fas ${colors.icon} mr-2"></i>${job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                        </span>
                    </div>
                    ${job.description ? `<p class="text-sm mb-3 p-3 rounded" style="color: var(--secondary); background-color: var(--light-bg);">${job.description}</p>` : ""}
                    ${job.notes ? `<p class="text-sm mb-3 p-3 rounded" style="color: var(--secondary); background-color: var(--light-bg);">${job.notes}</p>` : ""}
                    <div class="flex items-center justify-between text-sm" style="color: var(--secondary);">
                        <div class="flex items-center gap-4">
                            <span><i class="fas fa-calendar-alt mr-2" style="color: var(--primary);"></i>${new Date(job.appliedDate).toLocaleDateString()}</span>
                            ${job.link ? `<a href="${job.link}" target="_blank" rel="noopener noreferrer" style="color: var(--primary);" class="hover:underline"><i class="fas fa-external-link-alt mr-1"></i>View Posting</a>` : ""}
                        </div>
                        <div class="flex gap-2">
                            <button onclick="openEditModal('${job._id}')" class="transition-colors" style="color: var(--primary);" title="Edit"><i class="fas fa-edit"></i></button>
                            <button onclick="deleteJob('${job._id}')" class="transition-colors" style="color: #c62828;" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                </div>
            `;
}

async function openEditModal(jobId) {
    try {
        const res = await api.get(`/api/jobs/${jobId}`);
        const job = res.data.job;
        document.getElementById("jobId").value = jobId;
        document.getElementById("editJobCompany").value = job.company;
        document.getElementById("editJobPosition").value = job.position;
        document.getElementById("editJobDescription").value = job.description;
        document.getElementById("editJobStatus").value = job.status;
        document.getElementById("editJobLink").value = job.link || "";
        document.getElementById("editJobNotes").value = job.notes || "";
        document.getElementById("editJobModal").classList.remove("hidden");
    } catch (err) {
        console.error('Edit Job Error:', err);
    }
}

function closeEditModal() {
    document.getElementById("editJobModal").classList.add("hidden");
    document.getElementById("editJobForm").reset();
}

async function saveJobEdit(e) {
    e.preventDefault();
    let btn = document.getElementById("saveChangesBtn");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Saving...';
    btn.disabled = true;
    const jobId = document.getElementById("jobId").value;
    const company = document.getElementById("editJobCompany").value;
    const position = document.getElementById("editJobPosition").value;
    const description = document.getElementById("editJobDescription").value;
    const status = document.getElementById("editJobStatus").value;
    const link = document.getElementById("editJobLink").value;
    const notes = document.getElementById("editJobNotes").value;
    try {
        if (company.trim() == "" || position.trim() == "" || description.trim() == "" || notes.trim() == "") {
            Swal.fire({
                icon: "error",
                title: "Missing Information!",
                text: "Please fill in all required fields"
            });
            btn.innerHTML = 'Save Changes';
            btn.disabled = false;
            return;
        }
        await api.put(`/api/jobs/${jobId}`, { company, position, description, status, link, notes });
        Swal.fire({
            title: "Updated Successfully",
            text: "Your changes have been saved",
            icon: "success",
            showConfirmButton: false,
            timer: 2000
        });
        closeEditModal();
        renderJobs();
    } catch (error) {
        console.error('Saving job error:', error);
    } finally {
        btn.innerHTML = 'Save Changes';
        btn.disabled = false;
    }
}

// History Management
function toggleHistory() {
    const sidebar = document.getElementById('historySidebar');
    const overlay = document.getElementById('historyOverlay');
    sidebar.classList.toggle('active');
    overlay.classList.toggle('active');
    // Prevent body scroll when sidebar is open on mobile
    document.body.style.overflow = sidebar.classList.contains('active') ? 'hidden' : '';
    // document.getElementById("historySidebar").classList.toggle("hidden", window.innerWidth < 768);
}

async function renderHistory() {
    try {
        const res = await api.get('/api/resume/');
        document.getElementById("historyTotal").textContent = res.data.length;
        const html = res.data.length === 0
                ? '<div class="text-center py-12" style="color: var(--secondary);"><i class="fas fa-inbox text-4xl mb-3 block opacity-30"></i><p class="text-sm">No analyses yet</p><p class="text-xs mt-1">Analyze your first resume to see it here</p></div>'
                : res.data.map((item) => `
                <div class="p-4 rounded-lg border cursor-pointer transition-colors" style="background-color: var(--light-bg); border-color: var(--border);">
                    <div onclick="viewHistory('${item._id}')" class="mb-2">
                        <div class="flex items-center justify-between mb-2">
                            <span class="font-semibold text-sm" style="color: var(--dark-text);">Score: ${item.aiScore}/100</span>
                            <span class="text-xs font-semibold px-2 py-1 rounded text-white" style="background-color: ${item.aiScore >= 80 ? "var(--accent)" : "#fbc02d"};">${item.aiScore >= 80 ? "Great" : "Good"}</span>
                        </div>
                        <p class="text-xs" style="color: var(--secondary);">${item.aiImprovedText.substring(0, 150) + "..."}</p>
                        <p class="text-xs mt-2" style="color: var(--secondary);">${new Date(item.createdAt).toLocaleDateString()}</p>
                    </div>
                    <button onclick="deleteHistory('${item._id}')" class="w-full mt-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded font-medium transition-colors">
                        <i class="fas fa-trash mr-1"></i>Delete
                    </button>
                </div>
            `).join("");
        document.getElementById("historyContent").innerHTML = html;
        document.getElementById("historyClearBtn").classList.toggle("hidden", res.data.length === 0);
    } catch (err) {
        console.error('Render History Error:', err);
    }
}

async function viewHistory(id) {
    try {
        const res = await api.get(`/api/resume/${id}`);
        displayResults(res.data.resume);
        switchTab("analyzer");
    } catch (err) {
        console.error('Get Resume Error:', err);
    }
}

function deleteHistory(id) {
    try {
        Swal.fire({
            title: "Are you sure?",
            text: "This Resume will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                await api.delete(`/api/resume/deleteResume/${id}`);
                Swal.fire({
                    title: "Deleted!",
                    text: "The Resume has been successfully deleted",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000
                });
                renderHistory();
            }
        });
    } catch (error) {
        console.error('Delete history error:', error);
    }
}

function clearAllHistory() {
    try {
        Swal.fire({
            title: "Clear All History?",
            text: "All your resume analysis history will be permanently deleted",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, delete it!"
        }).then(async (result) => {
            if (result.isConfirmed) {
                const res = await api.delete('/api/resume/clearAllHistory');
                Swal.fire({
                    title: "History Cleared!",
                    text: "Your resume history has been successfully deleted",
                    icon: "success",
                    showConfirmButton: false,
                    timer: 2000
                });
                renderHistory();
            }
        });
    } catch (error) {
        console.error('Clear all history error:', error);
    }
}

function showFileName(input) {
    const fileNameEl = document.getElementById("fileName");
    fileNameEl.textContent = `Selected file: ${input.files[0].name}`;
    fileNameEl.classList.remove("hidden");
}

function hideFileName() {
    const fileNameEl = document.getElementById("fileName");
    fileNameEl.classList.add("hidden");
}

function showModal(modal) {
    const container = document.getElementById('modalContainer');
    container.innerHTML = '';
    container.appendChild(modal);
}

function createModal(title, content, actions = '') {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 overflow-y-auto modal-backdrop';
    modal.innerHTML = `
        <div class="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:p-0">
            <div class="fixed inset-0 transition-opacity bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-75" onclick="closeModal()"></div>
            <div class="inline-block w-full max-w-2xl px-6 py-6 overflow-hidden text-left align-middle transition-all transform bg-white dark:bg-gray-800 shadow-xl rounded-2xl fade-in">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-semibold text-gray-900 dark:text-white">${title}</h3>
                    <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="mt-4">
                    ${content}
                </div>
                ${actions ? `<div class="mt-6 flex justify-end space-x-3">${actions}</div>` : ''}
            </div>
        </div>
    `;
    return modal;
}

const showLogoutModal = () => {
    const content = `
        <div class="text-center py-4">
            <div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 mb-4">
                <i class="fas fa-sign-out-alt text-yellow-600 dark:text-yellow-400 text-xl"></i>
            </div>
            <p class="text-base text-gray-900 dark:text-white">Confirm Logout</p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Are you sure you want to log out? You’ll need to login again to continue.</p>
        </div>
    `;
    const actions = `
        <button onclick="closeModal()" class="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
            Cancel
        </button>
        <button onclick="logoutUser()" class="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors">
            Logout
        </button>
    `;
    const modal = createModal('Confirm Logout', content, actions);
    showModal(modal);
}

function closeModal() {
    document.getElementById('modalContainer').innerHTML = '';
}

// Make closeModal globally accessible
window.closeModal = closeModal;

const logoutUser = async () => {
    Swal.fire({
        title: "Logged Out!",
        text: "You have been successfully logged out",
        icon: "success",
        showConfirmButton: false,
        timer: 1000
    });
    try {
        await api.post("/api/logout");
        window.location.href = "/index.html";
    } catch (err) {
        console.error('Logout Error:', err);
    }
}
