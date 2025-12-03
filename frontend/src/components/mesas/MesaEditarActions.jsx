export default function MesaEditarActions({ navigate, bloqueada }) {
  return (
    <div className="mesa-edit-actions">
      <button
        type="submit"
        className="mesa-edit-btn mesa-edit-btn-primary"
        disabled={bloqueada}
      >
        Guardar cambios
      </button>

      <button
        type="button"
        className="mesa-edit-btn mesa-edit-btn-secondary"
        onClick={() => navigate("/mesas")}
      >
        Volver
      </button>
    </div>
  );
}

