export default function RecetaVerInfo({ receta, nombrePlato }) {
  return (
    <div className="receta-ver-info">
      <div>
        <strong>Plato vinculado:</strong> {nombrePlato}
      </div>

      <div>
        <strong>Estado:</strong>{" "}
        {String(receta?.id_estado_receta ?? receta?.estado ?? "1") === "1"
          ? "Activo"
          : "Inactivo"}
      </div>

      <div>
        <strong>Descripción:</strong>{" "}
        {receta?.rec_desc ?? receta?.rec_descripcion ?? "-"}
      </div>
    </div>
  );
}
