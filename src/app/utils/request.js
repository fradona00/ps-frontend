export async function request({ url, method = 'POST', body = {}, loadFunction, token }) {
    try {
      if (loadFunction) loadFunction(true);
  
      const headers = {
        'Content-Type': 'application/json',
      };
  
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
  
      const response = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
      });
      let data = null;
      if (response.ok) {
        data = await response.json();
      }
      if (response.status === 401) {
        alert('Sessione scaduta, effettua il login per continuare');
        window.location.href = '/logout';
      }
      if (response.status === 500) {
        alert('Il server ha riscontrato un errore, riprova più tardi');
      }

      if (loadFunction) loadFunction(false);
  
      return { ok: response.ok, status: response.status, data };
    } catch (error) {
      if (loadFunction) loadFunction(false);
      console.error('Errore nella fetch:', error);
      return { ok: false, error, data:[]};
    }
  }
  