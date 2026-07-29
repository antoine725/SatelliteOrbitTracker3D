import SelectionDiv from './SelectionDiv';

export default function SidebarMenu({ satellites, onSelect }) {
  return (
    <div className="overlay-menu">
      <h3 className="title-menu">Satellites</h3>
      
      <select className="category-select">
        <option value="visual">Visibles à l'œil nu</option>
        <option value="weather">Météo</option>
        <option value="starlink">Starlink</option>
      </select>
      
      <SelectionDiv 
        classParam="toggleAll"
        id="toggle-all"
        satName="Tout afficher / masquer"
        isChecked={false}
        onChange={() => console.log("Clic sur la catégorie complète")}
      />

      <hr style={{ borderColor: '#333', margin: '1px 0' }} />

      <div className="satellite-list" style={{ overflowY: 'auto', flex: 1 }}>
        {satellites.length === 0 ? (
          <p style={{ fontSize: '0.9em', color: '#ccc' }}>Aucune donnée...</p>
        ) : (
          satellites.map((sat, index) => (
            <SelectionDiv 
              key={index}
              classParam="classSat"
              id={`sat-${index}`}
              satName={sat.name}
              isChecked={false}
              onChange={() => onSelect(sat)}
            />
          ))
        )}
      </div>
    </div>
  );
}