import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function VentasPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/api/ventas/");
        setRows(Array.isArray(data?.results) ? data.results : data);
      } catch (e) {
        setErr("No se pudo cargar ventas");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="container"><p>Cargando ventas…</p></div>;
  if (err)     return <div className="container"><p>{err}</p></div>;

  return (
    <div className="container">
      <h2>Ventas</h2>
      <table className="table">
        <thead>
          <tr>
            <th>ID</th><th>Fecha</th><th>Método</th><th>Total</th>
          </tr>
        </thead>
        <tbody>
          {rows?.map((r) => (
            <tr key={r.id ?? `${r.fecha}-venta`}>
              <td>{r.id ?? "-"}</td>
              <td>{r.fecha ?? r.created_at ?? "-"}</td>
              <td>{r.metodo_pago ?? r.metodo_pago_id ?? "-"}</td>
              <td>{r.total ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
