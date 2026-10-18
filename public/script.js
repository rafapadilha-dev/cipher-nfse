const form = document.getElementById('signForm');
const errorMessage = document.getElementById('errorMessage');
const outputContainer = document.getElementById('outputContainer');
const btnSubmit = document.getElementById('btnSubmit');

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Oculta mensagens de erro anteriores
    errorMessage.style.display = 'none';
    errorMessage.innerText = '';
    btnSubmit.disabled = true;
    btnSubmit.innerText = 'Assinando...';

    const formData = new FormData(form);

    try {
        const response = await fetch('/assinar', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.error || 'Falha ao assinar o XML.');
        }

        // Renderiza a caixa de texto com o resultado
        outputContainer.innerHTML = `
            <textarea id="signedOutput" readonly>${data.signedXml}</textarea>
            <div class="actions-group">
                <button type="button" class="btn-action" id="btnCopyXml" onclick="copySignedXml()">Copiar XML</button>
                <button type="button" class="btn-action" id="btnCopyBase64" onclick="copySignedBase64()">Copiar Base64</button>
            </div>
        `;

    } catch (err) {
        errorMessage.innerText = err.message;
        errorMessage.style.display = 'block';
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = 'Assinar XML';
    }
});

function triggerSuccessEffect(button, originalText) {
    button.innerText = 'Copiado!';
    button.classList.add('copied');

    setTimeout(() => {
        button.innerText = originalText;
        button.classList.remove('copied');
    }, 2000);
}

function copySignedXml() {
    const textarea = document.getElementById('signedOutput');
    if (!textarea) return;

    textarea.select();
    navigator.clipboard.writeText(textarea.value);
    
    const btn = document.getElementById('btnCopyXml');
    triggerSuccessEffect(btn, 'Copiar XML');
}

async function copySignedBase64() {
    const textarea = document.getElementById('signedOutput');
    if (!textarea || !textarea.value) return;

    const xmlText = textarea.value;
    const btn = document.getElementById('btnCopyBase64');

    try {
        // 1. Converte o texto XML para Uint8Array (UTF-8)
        const byteArray = new TextEncoder().encode(xmlText);

        // 2. Comprime o XML utilizando a API nativa GZIP do navegador
        const cs = new CompressionStream('gzip');
        const writer = cs.writable.getWriter();
        writer.write(byteArray);
        writer.close();

        const compressedResponse = new Response(cs.readable);
        const compressedBuffer = await compressedResponse.arrayBuffer();

        // 3. Converte os bytes comprimidos em string binária e depois em Base64
        const compressedBytes = new Uint8Array(compressedBuffer);
        let binary = '';
        const len = compressedBytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(compressedBytes[i]);
        }
        const base64Text = btoa(binary);

        // 4. Copia o resultado para a área de transferência
        await navigator.clipboard.writeText(base64Text);
        triggerSuccessEffect(btn, 'Copiar GZIP Base64');

    } catch (err) {
        console.error('Erro ao comprimir em GZIP:', err);
        alert('Erro ao comprimir o XML para GZIP Base64.');
    }
}