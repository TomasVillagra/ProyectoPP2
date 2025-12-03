import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../api/axios";
import DashboardLayout from "../../components/layout/DashboardLayout";

import MesasListHeader from "../../components/mesas/MesasListHeader";
import MesasListTable from "../../components/mesas/MesasListTable";
import MesasListPagination from "../../components/mesas/MesasListPagination";

import "./MesasList.css";

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

export default function MesasList() {
  const [data, setData] = useState([]);
  const [estados, setEstados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [bloqueadas, setBloqueadas] = useState(new Set());

  // paginación
  const [page, setPage] = useState(1);
  const rowsPerPage = 8;

  const fetchEstados = async () => {
    try {
      const { data } = await api.get("/api/estados-mesa/");
      setEstados(normalize(data));
    } catch {}
  };

  const fetchMesas = async () => {
    try {
      const { data } = await api.get("/api/mesas/");
      setData(normalize(data));
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cargar mesas");
    } finally {
      setLoading(false);
    }
  };

  const fetchPedidosBloqueantes = async () => {
    try {
      const { data } = await api.get("/api/pedidos/", {
        params: { page_size: 1000 },
      });
      const list = normalize(data);
      const s = new Set();
      list.forEach((p) => {
        const estado =
          p?.estado_nombre ??
          p?.id_estado_pedido?.estp_nombre ??
          p?.estado ??
          "";
        const idMesa =
          p?.id_mesa?.id_mesa ??
          p?.id_mesa ??
          null;
        if (idMesa && isBlockingEstado(estado)) {
          s.add(Number(idMesa));
        }
      });
      setBloqueadas(s);
    } catch {
      console.warn("No se pudieron validar bloqueos de edición.");
    }
  };

  useEffect(() => {
    (async () => {
      await Promise.all([fetchEstados(), fetchMesas()]);
      await fetchPedidosBloqueantes();
    })();
  }, []);

  const estIdByName = (nombre) => {
    const n = String(nombre || "").toLowerCase();
    return estados.find(
      (e) =>
        String(e.estms_nombre).toLowerCase() === n
    )?.id_estado_mesa;
  };

  const estNombre = (r) =>
    r.estado_mesa_nombre ??
    r?.id_estado_mesa?.estms_nombre ??
    "-";

  const setEstado = async (mesa, targetNombre) => {
    try {
      const targetId = estIdByName(targetNombre);
      if (!targetId) {
        alert(
          `No se encuentra el estado "${targetNombre}".`
        );
        return;
      }
      const id = mesa.id_mesa ?? mesa.id;
      await api.patch(`/api/mesas/${id}/`, {
        id_estado_mesa: targetId,
      });
      await fetchMesas();
      await fetchPedidosBloqueantes();
    } catch (e) {
      console.error(e);
      setMsg("No se pudo cambiar el estado.");
    }
  };

  const toggleOcupadaDisponible = async (mesa) => {
    const current = String(estNombre(mesa)).toLowerCase();
    const next =
      current === "disponible" ? "Ocupada" : "Disponible";
    await setEstado(mesa, next);
  };

  const toggleInactiva = async (mesa) => {
    const current = String(estNombre(mesa)).toLowerCase();
    const next =
      current === "inactiva" ? "Disponible" : "Inactiva";
    await setEstado(mesa, next);
  };

  // orden original
  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) =>
          (a.ms_numero ?? 0) - (b.ms_numero ?? 0)
      ),
    [data]
  );

  // paginación calculada
  const totalPages = Math.max(
    1,
    Math.ceil(sorted.length / rowsPerPage)
  );
  const startIndex = (page - 1) * rowsPerPage;
  const endIndex = Math.min(
    startIndex + rowsPerPage,
    sorted.length
  );
  const paginatedRows = sorted.slice(
    startIndex,
    endIndex
  );

  const gotoPage = (p) => {
    if (p < 1 || p > totalPages) return;
    setPage(p);
  };

  return (
    <DashboardLayout>
      <div className="mesas-container">
        <MesasListHeader />

        {msg && (
          <p className="mesas-msg">{msg}</p>
        )}

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <MesasListTable
              rows={paginatedRows}
              estNombre={estNombre}
              bloqueadas={bloqueadas}
              toggleOcupadaDisponible={
                toggleOcupadaDisponible
              }
              toggleInactiva={toggleInactiva}
            />

            <MesasListPagination
              page={page}
              totalPages={totalPages}
              gotoPage={gotoPage}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}




