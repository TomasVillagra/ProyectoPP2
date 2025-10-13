import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './RegisterForm.css';
import { FaUser, FaEnvelope, FaLock } from 'react-icons/fa';

function RegisterForm() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    correo: '',
    password: '',
    repetirPassword: '',
  });

  // NUEVO: Un único estado para un mensaje de error general
  const [formError, setFormError] = useState('');

  const [passwordCriteria, setPasswordCriteria] = useState({
    minLength: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  useEffect(() => {
    setPasswordCriteria({
      minLength: formData.password.length >= 6,
      uppercase: /[A-Z]/.test(formData.password),
      lowercase: /[a-z]/.test(formData.password),
      number: /\d/.test(formData.password),
    });
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({ ...prevState, [name]: value }));
    // Si el usuario empieza a escribir, borramos el mensaje de error
    if (formError) {
      setFormError('');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    // Verificamos si algún campo está vacío
    const isAnyFieldEmpty = Object.values(formData).some(value => value === '');
    if (isAnyFieldEmpty) {
      setFormError('Todos los campos son obligatorios');
      return;
    }

    // Verificamos si las contraseñas coinciden
    if (formData.password !== formData.repetirPassword) {
      setFormError('Las contraseñas no coinciden');
      return;
    }

    // Si todo está bien, borramos cualquier error y enviamos
    setFormError('');
    alert(`Usuario registrado con éxito:\n${formData.nombre} ${formData.apellido}\n${formData.correo}`);
  };

  const CriteriaItem = ({ text, met }) => (
    <li className={met ? 'met' : ''}>
      <span className="criteria-dot"></span>
      {text}
    </li>
  );
  
  return (
    <div className="register-form-container">
      <h2>REGÍSTRATE</h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Ya no necesitamos onBlur ni className dinámico en los inputs */}
        <div className="field-group">
          <label><FaUser className="input-icon" /> Ingrese su nombre</label>
          <input type="text" name="nombre" value={formData.nombre} onChange={handleChange} required />
        </div>

        <div className="field-group">
          <label><FaUser className="input-icon" /> Ingrese su apellido</label>
          <input type="text" name="apellido" value={formData.apellido} onChange={handleChange} required />
        </div>
        
        <div className="field-group">
          <label><FaEnvelope className="input-icon" /> Ingrese su correo</label>
          <input type="email" name="correo" value={formData.correo} onChange={handleChange} required />
        </div>

        <div className="field-group">
          <label><FaLock className="input-icon" /> Contraseña</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>

        <ul className="password-criteria">
          <p>Mínimo 6 Caracteres</p>
          <CriteriaItem text="Una mayúscula" met={passwordCriteria.uppercase} />
          <CriteriaItem text="Una minúscula" met={passwordCriteria.lowercase} />
          <CriteriaItem text="Un número" met={passwordCriteria.number} />
        </ul>

        <div className="field-group">
          <label><FaLock className="input-icon" /> Repetir Contraseña</label>
          <input type="password" name="repetirPassword" value={formData.repetirPassword} onChange={handleChange} required />
        </div>
        
        {/* NUEVO: Contenedor para el mensaje de error general */}
        {formError && <p className="global-error-message">{formError}</p>}

        <button type="submit" className="register-button">
          Registrarse
        </button>
      </form>

      <div className="bottom-link">
        <span>¿Ya tienes cuenta? </span>
        <Link to="/">
          Inicia sesión
        </Link>
      </div>
    </div>
  );
}

export default RegisterForm;