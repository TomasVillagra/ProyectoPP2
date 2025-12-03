import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import MesaRegistrarHeader from "../../components/mesas/MesaRegistrarHeader";
import MesaRegistrarForm from "../../components/mesas/MesaRegistrarForm";
import MesaRegistrarActions from "../../components/mesas/MesaRegistrarActions";

import "./MesaRegistrar.css";

function normalize(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp?.results) return resp.results;
  if (resp?.data) return resp.data;
  return [];
}

export default function MesaRegistrar() {
  const navigate = useNavigate();
  const [estados, setEstados] = useState([]);
  const [form, setForm] = useState({
    ms_numero: "",
    id_estado_mesa: "",
  });

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");

  useEffect(() => {
    api
      .get("/api/estados-mesa/")
      .then(({ data }) => setEstados(normalize(data)))
      .catch(() => {});
  }, []);

  const sanitizeInt = (raw) =>
    (raw ?? "").toString().replace(/[^\d]/g, "");

  const blockInvalidInt = (e) => {
    if (["-", "+", "e", "E", ".", ",", " "].includes(e.key))
      e.preventDefault();
  };

  const validateField = (name, value) => {
    switch (name) {
      case "ms_numero":
        if (!value) return "Ingresá el número de mesa.";
        if (!/^\d+$/.test(String(value)))
          return "Debe ser entero (1+).";
        if (Number(value) < 1)
          return "Debe ser 1 o mayor.";
        return "";
      case "id_estado_mesa":
        if (!String(value).trim())
          return "Seleccioná estado.";
        return "";
      default:
        return "";
    }
  };

  const onChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "ms_numero") value = sanitizeInt(value);
    const next = { ...form, [name]: value };
    setForm(next);
    setErrors((p) => ({
      ...p,
      [name]: validateField(name, value),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const eAll = {};
    Object.keys(form).forEach((k) => {
      const m = validateField(k, form[k]);
      if (m) eAll[k] = m;
    });
    setErrors(eAll);
    if (Object.keys(eAll).length) return;

    try {
      await api.post("/api/mesas/", {
        ms_numero: Number(form.ms_numero),
        id_estado_mesa: Number(form.id_estado_mesa),
      });

      setMsg("Mesa creada ✅");
      setTimeout(() => navigate("/mesas"), 700);
    } catch (err) {
      console.error(err);
      setMsg(
        "No se pudo crear la mesa (número ya existente)."
      );
    }
  };

  return (
    <DashboardLayout>
      <div className="mesa-reg-container">
        <MesaRegistrarHeader />

        {msg && <p className="mesa-reg-msg">{msg}</p>}

        <form onSubmit={onSubmit} className="mesa-reg-form">
          <MesaRegistrarForm
            form={form}
            errors={errors}
            estados={estados}
            onChange={onChange}
            blockInvalidInt={blockInvalidInt}
          />

          <MesaRegistrarActions navigate={navigate} />
        </form>
      </div>
    </DashboardLayout>
  );
}


