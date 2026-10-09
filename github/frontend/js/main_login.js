const registerButton = document.getElementById('registerButton');

registerButton.addEventListener('click', function () {
    sessionStorage.setItem('openRegister', 'true');
});