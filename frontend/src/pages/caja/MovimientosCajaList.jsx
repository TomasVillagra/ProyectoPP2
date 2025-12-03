import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import apiDefault, { api as apiNamed } from "../../api/axios";

import MovCajaListHeader from "../../components/caja/MovCajaListHeader";
import MovCajaListTable from "../../components/caja/MovCajaListTable";
import MovCajaListPagination from "../../components/caja/MovCajaListPagination";

import "./MovimientosCajaList.css";

const api = apiNamed || apiDefault;

/* Helpers (igual que tu código) */
function normAny(resp) {
  if (!resp) return [];
  const data = resp.data ?? resp;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

const money = (n) => {
  const x = Number(n);
  return Number.isFinite(x) ? x.toFixed(2) : "0.00";
};

function fmtDate(dt) {
  if (!dt) return "-";
  try {
    const d = new Date(dt);
    if (isNaN(d.getTime()))
      return String(dt).replace("T", " ").slice(0, 19);
    return d.toLocaleString();
  } catch {
    return String(dt);
  }
}

export default function MovimientosCajaList() {
  const [items, setItems] = useState([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const fetchMovs = async () => {
    try {
      const candidates = [
        "/api/movimientos-caja/",
        "/api/movimientos_caja/",
      ];
      for (const u of candidates) {
        try {
          const res = await api.get(u);
          setItems(normAny(res));
          return;
        } catch {
          /* intento el siguiente */
        }
      }
      setItems([]);
    } catch (e) {
      console.error(e);
      setMsg("No se pudieron cargar los movimientos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMovs();
  }, []);

  const filtered = useMemo(() => {
    const s = String(q || "").toLowerCase();
    if (!s) return items;
    return items.filter((it) =>
      JSON.stringify(it).toLowerCase().includes(s)
    );
  }, [items, q]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / pageSize)
  );
  const pageSafe = Math.min(page, totalPages);

  const pageData = useMemo(() => {
    const start = (pageSafe - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, pageSafe, pageSize]);

  const handleSearchChange = (val) => {
    setPage(1);
    setQ(val);
  };

  return (
    <DashboardLayout>
      {/* ✅ Scope CSS para que no sea global */}
      <div className="mov-caja-list-scope">
        <MovCajaListHeader q={q} onChangeQuery={handleSearchChange} />

        {msg && (
          <p
            style={{
              color: "#facc15",
              whiteSpace: "pre-wrap",
              marginTop: 4,
            }}
          >
            {msg}
          </p>
        )}

        {loading ? (
          <p>Cargando...</p>
        ) : (
          <>
            <MovCajaListTable
              rows={pageData}
              money={money}
              fmtDate={fmtDate}
            />

            <MovCajaListPagination
              page={pageSafe}
              totalPages={totalPages}
              setPage={setPage}
            />
          </>
        )}
      </div>
    </DashboardLayout>
  );
}



