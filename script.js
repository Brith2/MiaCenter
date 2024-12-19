const apiKey = 'AIzaSyCROBmKaRKNo7rhxJIOTSiXVGLb5YVmXD4'; // Reemplaza con tu API Key real
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');

function addMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', type);
    messageDiv.textContent = message;
    chatContainer.appendChild(messageDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight; // Auto-scroll
}

async function sendMessage(message) {
    addMessage(message, 'user-message');
    try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + apiKey, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: message }]
                }],
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error de la API:', response.status, errorData);
            addMessage(`Error de la API: ${response.status} - ${errorData.error?.message || 'Detalles no disponibles'}`, 'gemini-message');
            return;
        }

        const data = await response.json();
          
          if(data && data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
              const geminiResponse = data.candidates[0].content.parts[0].text;
             addMessage(geminiResponse, 'gemini-message');
            } else {
               addMessage("Error: Respuesta de Gemini sin texto.", 'gemini-message');
           }
    } catch (error) {
        console.error('Error al enviar el mensaje:', error);
        addMessage("Error al conectar con Gemini o problema interno.", 'gemini-message');
    }
}

function handleSendMessage() {
    const message = userInput.value.trim();
    if (message) {
        sendMessage(message);
        userInput.value = '';
    }
}

sendButton.addEventListener('click', handleSendMessage);

userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
        handleSendMessage();
    }
});