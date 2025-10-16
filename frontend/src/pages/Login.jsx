import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../api/axios";
import logo from '../assets/logo.png';
import bg from '../assets/fondo.png';

export default function Login() {
  const nav = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/auth/csrf/').catch(() => {});
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
            <span className="label-text">Usuario</span>
            <input
              type="text"
              placeholder="Ej: tomas"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </label>
          <label>
            <span className="label-text">Contraseña</span>
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

      <style>{`
        .login-page {
          background-size: cover;
          background-position: center;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .login-card {
          background: rgba(20, 20, 20, 0.94);
          padding: 55px 60px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          box-shadow: 0 0 35px rgba(0,0,0,0.45);
          text-align: center;
          width: 420px;
        }

        .logo {
          width: 90px;
          height: 90px;
          object-fit: contain;
          margin-bottom: 14px;
        }

        h1 {
          color: #fff;
          font-size: 28px;
          margin: 0;
          letter-spacing: 0.3px;
        }

        .subtitle {
          color: #ccc;
          margin-bottom: 34px;
          font-size: 15px;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .label-text {
          color: #f1f1f1;
          font-size: 15px;
          margin-bottom: 6px;
          display: block;
          text-align: left;
        }

        input {
          width: 100%;
          padding: 13px 14px;
          border-radius: 10px;
          border: 1px solid #333;
          background: #1a1a1a;
          color: #fff;
          font-size: 16px;
          outline: none;
          transition: border 0.2s ease, box-shadow 0.2s ease;
        }

        input:focus {
          border-color: #dc2626;
          box-shadow: 0 0 0 1px #dc2626;
        }

        .btn {
          margin-top: 18px;
          padding: 12px 14px;
          border: none;
          border-radius: 10px;
          font-weight: bold;
          cursor: pointer;
          transition: background 0.2s ease, transform 0.1s ease;
          font-size: 16px;
        }

        .btn-primary {
          background: #dc2626;
          color: #fff;
        }

        .btn-primary:hover {
          background: #b91c1c;
          transform: translateY(-1px);
        }

        .error {
          background: rgba(220, 38, 38, 0.15);
          border: 1px solid rgba(220, 38, 38, 0.4);
          color: #fca5a5;
          padding: 10px;
          border-radius: 8px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
