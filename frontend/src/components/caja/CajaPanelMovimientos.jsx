import React from "react";
import CajaPanelMovimientosTable from "./CajaPanelMovimientosTable";
import CajaPanelMovimientosPagination from "./CajaPanelMovimientosPagination";

export default function CajaPanelMovimientos({
  movsLoading,
  movsMsg,
  pageData,
  page,
  totalPages,
  setPage,
  money,
  fmtDate,
}) {
  return (
    <div className="card-dark caja-panel-movs-card">
      <div className="label caja-panel-card-title">
        Movimientos de la caja actual (desde la apertura)
      </div>

      {movsMsg && <p className="caja-panel-msg">{movsMsg}</p>}

      {movsLoading ? (
        <p>Cargando movimientos...</p>
      ) : (
        <>
          <CajaPanelMovimientosTable
            pageData={pageData}
            money={money}
            fmtDate={fmtDate}
          />

          <CajaPanelMovimientosPagination
            page={page}
            totalPages={totalPages}
            setPage={setPage}
          />
        </>
      )}
    </div>
  );
}
