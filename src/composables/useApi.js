import { ref } from 'vue';
import { load } from 'recaptcha-v3';
import { auth0 } from '../auth0';
let public_recaptcha = null;
const notifications = ref([]);

export default function useApi() {
  const data = ref(null);
  const loading = ref(true);

  async function concatRecaptchaToBody(body, settings) {
    await waitForRecaptchaToken();
    const recaptcha = await load(public_recaptcha);
    body.recaptchaToken = await recaptcha.execute(settings.action || 'submit');
  }

  async function getAuth0Token() {
    const { getAccessTokenSilently, isAuthenticated } = auth0;
    return isAuthenticated.value
      ? await getAccessTokenSilently()
      : null;
  }

  async function retrievePublicRecaptcha() {
    if (public_recaptcha) return;
    
    public_recaptcha = 'loading...';

    const response = await fetch('/api/auth/recaptcha/public', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error('Network response was not ok.');
    }

    const { token } = await response.json();
    public_recaptcha = token;
  }
  
  retrievePublicRecaptcha();

  async function waitForRecaptchaToken() {
    while(!public_recaptcha || public_recaptcha === 'loading...') {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async function request(method, url, body = null, settings = {}) {
    loading.value = true;

    const auth0Token = await getAuth0Token();

    try {
      if (settings.checkIfHuman) {
        await concatRecaptchaToBody(body, settings);
      }

      const baseUrl = settings.baseUrl || '/api/';

      if (url.startsWith('/')) {
        url = url.slice(1);
      }

      const headers = {
        'Content-Type': 'application/json',
        ...settings.headers
      };

      if (auth0Token) {
        headers.Authorization = `Bearer ${auth0Token}`;
      }

      const response = await fetch(baseUrl + url, { 
        method,
        body: body ? JSON.stringify(body) : null,
        headers
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'API Request Failed');
      }
  
      data.value = await response.json();
  
      return data.value;
    } catch (err) {
      notify({ message: err.message });
      throw new Error(err.message);
    } finally {
      loading.value = false;
    }
  }

  function notify(messages, { sustain } = {}) {
    // Convert single message to array if necessary
    const messageArray = Array.isArray(messages) ? messages : [messages];
    
    messageArray.forEach(message => {
      const messageText = message.message || message;
      const messageType = message.type || 'ERROR';
      const messageId = Math.random().toString();
      
      const duplicateMessage = notifications.value.find(m => m.message === messageText);
      
      if (duplicateMessage) {
        duplicateMessage.messageId = messageId;
      } else {
        notifications.value.push({
          messageId,
          message: messageText,
          type: messageType
        });
      }
      
      if (!sustain) {
        setTimeout(() => {
          removeNotification(messageId);
        }, 10*1000);
      }
    });
  }
  
  function removeNotification(messageId) {
    notifications.value = notifications.value.filter(n => n.messageId !== messageId);
  }

  return {
    data,
    loading,
    get: (url, settings) => request('GET', url, null, settings),
    post: (url, body, settings) => request('POST', url, body, settings),
    put: (url, body, settings) => request('PUT', url, body, settings),
    remove: (url, body, settings) => request('DELETE', url, body, settings),
    notifications,
    removeNotification,
    notify
  };
}