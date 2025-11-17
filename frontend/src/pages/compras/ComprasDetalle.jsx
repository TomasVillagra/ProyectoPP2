import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

const norm = (d) => (Array.isArray(d) ? d : d?.results || d?.data || []);
const toNumber = (v) =>
  v === "" || v === null || v === undefined ? 0 : Number(v);
const fmtMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;

export default function ComprasDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [compra, setCompra] = useState(null);
  const [detalle, setDetalle] = useState([]);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const [c, d] = await Promise.all([
          api.get(`/api/compras/${id}/`),
          api.get(`/api/detalle-compras/?id_compra=${id}`),
        ]);
        setCompra(c.data);
        setDetalle(norm(d));
      } catch (err) {
        console.error(err);
        setMsg("No se pudo cargar el detalle de la compra.");
      }
    };

    load();
  }, [id]);

  const total = useMemo(
    () =>
      detalle.reduce(
        (acc, r) =>
          acc + toNumber(r.detcom_cantidad) * toNumber(r.detcom_precio_uni),
        0
      ),
    [detalle]
  );

  const pagadoLabel =
    (compra?.com_pagado ?? 2) === 1 ? "Sí" : "No";

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0 }}>Detalle de Compra #{id}</h2>
        <button className="btn btn-secondary" onClick={() => navigate("/compras")}>
          Volver
        </button>
      </div>

      {msg && <p>{msg}</p>}

      {compra ? (
        <>
          <div className="card">
            <div>
              <strong>Fecha/Hora:</strong> {compra.com_fecha_hora ?? "-"}
            </div>
            <div>
              <strong>Empleado:</strong>{" "}
              {compra.empleado_nombre ?? compra.id_empleado ?? "-"}
            </div>
            <div>
              <strong>Proveedor:</strong>{" "}
              {compra.proveedor_nombre ?? compra.id_proveedor ?? "-"}
            </div>
            <div>
              <strong>Estado:</strong>{" "}
              {compra.estado_nombre ?? compra.id_estado_compra ?? "-"}
            </div>
            <div>
              <strong>Pagado:</strong> {pagadoLabel}
            </div>
            <div>
              <strong>Descripción:</strong> {compra.com_descripcion ?? "-"}
            </div>
            <div>
              <strong>Monto (cabecera):</strong> {fmtMoney(compra.com_monto)}
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: 10 }}>
            <table className="table-dark">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Insumo</th>
                  <th style={{ width: 140 }}>Cantidad</th>
                  <th style={{ width: 160 }}>Precio unit.</th>
                  <th style={{ width: 140 }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {detalle.map((r, i) => {
                  const nombre =
                    r.insumo_nombre ??
                    r?.id_insumo?.ins_nombre ??
                    r.id_insumo ??
                    "-";
                  const cant = toNumber(r.detcom_cantidad);
                  const precio = toNumber(r.detcom_precio_uni);
                  const sub = cant * precio;
                  return (
                    <tr key={r.id_detalle_compra ?? r.id ?? i}>
                      <td>{i + 1}</td>
                      <td>{nombre}</td>
                      <td>{cant}</td>
                      <td>{fmtMoney(precio)}</td>
                      <td>{fmtMoney(sub)}</td>
                    </tr>
                  );
                })}
                {!detalle.length && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", opacity: 0.7 }}>
                      Sin renglones de detalle.
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} style={{ textAlign: "right" }}>
                    <strong>Total (calculado)</strong>
                  </td>
                  <td>
                    <strong>{fmtMoney(total)}</strong>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <style>{styles}</style>
        </>
      ) : (
        <p>Cargando...</p>
      )}
    </DashboardLayout>
  );
}

const styles = `
.card { background:#0f0f0f; color:#fff; border:1px solid #2a2a2a; border-radius:8px; padding:12px; display:grid; gap:6px; margin-top:10px; }
.table-wrap { overflow:auto; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;


