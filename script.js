class ChatMessage {
    constructor(text, isUser, language = 'es') {
        this.text = text;
        this.isUser = isUser;
         this.language = language;
    }
}

const chatMessagesDiv = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const clearChatButton = document.querySelector('.clear-chat-button');
const settingsButton = document.querySelector('.settings-button');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsModal = document.getElementById('close-settings-modal');
const themeSelector = document.getElementById('theme-selector');
const fontSelector = document.getElementById('font-selector');
const languageSelector = document.getElementById('language-selector');
const translationSelector = document.getElementById('translation-selector');
const voiceButton = document.getElementById('voice-button');
const saveChatButton = document.querySelector('.save-chat-button');
const loadChatButton = document.querySelector('.load-chat-button');
const loadChatInput = document.getElementById('load-chat-input');
const searchInput = document.getElementById('search-input');

const loadingIndicator = document.getElementById('loading-indicator');
const apiKey = 'AIzaSyB67nQ8iixZePLp9JNj_1oEDn0TJSvkLso';
let chatHistory = [];
let isVoiceRecognitionActive = false;
let recognition;
let translations = {};
let currentLanguage = localStorage.getItem('chatLanguage') || 'es';
function showLoadingIndicator(show) {
    loadingIndicator.style.display = show ? 'block' : 'none';
}

function loadChatHistory() {
    const storedHistory = localStorage.getItem('chatHistory');
      if (storedHistory) {
         chatHistory = JSON.parse(storedHistory);
         chatHistory.forEach(message => addMessageToChat(message));
     }
 }

function saveChatHistory() {
   localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}
function applyTranslations() {
document.querySelectorAll('[data-i18n]').forEach(element => {
   const key = element.getAttribute('data-i18n');
    if (translations[key]) {
       element.textContent = translations[key];
   }
   if(key === 'inputPlaceholder'){
       element.placeholder =  translations[key];
  }
   if (key === 'searchPlaceholder'){
        searchInput.placeholder = translations[key];
    }
});
}
function addMessageToChat(message) {
     const messageDiv = document.createElement('div');
     messageDiv.classList.add('message');
    if (message.isUser) {
        messageDiv.classList.add('user-message');
          messageDiv.classList.add('user-message-color');
         messageDiv.innerHTML = message.text;
    } else {
        messageDiv.classList.add('gemini-message');
         messageDiv.classList.add('gemini-message-color');
          let translatedText = message.text;
             if (translationSelector.value === 'enabled' && message.language !== languageSelector.value ) {
                 translateText(message.text, message.language, languageSelector.value).then(translation => {
                      translatedText = translation;
                     messageDiv.innerHTML = `${translatedText}  <button class="copy-button" onclick="copyToClipboard(this)"><i class="fas fa-copy"></i></button>`;
                });
            }else {
                messageDiv.innerHTML = `${translatedText}  <button class="copy-button" onclick="copyToClipboard(this)"><i class="fas fa-copy"></i></button>`;
            }
    }
   chatMessagesDiv.appendChild(messageDiv);
    chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
}
async function translateText(text, sourceLang, targetLang) {
    try {
        const response = await fetch('https://translation.googleapis.com/language/translate/v2', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': apiKey,
            },
            body: JSON.stringify({
                q: text,
                source: sourceLang,
                target: targetLang
            }),
        });
        if (!response.ok) {
            throw new Error('Error al traducir el texto: ' + response.status);
        }
       const data = await response.json();
        return data.data.translations[0].translatedText;
    } catch (error) {
        console.error("Error al traducir:", error);
        return text;
    }
}
function copyToClipboard(button) {
    const messageText = button.parentElement.innerText;
    navigator.clipboard.writeText(messageText)
        .then(() => {
           console.log('Texto copiado al portapapeles');
       })
        .catch(err => {
            console.error('Error al copiar texto: ', err);
        });
}

async function sendMessage() {
    const messageText = userInput.value.trim();
    if (!messageText) return;
      const userMessage = new ChatMessage(messageText, true, languageSelector.value);
            addMessageToChat(userMessage);
            chatHistory.push(userMessage);
            saveChatHistory();
            userInput.value = '';
            showLoadingIndicator(true);
    try {
         const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-goog-api-key': apiKey
            },
              body: JSON.stringify({
                contents: [{
                    parts: [{ text: messageText }]
                }]
            }),
        });
        if (!response.ok) {
            const error = await response.json();
             const errorMensaje = new ChatMessage(`Error al obtener respuesta: ${error.error.message}`, false);
           addMessageToChat(errorMensaje);
              chatHistory.push(errorMensaje);
             saveChatHistory();
               showLoadingIndicator(false);
            console.error("Error al consumir el API", response.status, error.error.message);
            return;
        }
        const data = await response.json();
        const geminiResponseText = data.candidates[0].content.parts[0].text;
        const geminiMessage = new ChatMessage(geminiResponseText, false, 'en');
         addMessageToChat(geminiMessage);
        chatHistory.push(geminiMessage);
          saveChatHistory();
         showLoadingIndicator(false);
    } catch (error) {
        const errorMensaje = new ChatMessage("Error inesperado. Inténtalo de nuevo más tarde.", false);
        addMessageToChat(errorMensaje);
        chatHistory.push(errorMensaje);
        saveChatHistory();
            showLoadingIndicator(false);
       console.error("Error inesperado:", error);

    }

}
  function clearChat() {
        chatMessagesDiv.innerHTML = '';
         chatHistory = [];
       localStorage.removeItem('chatHistory');
    }
    function saveChat() {
        const chatData = JSON.stringify(chatHistory);
        const blob = new Blob([chatData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
         const a = document.createElement('a');
       a.href = url;
      a.download = 'chat_history.json';
       document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

    }
    function loadChat(event) {
        const file = event.target.files[0];
          if(!file) return;
           const reader = new FileReader();
        reader.onload = function(e) {
            try {
                 const loadedHistory = JSON.parse(e.target.result);
                  if (Array.isArray(loadedHistory)) {
                      chatHistory = loadedHistory;
                       chatMessagesDiv.innerHTML = '';
                    chatHistory.forEach(message => addMessageToChat(message));
                    saveChatHistory();
                  } else{
                      alert("Formato del archivo no es valido")
                 }

           }catch (error) {
                  alert("Error al cargar el chat:" + error.message);
          }
       };
     reader.readAsText(file);
        loadChatInput.value ='';

    }
    function searchChat(searchTerm){
        const messages = chatMessagesDiv.querySelectorAll('.message');
         messages.forEach(message =>{
             const messageText = message.textContent;
              const regex = new RegExp(searchTerm, 'gi');
               const highlightedText = messageText.replace(regex, '<span class="highlight">$&