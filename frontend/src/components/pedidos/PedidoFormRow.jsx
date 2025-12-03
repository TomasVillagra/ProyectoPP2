// src/components/pedidos/PedidoFormRow.jsx

const PedidoFormRow = ({ label, htmlFor, children }) => {
  const labelProps = htmlFor ? { htmlFor } : {};
  return (
    <div className="row">
      <label {...labelProps}>{label}</label>
      {children}
    </div>
  );
};

export default PedidoFormRow;
