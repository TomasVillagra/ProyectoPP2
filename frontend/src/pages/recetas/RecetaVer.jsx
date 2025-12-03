import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import RecetaVerHeader from "../../components/recetas/RecetaVerHeader";
import RecetaVerInfo from "../../components/recetas/RecetaVerInfo";
import RecetaVerTable from "../../components/recetas/RecetaVerTable";

import "./RecetaVer.css";

function normalizeList(respData) {
  if (Array.isArray(respData)) return respData;
  if (respData?.results && Array.isArray(respData.results)) return respData.results;
  if (respData?.data && Array.isArray(respData.data)) return respData.data;
  return [];
}

export default function RecetaVer() {
  const { id } = useParams();

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

        const insRes = await api.get("/api/insumos/");
        setInsumos(normalizeList(insRes.data));

        const platoId =
          rec.id_plato ?? rec?.plato?.id_plato ?? rec?.plato ?? id;

        if (platoId) {
          const pRes = await api.get(`/api/platos/${platoId}/`);
          setPlato(pRes.data);
        }

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
    `#${id}`;

  return (
    <DashboardLayout>
      <RecetaVerHeader nombrePlato={nombrePlato} recetaId={recetaId} />

      {loading ? (
        <p className="receta-ver-msg">Cargando...</p>
      ) : msg ? (
        <p className="receta-ver-msg">{msg}</p>
      ) : (
        <>
          <RecetaVerInfo receta={receta} nombrePlato={nombrePlato} />

          <RecetaVerTable detalles={detalles} insumoMap={insumoMap} />
        </>
      )}
    </DashboardLayout>
  );
}

