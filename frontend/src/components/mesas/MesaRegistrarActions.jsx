export default function MesaRegistrarActions({ navigate }) {
  return (
    <div className="mesa-reg-actions">
      <button
        type="submit"
        className="mesa-reg-btn mesa-reg-btn-primary"
      >
        Registrar
      </button>

      <button
        type="button"
        className="mesa-reg-btn mesa-reg-btn-secondary"
        onClick={() => navigate("/mesas")}
      >
        Cancelar
      </button>
    </div>
  );
}
