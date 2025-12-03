export default function PlatoEditarButtons({ navigate }) {
  return (
    <div className="plato-edit-buttons">
      <button type="submit" className="plato-edit-btn-primary">
        Guardar cambios
      </button>

      <button
        type="button"
        className="plato-edit-btn-secondary"
        onClick={() => navigate("/platos")}
      >
        Cancelar
      </button>
    </div>
  );
}
