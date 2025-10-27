import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalizeList(d) {
  if (Array.isArray(d)) return d;
  if (d?.results) return d.results;
  if (d?.data) return d.data;
  return [];
}

export default function ComprasList() {
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCompras = async () => {
    try {
      const { data } = await api.get("/api/compras/");
      setCompras(normalizeList(data));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompras();
  }, []);

  return (
    <DashboardLayout>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12}}>
        <h2 style={{margin:0}}>Compras</h2>
        <Link to="/compras/registrar" className="btn btn-primary">Registrar Compra</Link>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : (
        <div className="table-wrap">
          <table className="table-dark">
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha/Hora</th>
                <th>Empleado</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Monto</th>
                <th>Descripción</th>
                <th style={{width:140}}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {compras.map(c => (
                <tr key={c.id_compra ?? c.id}>
                  <td>{c.id_compra ?? c.id}</td>
                  <td>{c.com_fecha_hora ?? "-"}</td>
                  <td>{c.empleado_nombre ?? "-"}</td>
                  <td>{c.proveedor_nombre ?? "-"}</td>
                  <td>{c.estado_nombre ?? "-"}</td>
                  <td>${Number(c.com_monto ?? 0).toFixed(2)}</td>
                  <td>{c.com_descripcion ?? "-"}</td>
                  <td>
                    <Link to={`/compras/editar/${c.id_compra ?? c.id}`} className="btn btn-secondary">Editar</Link>
                  </td>
                </tr>
              ))}
              {!compras.length && (
                <tr><td colSpan={7} style={{textAlign:"center", opacity:.7}}>Sin compras</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <style>{styles}</style>
    </DashboardLayout>
  );
}

const styles = `
.table-wrap { overflow:auto; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; margin-left:6px; }
`;
