import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './LoginForm.css';
import { FaUserAlt, FaLock } from 'react-icons/fa';
import crownLogo from '../assets/crown-logo.png';

// ====== NUEVO: base URL del backend + función para pedir y guardar el token ======
const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000";

async function loginAndSaveToken(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/token/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Credenciales inválidas");
  const data = await res.json(); // { access, refresh }
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
}

// El componente puede seguir recibiendo setCurrentUser si lo usás en tu App
function LoginForm({ setCurrentUser }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // NUEVO: estado para mostrar error si las credenciales fallan
  const [error, setError] = useState('');

  // ====== CAMBIO CLAVE: ahora el submit es async y usa loginAndSaveToken ======
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      // pide token al backend y lo guarda en localStorage
      await loginAndSaveToken(username, password);

      // si usás un estado global de usuario, podés setear algo básico acá
      if (typeof setCurrentUser === 'function') {
        setCurrentUser({ nombre: username });
      }

      // redirigí a tu ruta protegida (ajustá si usás otra)
      navigate('/dashboard');
    } catch (e) {
      setError('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="login-form-container">
      <div className="logo-container">
        <img src={crownLogo} alt="Rex Logo" className="crown-logo" />
        <span className="logo-letter">R</span>
      </div>

      <h2>INICIAR SESION</h2>

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
          />
        </div>

        <div className="field-group">
          <label>
            <FaLock className="input-icon" /> Contraseña
          </label>
          <input
            type="password"
            placeholder="8 Caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="8"
          />
        </div>

        {/* Mensaje de error (si el login falla) */}
        {error && <p style={{ color: 'red', marginTop: 8 }}>{error}</p>}

        <button type="submit" className="login-button">
          Ingresar
        </button>
      </form>

      <div className="bottom-link">
        <span>¿No tienes cuenta? </span>
        <Link to="/register">
          Regístrate
        </Link>
      </div>
    </div>
  );
}

export default LoginForm;
