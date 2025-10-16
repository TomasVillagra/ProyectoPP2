import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function CajaPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/movimientos-caja/");
        setRows(Array.isArray(data?.results) ? data.results : data);
      } catch (e) {
        setErr("No se pudo cargar movimientos de caja");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="container"><p>Cargando caja…</p></div>;
  if (err)     return <div className="container"><p>{err}</p></div>;

  return (
    <div className="container">
      <h2>Movimientos de Caja</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Fecha</th><th>Tipo</th><th>Monto</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((r) => (
            <tr key={r.id ?? `${r.fecha}-mc`}>
              <td>{r.id ?? "-"}</td>
              <td>{r.fecha ?? r.created_at ?? "-"}</td>
              <td>{r.tipo ?? r.tipo_id ?? "-"}</td>
              <td>{r.monto ?? r.total ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
