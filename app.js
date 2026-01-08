
const api = axios.create({
    baseURL: "https://resume-ai-backend-lyart.vercel.app",
    withCredentials: true,
});

// Initialize
document.addEventListener("DOMContentLoaded", function () {
    checkAuth();
});

async function checkAuth() {
    try {
        const res = await api.get("/api/resume/auth");
        if (res.data.user.role === "admin") {
            window.location.href = "dashboard/index.html";
        } else {
            window.location.href = "home/index.html";
        }
    } catch (err) {

    }
}

// Mobile Menu Toggle
const mobileMenuBtn = document.getElementById("mobileMenuBtn");
const mobileMenu = document.getElementById("mobileMenu");

mobileMenuBtn.addEventListener("click", () => {
    const isOpen = mobileMenu.classList.contains("hidden");
    mobileMenu.classList.toggle("hidden");
    mobileMenuBtn.setAttribute("aria-expanded", isOpen);
});

// Auth Modal Management
function showAuthModal(form) {
    document.getElementById("authModal").classList.remove("hidden");
    switchForm(form);
    document.body.style.overflow = "hidden";
}

function closeAuthModal() {
    document.getElementById("authModal").classList.add("hidden");
    document.body.style.overflow = "auto";
}

function switchForm(form) {
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");
    if (form === "login") {
        loginForm.classList.remove("hidden");
        signupForm.classList.add("hidden");
        document.getElementById("authTitle").textContent = "Welcome Back";
    } else {
        loginForm.classList.add("hidden");
        signupForm.classList.remove("hidden");
        document.getElementById("authTitle").textContent = "Create Account";
    }
}

// Password Visibility Toggle
function togglePasswordVisibility(fieldId) {
    const field = document.getElementById(fieldId);
    const isPassword = field.type === "password";
    field.type = isPassword ? "text" : "password";
}

// Password Strength Checker
function checkPasswordStrength(password) {
    const strengthBar = document.getElementById("passwordStrengthBar");
    const strengthText = document.getElementById("passwordStrengthText");
    if (!password) {
        strengthBar.classList.add("hidden");
        strengthText.textContent = "";
        return;
    }
    strengthBar.classList.remove("hidden");
    let strength = 0;
    if (password.length >= 8) strength++;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[^a-zA-Z\d]/.test(password)) strength++;
    strengthBar.classList.remove( "strength-weak", "strength-fair", "strength-good", "strength-strong" );
    if (strength < 2) {
        strengthBar.classList.add("strength-weak");
        strengthText.textContent = "Weak password";
    } else if (strength < 3) {
        strengthBar.classList.add("strength-fair");
        strengthText.textContent = "Fair password";
    } else if (strength < 4) {
        strengthBar.classList.add("strength-good");
        strengthText.textContent = "Good password";
    } else {
        strengthBar.classList.add("strength-strong");
        strengthText.textContent = "Strong password";
    }
}

// Email Validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const errorElement = document.getElementById("signupEmailError");
    if (!emailRegex.test(email)) {
        errorElement.textContent = "Please enter a valid email address";
        errorElement.classList.remove("hidden");
    } else {
        errorElement.classList.add("hidden");
    }
}

// Form Handlers
async function handleLogin(e) {
    e.preventDefault();
    let btn = document.getElementById("loginBtn");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Logging...';
    btn.disabled = true;
    let loginEmail = document.getElementById("loginEmail").value;
    let loginPassword = document.getElementById("loginPassword").value;
    try {
        const res = await api.post('/api/login', { loginEmail, loginPassword });
        if (res.data.status === 200) {
            if (res.data.user.role === "admin") {
                setTimeout(() => { window.location.href = "./dashboard/index.html"; }, 1000);
            } else {
                setTimeout(() => { window.location.href = "./home/index.html"; }, 1000);
            }
            Swal.fire({
                title: "Login Successful!",
                text: "Welcome back! You have successfully logged in",
                icon: "success",
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            Swal.fire({
                title: "Invalid credentials",
                text: "The email or password you entered is incorrect",
                icon: "error",
                showConfirmButton: false,
                timer: 2000
            });
        }
    } catch (error) {
        console.error('Login error:', error);
    } finally {
        btn.innerHTML = 'Login';
        btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    let btn = document.getElementById("signupBtn");
    btn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Creating account...';
    btn.disabled = true;
    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;
    const confirmPasswordError = document.getElementById("confirmPasswordError");
    if (password !== confirmPassword) {
        confirmPasswordError.textContent = "Passwords do not match";
        confirmPasswordError.classList.remove("hidden");
        btn.innerHTML = 'Create Account';
        btn.disabled = false;
        return;
    }
    confirmPasswordError.classList.add("hidden");
    try {
        const res = await api.post("/api/signup", { name, email, password });
        if (res.data.status == 200) {
            setTimeout(() => { showAuthModal('login'); }, 1200);
            Swal.fire({
                title: "Signup Successful!",
                text: "Your account has been created successfully",
                icon: "success",
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            console.error('Signup error', res.data.message);
        }
    } catch (err) {
        Swal.fire({
            title: "Oops!",
            text: err.response.data.message,
            icon: "error",
            showConfirmButton: false,
            timer: 2500
        });
        console.error('Signup error:', err.response.data.message);
    }  finally {
        btn.innerHTML = 'Create Account';
        btn.disabled = false;
    }
}

// Close modal on ESC key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAuthModal();
});

// Close modal on background click
document.getElementById("authModal").addEventListener("click", (e) => {
    if (e.target.id === "authModal") closeAuthModal();
});
