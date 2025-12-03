export default function ProveedorRegistrarActions({ navigate }) {
  return (
    <div className="prov-reg-actions prov-reg-row-span-2">
      <button
        type="submit"
        className="prov-reg-btn prov-reg-btn-primary"
      >
        Registrar Proveedor
      </button>
      <button
        type="button"
        className="prov-reg-btn prov-reg-btn-secondary"
        onClick={() => navigate("/proveedores")}
      >
        Cancelar
      </button>
    </div>
  );
}
