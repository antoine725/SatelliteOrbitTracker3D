import SelectionDiv from './SelectionDiv';

export default function SidebarMenu({ satellites, activeSatellites, currentCategory, onCategoryChange, onSelect }) {
  return (
    <div className="overlay-menu">
      <h3 className="title-menu">Satellites</h3>
      
      <select 
        className="category-select" 
        value={currentCategory} 
        onChange={(e) => onCategoryChange(e.target.value)}
      >
        <option value="visual">Visibles à l'œil nu</option>
        <option value="weather">Météo</option>
        <option value="starlink">Starlink</option>
      </select>
      
      <SelectionDiv 
        classParam="toggleAll"
        id="toggle-all"
        satName="Tout afficher / masquer"
        isChecked={false}
        onChange={() => console.log("Logique à venir")}
      />

      <hr style={{ borderColor: '#333', margin: '1px 0' }} />

      <div className="satellite-list" style={{ overflowY: 'auto', flex: 1 }}>
        {satellites.length === 0 ? (
          <p style={{ fontSize: '0.9em', color: '#ccc' }}>Chargement des données...</p>
        ) : (
          satellites.map((sat) => {
            const isChecked = activeSatellites.some((active) => active.id === sat.id);
            return (
              <SelectionDiv 
                key={sat.id}
                classParam="classSat"
                id={`sat-${sat.id}`}
                satName={sat.name}
                isChecked={isChecked}
                onChange={() => onSelect(sat)}
              />
            );
          })
        )}
      </div>
    </div>
  );
}