export default function SidebarMenu({ satellites, onSelect }) {
  return (
    <div className="overlay-menu">
      <h3 className="title-menu">Satellites</h3>
      
      <select className="category-select">
        <option>Visibles à l'œil nu</option>
        <option>Starlink</option>
        <option>Météo</option>
      </select>
      
      <div className="satellite-list">
        <p style={{ fontSize: '0.9em', color: '#ccc' }}>
          Chargement des données...
        </p>
      </div>
    </div>
  );
}