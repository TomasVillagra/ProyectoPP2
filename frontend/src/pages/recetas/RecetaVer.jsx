import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

function normalizeList(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  return [];
}

export default function RecetaVer() {
  // id = id del PLATO (porque venimos de /platos/:id/receta)
  const { id } = useParams();
  const navigate = useNavigate();

  const [receta, setReceta] = useState(null);
  const [plato, setPlato] = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [insumos, setInsumos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  const insumoMap = useMemo(() => {
    const m = {};
    insumos.forEach((i) => {
      const idIns = i.id_insumo ?? i.id;
      if (idIns != null) m[idIns] = i;
    });
    return m;
  }, [insumos]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setMsg("");

      try {
        // 1) receta asociada al plato
        const recRes = await api.get("/api/recetas/", {
          params: { id_plato: id },
        });
        const recList = normalizeList(recRes.data);
        if (!recList.length) {
          setMsg("Este plato aún no tiene receta asociada.");
          setLoading(false);
          return;
        }
        const rec = recList[0];
        setReceta(rec);

        // 2) insumos (para mostrar nombres)
        const insRes = await api.get("/api/insumos/");
        setInsumos(normalizeList(insRes.data));

        // 3) plato (para mostrar nombre actualizado)
        const platoId = rec.id_plato ?? rec?.plato?.id_plato ?? rec?.plato ?? id;
        if (platoId) {
          try {
            const pRes = await api.get(`/api/platos/${platoId}/`);
            setPlato(pRes.data);
          } catch (e) {
            console.error(e);
          }
        }

        // 4) detalles de receta
        let dets = rec.detalles;
        if (!Array.isArray(dets)) {
          const detRes = await api.get(
            `/api/detalle-recetas/?id_receta=${rec.id_receta ?? rec.id}`
          );
          dets = normalizeList(detRes.data);
        }
        setDetalles(dets || []);
      } catch (e) {
        console.error(e);
        setMsg("No se pudo cargar la receta.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const recetaId = receta?.id_receta ?? receta?.id;
  const nombrePlato =
    (plato &&
      (plato.pla_nombre ?? plato.plt_nombre ?? plato.nombre)) ||
    receta?.plato_nombre ||
    "";

  return (
    <DashboardLayout>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <h2 style={{ margin: 0, color: "#fff" }}>
          Receta del plato {nombrePlato || `#${id}`}
        </h2>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-secondary"
            type="button"
            onClick={() => navigate("/platos")}
          >
            Volver a platos
          </button>
          {recetaId && (
            <Link
              to={`/recetas/${recetaId}/editar`}
              className="btn btn-primary"
            >
              Editar receta
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <p>Cargando...</p>
      ) : msg ? (
        <p style={{ color: "#facc15" }}>{msg}</p>
      ) : (
        <>
          {/* Cabecera de la receta */}
          <div
            style={{
              background: "#111827",
              borderRadius: 12,
              padding: 16,
              border: "1px solid #1f2937",
              marginBottom: 16,
            }}
          >
            
            <div style={{ marginBottom: 8 }}>
              <strong>Plato vinculado: </strong>
              {nombrePlato || `Plato #${id}`}
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>Estado: </strong>
              {String(
                receta?.id_estado_receta ?? receta?.estado ?? "1"
              ) === "1"
                ? "Activo"
                : "Inactivo"}
            </div>
            <div>
              <strong>Descripción: </strong>
              {receta?.rec_desc ?? receta?.rec_descripcion ?? "-"}
            </div>
          </div>

          {/* Tabla de insumos */}
          <h3 style={{ color: "#fff", marginTop: 0, marginBottom: 8 }}>
            Insumos de la receta
          </h3>
          <div className="table-wrap">
            <table className="table-dark">
              <thead>
                <tr>
                  <th>ID insumo</th>
                  <th>Insumo</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {detalles.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center" }}>
                      Esta receta aún no tiene insumos cargados.
                    </td>
                  </tr>
                )}
                {detalles.map((d, idx) => {
                  const idIns = Number(
                    d.id_insumo ?? d.insumo ?? d.id ?? d.insumo_id ?? 0
                  );
                  const info = insumoMap[idIns] || {};
                  const nombre =
                    info.ins_nombre ??
                    info.nombre ??
                    d.insumo_nombre ??
                    (idIns ? `Insumo #${idIns}` : "-");
                  const unidad = info.ins_unidad ?? info.unidad ?? "";
                  const cant =
                    d.detr_cant_unid ?? d.cantidad ?? d.cant ?? "-";

                  return (
                    <tr key={idx}>
                      <td>{idIns || "-"}</td>
                      <td>
                        {nombre}
                        {unidad ? ` (${unidad})` : ""}
                      </td>
                      <td>{cant}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <style>{styles}</style>
        </>
      )}
    </DashboardLayout>
  );
}

const styles = `
.table-wrap { overflow:auto; margin-top:6px; }
.table-dark { width:100%; border-collapse: collapse; background:#121212; color:#eaeaea; }
.table-dark th, .table-dark td { border:1px solid #232323; padding:10px; vertical-align:top; }
.btn { padding:8px 12px; border-radius:8px; border:1px solid transparent; cursor:pointer; text-decoration:none; font-weight:600; }
.btn-primary { background:#2563eb; color:#fff; border-color:#2563eb; }
.btn-secondary { background:#3a3a3c; color:#fff; border:1px solid #4a4a4e; }
`;
