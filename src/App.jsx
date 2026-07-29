import { useState, useEffect } from 'react';
import Map3D from './components/Map3D';
import SidebarMenu from './components/SidebarMenu';
import InfoPanel from './components/InfoPanel';
import './App.css'; 

export default function App() {
  const [satellites, setSatellites] = useState([]); 
  const [activeSatellite, setActiveSatellite] = useState(null);

  useEffect(() => {
    const fetchSatellites = async () => {
      try {
        const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?GROUP=visual&FORMAT=tle');
        const textData = await response.text();
        
        const lines = textData.split('\n');
        const parsedSatellites = [];
        
        for (let i = 0; i < lines.length; i += 3) {
          if (lines[i] && lines[i + 1] && lines[i + 2]) {
            parsedSatellites.push({
              name: lines[i].trim(),
              tleLine1: lines[i + 1].trim(),
              tleLine2: lines[i + 2].trim()
            });
          }
        }
        
        setSatellites(parsedSatellites);
      } catch (error) {
        console.error(error);
      }
    };

    fetchSatellites();
  }, []);

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