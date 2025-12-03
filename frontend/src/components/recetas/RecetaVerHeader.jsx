import { Link, useNavigate } from "react-router-dom";

export default function RecetaVerHeader({ nombrePlato, recetaId }) {
  const navigate = useNavigate();

  return (
    <div className="receta-ver-header">
      <h2>Receta del plato {nombrePlato}</h2>

      <div className="receta-ver-header-actions">
        <button
          type="button"
          className="receta-ver-btn-secondary"
          onClick={() => navigate("/platos")}
        >
          Volver a platos
        </button>

        {recetaId && (
          <Link
            to={`/recetas/${recetaId}/editar`}
            className="receta-ver-btn-primary"
          >
            Editar receta
          </Link>
        )}
      </div>
    </div>
  );
}
