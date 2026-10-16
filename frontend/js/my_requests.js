document.addEventListener('DOMContentLoaded', () => {
    const responsesTab = document.getElementById('responsesTab');
    const publicationsTab = document.getElementById('publicationsTab');

    const responsesContent = document.getElementById('responsesContent');
    const publicationsContent = document.getElementById('publicationsContent');

    const slider = document.querySelector('.requests-toggle .toggle-slider');

    function showResponses() {
        if (slider) slider.style.transform = 'translateX(0)';

        if (responsesTab) responsesTab.classList.add('active');
        if (publicationsTab) publicationsTab.classList.remove('active');

        if (responsesContent) responsesContent.style.display = 'block';
        if (publicationsContent) publicationsContent.style.display = 'none';
    }

    function showPublications() {
        if (slider) slider.style.transform = 'translateX(100%)';

        if (publicationsTab) publicationsTab.classList.add('active');
        if (responsesTab) responsesTab.classList.remove('active');

        if (publicationsContent) publicationsContent.style.display = 'block';
        if (responsesContent) responsesContent.style.display = 'none';
    }

    if (responsesTab) {
        responsesTab.addEventListener('click', showResponses);
    }

    if (publicationsTab) {
        publicationsTab.addEventListener('click', showPublications);
    }

    showResponses();
});