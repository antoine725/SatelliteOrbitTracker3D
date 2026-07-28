import { useState } from 'react';
import Map3D from './components/Map3D';
import SidebarMenu from './components/SidebarMenu';
import InfoPanel from './components/InfoPanel';
import './App.css'; 

export default function App() {
  const [satellites, setSatellites] = useState([]); 
  const [activeSatellite, setActiveSatellite] = useState(null);

  return (
    <div className="app-layout">
      
      <div className="map-wrapper">
        <Map3D activeSatellite={activeSatellite} />
      </div>

      <SidebarMenu 
        satellites={satellites} 
        onSelect={(sat) => setActiveSatellite(sat)} 
      />

      {activeSatellite && (
         <InfoPanel data={activeSatellite} />
      )}
      
    </div>
  );
}