export default function ProveedorEditarActions({ navigate }) {
  return (
    <div className="prov-edit-actions">
      <button type="submit" className="prov-edit-btn-primary">
        Guardar Cambios
      </button>

      <button
        type="button"
        className="prov-edit-btn-secondary"
        onClick={() => navigate("/proveedores")}
      >
        Cancelar
      </button>
    </div>
  );
}
