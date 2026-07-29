import { useState } from 'react';
import SelectionDiv from './SelectionDiv';

export default function SidebarMenu({ satellites, activeSatellites, currentCategory, onCategoryChange, onSelect, onToggleAll }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSatellites = satellites.filter(sat => 
    sat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAllChecked = satellites.length > 0 && satellites.every(sat => 
    activeSatellites.some(active => active.id === sat.id)
  );

  return (
    <div className="overlay-menu">
      <h3 className="title-menu">Satellites</h3>
      
      <select 
        className="category-select" 
        value={currentCategory} 
        onChange={(e) => {
          setSearchTerm('');
          onCategoryChange(e.target.value);
        }}
      >
        <option value="visual">Visibles à l'œil nu</option>
        <option value="weather">Météo</option>
        <option value="starlink">Starlink</option>
      </select>

      <input 
        type="text" 
        className="search-input"
        placeholder="Rechercher un satellite..." 
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      
      <SelectionDiv 
        classParam="classCat"
        id="toggle-all"
        satName="Tout afficher / masquer"
        isChecked={isAllChecked}
        onChange={onToggleAll}
      />

      <hr style={{ borderColor: '#333', margin: '1px 0' }} />

      <div className="satellite-list" style={{ overflowY: 'auto', flex: 1 }}>
        {satellites.length === 0 ? (
          <p style={{ fontSize: '0.9em', color: '#ccc' }}>Chargement des données...</p>
        ) : filteredSatellites.length === 0 ? (
          <p style={{ fontSize: '0.9em', color: '#ccc' }}>Aucun résultat.</p>
        ) : (
          filteredSatellites.map((sat) => {
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