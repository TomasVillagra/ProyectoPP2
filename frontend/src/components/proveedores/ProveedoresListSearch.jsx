import { FaSearch } from "react-icons/fa";

export default function ProveedoresListSearch({
  search,
  setSearch,
}) {
  return (
    <div className="prov-list-search-bar">
      <FaSearch className="prov-list-search-icon" />
      <input
        type="text"
        placeholder="Buscar por nombre, correo o teléfono..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
  );
}
