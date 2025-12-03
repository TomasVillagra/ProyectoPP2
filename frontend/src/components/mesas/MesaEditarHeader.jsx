export default function MesaEditarHeader({ bloqueada }) {
  return (
    <>
      <h2 className="mesa-edit-title">Editar Mesa</h2>

      {bloqueada && (
        <p className="mesa-edit-warning">
          Esta mesa tiene un pedido <strong>Entregado/En proceso</strong> y no se puede editar.
        </p>
      )}
    </>
  );
}
