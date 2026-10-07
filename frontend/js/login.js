const loginTab = document.getElementById('loginTab');
const registerTab = document.getElementById('registerTab');

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');

const slider = document.querySelector('.toggle-slider');


function showLogin() {
    slider.style.transform = 'translateX(0)';

    loginTab.classList.add('active');
    registerTab.classList.remove('active');

    loginForm.style.display = 'block';
    registerForm.style.display = 'none';
}


function showRegister() {
    slider.style.transform = 'translateX(100%)';

    loginTab.classList.remove('active');
    registerTab.classList.add('active');

    loginForm.style.display = 'none';
    registerForm.style.display = 'block';
}


if (sessionStorage.getItem('openRegister') === 'true') {
    sessionStorage.removeItem('openRegister');

    showRegister();

    document.documentElement.classList.remove('open-register');
} else {
    showLogin();
}


loginTab.addEventListener('click', function () {
    showLogin();
});


registerTab.addEventListener('click', function () {
    showRegister();
});



function togglePassword(button) {
    const password = button.parentElement.querySelector('input');

    if (password.type === 'password') {
        password.type = 'text';
    } else {
        password.type = 'password';
    }
}


const showPasswordButtons = document.querySelectorAll('.show-password');

showPasswordButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        togglePassword(button);
    });
});