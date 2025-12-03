import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import ComprasDetalleHeader from "../../components/compras/ComprasDetalleHeader";
import ComprasDetalleSummary from "../../components/compras/ComprasDetalleSummary";
import ComprasDetalleTable from "../../components/compras/ComprasDetalleTable";

// ✅ CSS local, no global
import "./ComprasDetalle.css";

const norm = (d) => (Array.isArray(d) ? d : d?.results || d?.data || []);
export const toNumber = (v) =>
  v === "" || v === null || v === undefined ? 0 : Number(v);
export const fmtMoney = (n) => `$${Number(n ?? 0).toFixed(2)}`;

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

  const handleBack = () => navigate("/compras");

  return (
    <DashboardLayout>
      {/* ✅ Scope para que el CSS no sea global */}
      <div className="compras-detalle-scope">
        <ComprasDetalleHeader id={id} onBack={handleBack} />

        {msg && <p>{msg}</p>}

        {compra ? (
          <>
            <ComprasDetalleSummary
              compra={compra}
              pagadoLabel={pagadoLabel}
              fmtMoney={fmtMoney}
            />

            <ComprasDetalleTable
              detalle={detalle}
              total={total}
              toNumber={toNumber}
              fmtMoney={fmtMoney}
            />
          </>
        ) : (
          <p>Cargando...</p>
        )}
      </div>
    </DashboardLayout>
  );
}



