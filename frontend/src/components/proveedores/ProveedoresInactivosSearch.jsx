import { FaSearch } from "react-icons/fa";

export default function ProveedoresInactivosSearch({ search, setSearch }) {
  return (
    <div className="prov-inactivos-search">
      <FaSearch className="prov-inactivos-search-icon" />
      <input
        type="text"
        placeholder="Buscar proveedor inactivo..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
