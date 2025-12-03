export default function PlatoRegistrarButtons({ navigate }) {
  return (
    <div className="plato-reg-buttons">
      <button type="submit" className="plato-reg-btn-primary">
        Registrar
      </button>

      <button
        type="button"
        className="plato-reg-btn-secondary"
        onClick={() => navigate("/platos")}
      >
        Cancelar
      </button>
    </div>
  );
}
