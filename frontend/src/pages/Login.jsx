import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, setCsrfToken } from '../api/axios';
import logo from '../assets/logo.png';
import bg from '../assets/fondo.png';

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Al montar, pedimos el CSRF y guardamos el token del body
  useEffect(() => {
  api.get('/api/auth/csrf/')
    .then(({data}) => data?.csrfToken && setCsrfToken(data.csrfToken))
    .catch(() => {});
}, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setError('');
  try {
    await api.post('/api/auth/login/', { username, password });
    nav('/');
  } catch (err) {
    const msg = err?.response?.data?.detail || 'No se pudo iniciar sesión.';
    setError(msg);
  }
};


  return (
    <div className="login-page" style={{ backgroundImage: `url(${bg})` }}>
      <div className="login-card">
        <img src={logo} alt="Logo" className="logo" />
        <h1>Pizzería Rex</h1>
        <p className="subtitle">Ingresá para continuar</p>

        <form onSubmit={handleSubmit} className="login-form">
          <label>
            Usuario
            <input
              type="text"
              placeholder="tomas"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary">Ingresar</button>
        </form>
      </div>
    </div>
  );
}
