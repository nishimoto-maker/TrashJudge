document.addEventListener("DOMContentLoaded", function() {
    // --- 1. 画像アップロード画面用の処理 ---
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
            if (files && files) {
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
                reader.readAsDataURL(files);
            }
        });
    }

    // --- 2. 投稿一覧画面（画像新規登録ボタンの配置 ＆ カードの2列化） ---
    const imageContents = document.querySelectorAll('.dt-image-content');
    if (imageContents.length > 0) {
        // 「画像新規登録」ボタン（aタグなど）を直接探す
        const uploadNavBtn = document.querySelector('a[href*="upload"]');
        if (uploadNavBtn) {
            // ボタンがすでにdivに包まれていればそのdivに、なければ親要素にクラスを付与
            const btnParent = uploadNavBtn.parentElement;
            if (btnParent && btnParent !== document.body) {
                btnParent.classList.add('dt-upload-nav-btn-wrap');
            } else {
                // 親がbody等の場合は新しくdivを作って包む
                const wrapper = document.createElement('div');
                wrapper.classList.add('dt-upload-nav-btn-wrap');
                uploadNavBtn.parentNode.insertBefore(wrapper, uploadNavBtn);
                wrapper.appendChild(uploadNavBtn);
            }
        }

        // 新しく2列並び専用の「箱（div）」を作成
        const gridWrapper = document.createElement('div');
        gridWrapper.classList.add('dt-image-grid-container');

        // 最初の投稿カードの直前に挿入して中身を引っ越し
        const firstCard = imageContents[0];
        firstCard.parentNode.insertBefore(gridWrapper, firstCard);
        imageContents.forEach(card => {
            gridWrapper.appendChild(card);
        });
    }

    // 「削除」ボタン・リンクを徹底的に見つけてクラスを付与
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
