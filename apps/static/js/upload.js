document.addEventListener("DOMContentLoaded", function() {
    const fileInput = document.querySelector('.form-control-file');
    if (fileInput) {
        const fileInputWrapper = fileInput.closest('label') || fileInput.closest('div');
        if (fileInputWrapper) {
            fileInputWrapper.classList.add('dt-file-input-wrapper');
        }

        const uploadMainDiv = fileInput.closest('div').parentElement.parentElement;
        if (uploadMainDiv) {
            uploadMainDiv.classList.add('dt-upload-card');
        }

        const submitBtn = document.querySelector('form input[type="submit"], form button[type="submit"]');
        if (submitBtn) {
            const btnWrapper = submitBtn.closest('div');
            if (btnWrapper) {
                btnWrapper.classList.add('dt-upload-btn-wrap');
            }
        }

        fileInput.addEventListener('change', function(e) {
            const files = e.target.files;
            if (files && files[0]) {
                const oldPreview = document.getElementById('dt-preview-container');
                if (oldPreview) oldPreview.remove();

                const previewContainer = document.createElement('div');
                previewContainer.id = 'dt-preview-container';
                const imgElement = document.createElement('img');

                const reader = new FileReader();
                reader.onload = function(event) {
                    imgElement.src = event.target.result;
                    previewContainer.appendChild(imgElement);
                    fileInput.closest('div').after(previewContainer);
                };
                reader.readAsDataURL(files[0]);
            }
        });
    }

    const imageContents = document.querySelectorAll('.dt-image-content');
    if (imageContents.length > 0) {
        const uploadNavBtn = document.querySelector('a[href*="upload"]');
        if (uploadNavBtn) {
            const btnParent = uploadNavBtn.parentElement;
            if (btnParent && btnParent !== document.body) {
                btnParent.classList.add('dt-upload-nav-btn-wrap');
            } else {
                const wrapper = document.createElement('div');
                wrapper.classList.add('dt-upload-nav-btn-wrap');
                uploadNavBtn.parentNode.insertBefore(wrapper, uploadNavBtn);
                wrapper.appendChild(uploadNavBtn);
            }
        }

        const gridWrapper = document.createElement('div');
        gridWrapper.classList.add('dt-image-grid-container');

        const firstCard = imageContents[0];
        firstCard.parentNode.insertBefore(gridWrapper, firstCard);
        imageContents.forEach(card => {
            gridWrapper.appendChild(card);
        });
    }

    const allLinksAndButtons = document.querySelectorAll('a, button, input[type="submit"], input[type="button"]');
    allLinksAndButtons.forEach(el => {
        const text = el.textContent.trim() || el.value || '';
        const href = el.getAttribute('href') || '';
        const className = el.className || '';
        
        if (text.includes('削除') || href.includes('delete') || className.includes('btn-danger')) {
            el.classList.add('dt-delete-btn-styled');
        }
    });
});
