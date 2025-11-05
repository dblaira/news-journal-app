import { supabase } from './supabase.js';

// DOM elements
const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const submitBtn = document.getElementById('submit-btn');
const formTitle = document.getElementById('form-title');
const toggleText = document.getElementById('toggle-text');
const toggleLink = document.getElementById('toggle-link');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');

let isSignUp = false;

// Toggle between sign in and sign up
toggleLink.addEventListener('click', (e) => {
    e.preventDefault();
    isSignUp = !isSignUp;

    if (isSignUp) {
        formTitle.textContent = 'Sign Up';
        submitBtn.textContent = 'Create Account';
        toggleText.textContent = 'Already have an account?';
        toggleLink.textContent = 'Sign In';
    } else {
        formTitle.textContent = 'Sign In';
        submitBtn.textContent = 'Sign In';
        toggleText.textContent = "Don't have an account?";
        toggleLink.textContent = 'Sign Up';
    }

    // Clear messages
    hideMessages();
});

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    // Basic validation
    if (!email || !password) {
        showError('Please fill in all fields');
        return;
    }

    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = isSignUp ? 'Creating Account...' : 'Signing In...';

    try {
        if (isSignUp) {
            // Sign up
            const { data, error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (error) throw error;

            showSuccess('Account created! Redirecting...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);

        } else {
            // Sign in
            const { data, error } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (error) throw error;

            showSuccess('Signed in! Redirecting...');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }

    } catch (error) {
        console.error('Auth error:', error);
        
        // Provide more helpful error messages
        let errorMsg = error.message;
        if (error.message && error.message.includes('Invalid API key')) {
            errorMsg = 'Invalid Supabase API key. Please check your configuration.';
        } else if (error.message && error.message.includes('Invalid login credentials')) {
            errorMsg = 'Invalid email or password. Please try again.';
        } else if (error.message && error.message.includes('Email not confirmed')) {
            errorMsg = 'Please check your email and confirm your account before signing in.';
        } else if (error.message) {
            errorMsg = error.message;
        } else {
            errorMsg = 'An error occurred. Please try again.';
        }
        
        showError(errorMsg);
        submitBtn.disabled = false;
        submitBtn.textContent = isSignUp ? 'Create Account' : 'Sign In';
    }
});

// Check if user is already logged in
async function checkAuth() {
    try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
            console.error('Auth check error:', error);
            // If it's an invalid key error, show it to the user
            if (error.message && error.message.includes('Invalid API key')) {
                showError('Invalid Supabase API key. Please check your configuration.');
            }
            return;
        }
        
        if (session) {
            // User is already logged in, redirect to main app
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error checking auth:', error);
        // Don't block the login page if there's an error checking auth
    }
}

// Helper functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.style.display = 'block';
}

function hideMessages() {
    errorMessage.style.display = 'none';
    successMessage.style.display = 'none';
}

// Check auth status on page load
checkAuth();