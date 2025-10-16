import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function PedidosPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/pedidos/");
        setRows(Array.isArray(data?.results) ? data.results : data);
      } catch (e) {
        setErr("No se pudo cargar pedidos");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="container"><p>Cargando pedidos…</p></div>;
  if (err)     return <div className="container"><p>{err}</p></div>;

  return (
    <div className="container">
      <h2>Pedidos</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Fecha</th><th>Cliente</th><th>Estado</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((r) => (
            <tr key={r.id ?? `${r.cliente}-${r.fecha}`}>
              <td>{r.id ?? "-"}</td>
              <td>{r.fecha ?? r.created_at ?? "-"}</td>
              <td>{r.cliente ?? r.cliente_id ?? "-"}</td>
              <td>{r.estado ?? r.estado_id ?? "-"}</td>
              <td>{r.total ?? r.monto_total ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
