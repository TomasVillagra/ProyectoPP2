import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import MesaEditarHeader from "../../components/mesas/MesaEditarHeader";
import MesaEditarForm from "../../components/mesas/MesaEditarForm";
import MesaEditarActions from "../../components/mesas/MesaEditarActions";

import "./MesaEditar.css";

function normalize(resp) {
  if (Array.isArray(resp)) return resp;
  if (resp?.results) return resp.results;
  if (resp?.data) return resp.data;
  return [];
}

const isBlockingEstado = (raw) => {
  const s = String(raw || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
  return (
    s === "entregado" ||
    s === "en proceso" ||
    s === "en_proceso" ||
    s === "en-proceso"
  );
};

export default function MesaEditar() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [estados, setEstados] = useState([]);
  const [form, setForm] = useState({
    ms_numero: "",
    id_estado_mesa: "",
  });

  const [errors, setErrors] = useState({});
  const [msg, setMsg] = useState("");
  const [bloqueada, setBloqueada] = useState(false);

  useEffect(() => {
    api
      .get("/api/estados-mesa/")
      .then(({ data }) => setEstados(normalize(data)))
      .catch(() => {});

    api
      .get(`/api/mesas/${id}/`)
      .then(({ data }) => {
        setForm({
          ms_numero: String(data.ms_numero ?? ""),
          id_estado_mesa: String(
            data.id_estado_mesa?.id_estado_mesa ??
              data.id_estado_mesa ??
              ""
          ),
        });
      })
      .catch(() => setMsg("No se pudo cargar la mesa."));

    api
      .get("/api/pedidos/", { params: { page_size: 1000 } })
      .then(({ data }) => {
        const list = normalize(data);
        const hasBlocking = list.some((p) => {
          const estado =
            p?.estado_nombre ??
            p?.id_estado_pedido?.estp_nombre ??
            p?.estado ??
            "";
          const idMesa =
            p?.id_mesa?.id_mesa ??
            p?.id_mesa ??
            null;
          return (
            Number(idMesa) === Number(id) &&
            isBlockingEstado(estado)
          );
        });
        setBloqueada(hasBlocking);
      })
      .catch(() => {});
  }, [id]);

  const sanitizeInt = (v) => (v ?? "").toString().replace(/[^\d]/g, "");

  const blockInvalidInt = (e) => {
    if (["-", "+", "e", "E", ".", ",", " "].includes(e.key))
      e.preventDefault();
  };

  const validateField = (name, value) => {
    switch (name) {
      case "ms_numero":
        if (!value) return "Ingresá el número de mesa.";
        if (!/^\d+$/.test(String(value))) return "Debe ser entero (1+).";
        if (Number(value) < 1) return "Debe ser 1 o mayor.";
        return "";
      case "id_estado_mesa":
        if (!String(value).trim()) return "Seleccioná estado.";
        return "";
      default:
        return "";
    }
  };

  const onChange = (e) => {
    const { name } = e.target;
    let { value } = e.target;
    if (name === "ms_numero") value = sanitizeInt(value);

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value),
    }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setMsg("");

    const nextErrors = {};
    Object.keys(form).forEach((k) => {
      const m = validateField(k, form[k]);
      if (m) nextErrors[k] = m;
    });

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    if (bloqueada) return;

    try {
      await api.put(`/api/mesas/${id}/`, {
        ms_numero: Number(form.ms_numero),
        id_estado_mesa: Number(form.id_estado_mesa),
      });

      setMsg("Mesa actualizada ✅");
      setTimeout(() => navigate("/mesas"), 700);
    } catch (err) {
      console.error(err);
      setMsg("No se pudo actualizar la mesa.(Numero de mesa ya existente)");
    }
  };

  return (
    <DashboardLayout>
      <div className="mesa-edit-container">
        <MesaEditarHeader bloqueada={bloqueada} />

        {msg && <p className="mesa-edit-msg">{msg}</p>}

        <form onSubmit={onSubmit} className="mesa-edit-form">
          <MesaEditarForm
            form={form}
            errors={errors}
            estados={estados}
            bloqueada={bloqueada}
            onChange={onChange}
            blockInvalidInt={blockInvalidInt}
          />

          <MesaEditarActions
            navigate={navigate}
            bloqueada={bloqueada}
          />
        </form>
      </div>
    </DashboardLayout>
  );
}




