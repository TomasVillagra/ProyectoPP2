import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from "../api/axios";
import { FaUserAlt, FaLock } from 'react-icons/fa';
import crownLogo from '../assets/crown-logo.png'; 
import backgroundImage from '../assets/pizza-background.jpg';

function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/auth/csrf/').catch(() => {});
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      await api.post('/api/auth/login/', { username, password });
      navigate('/');
    } catch (err) {
      const msg = err?.response?.data?.detail || 'No se pudo iniciar sesión. Verifica tus datos.';
      setError(msg);
    }
  };

  return (
    <div className="login-page-container">
      <div className="login-form-container">
        <div className="logo-container">
          <img src={crownLogo} alt="Rex Logo" className="crown-logo" />
        </div>

        <h2>INICIAR SESIÓN</h2>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label>
              <FaUserAlt className="input-icon" /> Usuario
            </label>
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="field-group">
            <label>
              <FaLock className="input-icon" /> Contraseña
            </label>
            <input
              type="password"
              placeholder="Tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="login-button">
            Ingresar
          </button>
        </form>
      </div>

      <style>{`
        .login-page-container {
          background-image: url(${backgroundImage});
          background-size: cover;
          background-position: center;
          background-repeat: no-repeat;
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;

          /* ▼▼▼ ESTAS SON LAS LÍNEAS MODIFICADAS ▼▼▼ */
          justify-content: flex-end; /* Alinea el contenido a la derecha */
          padding-right: 10%;      /* Añade un margen a la derecha */
          box-sizing: border-box;   /* Asegura que el padding no cause desbordamiento */
        }
        
        .login-form-container {
          width: 420px;
          padding: 50px 60px;
          background: rgba(18, 18, 18, 0.75);
          border-radius: 18px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          backdrop-filter: blur(15px);
          -webkit-backdrop-filter: blur(15px);
          color: #e0e0e0;
          display: flex;
          flex-direction: column;
          align-items: center;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .logo-container {
          width: 100%;
          height: 80px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin-bottom: 25px;
          position: relative;
          overflow: hidden;
        }

        .crown-logo {
          max-width: 90px;
          max-height: 90px;
          width: auto;
          height: auto;
          object-fit: contain;
          opacity: 1;
          transition: transform 0.3s ease-in-out;
        }

        .crown-logo:hover {
            transform: scale(1.05);
        }

        .login-form-container h2 {
          font-weight: 600;
          margin-bottom: 35px;
          letter-spacing: 2px;
          text-align: center;
          color: #f8f8f8;
        }

        .field-group {
          width: 100%;
          margin-bottom: 28px;
        }

        .field-group label {
          display: flex;
          align-items: center;
          margin-bottom: 10px;
          font-size: 0.95rem;
          color: #bbbbbb;
          font-weight: 500;
        }

        .input-icon {
          margin-right: 12px;
          color: #999;
          font-size: 1.1rem;
        }

        .field-group input {
          width: 100%;
          padding: 14px 18px;
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid #333;
          border-radius: 10px;
          color: #fff;
          font-size: 1.05rem;
          transition: border-color 0.3s ease, box-shadow 0.3s ease;
        }

        .field-group input::placeholder {
          color: #888;
        }

        .field-group input:focus {
          outline: none;
          border-color: #e53935;
          box-shadow: 0 0 12px rgba(229, 57, 53, 0.6);
          background: rgba(0, 0, 0, 0.4);
        }

        .login-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(90deg, #e53935, #c62828);
          border: none;
          border-radius: 10px;
          color: #fff;
          font-size: 1.2rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s ease, box-shadow 0.3s ease, background 0.3s ease;
          margin-top: 20px;
          letter-spacing: 1px;
        }

        .login-button:hover {
          transform: translateY(-3px);
          box-shadow: 0 6px 20px rgba(229, 57, 53, 0.5);
          background: linear-gradient(90deg, #c62828, #b71c1c);
        }

        .error-message {
          background: rgba(229, 57, 53, 0.15);
          border: 1px solid rgba(229, 57, 53, 0.4);
          color: #fca5a5;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          text-align: center;
          margin-bottom: 20px;
          width: 100%;
        }
      `}</style>
    </div>
  );
}

export default Login;