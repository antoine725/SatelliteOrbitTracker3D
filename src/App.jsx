import { useState, useEffect, useCallback } from 'react';
import Map3D from './components/Map3D';
import SidebarMenu from './components/SidebarMenu';
import InfoPanel from './components/InfoPanel';
import './App.css'; 

export default function App() {
  const [category, setCategory] = useState('visual');
  const [satellites, setSatellites] = useState([]); 
  const [activeSatellites, setActiveSatellites] = useState([]);
  const [lastClickedSatellite, setLastClickedSatellite] = useState(null);
  const [trackedSatelliteId, setTrackedSatelliteId] = useState(null);

  useEffect(() => {
    const fetchSatellites = async () => {
      setSatellites([]); 
      try {
        const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${category}&FORMAT=tle`);
        const textData = await response.text();
        
        const lines = textData.split('\n');
        const parsedSatellites = [];
        
        for (let i = 0; i < lines.length; i += 3) {
          if (lines[i] && lines[i + 1] && lines[i + 2]) {
            const noradId = lines[i + 1].substring(2, 7).trim();
            parsedSatellites.push({
              id: noradId,
              name: `${lines[i].trim()} (${noradId})`,
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
  }, [category]);

  const handleSelect = (sat) => {
    setActiveSatellites((prev) => {
      const isSelected = prev.some((s) => s.id === sat.id);
      if (isSelected) {
        if (trackedSatelliteId === sat.id) setTrackedSatelliteId(null);
        if (lastClickedSatellite?.id === sat.id) setLastClickedSatellite(null);
        return prev.filter((s) => s.id !== sat.id);
      } else {
        setLastClickedSatellite(sat);
        return [...prev, sat];
      }
    });
  };

  const handleMapSelection = useCallback((id) => {
    if (!id) {
      setLastClickedSatellite(null);
      return;
    }
    const sat = activeSatellites.find((s) => s.id === id);
    if (sat) {
      setLastClickedSatellite(sat);
    }
  }, [activeSatellites]);

  return (
    <div className="app-layout">
      <div className="map-wrapper">
        <Map3D 
          activeSatellites={activeSatellites} 
          trackedSatelliteId={trackedSatelliteId}
          selectedSatelliteId={lastClickedSatellite?.id}
          onSatelliteSelect={handleMapSelection}
        />
      </div>

      <SidebarMenu 
        satellites={satellites}
        activeSatellites={activeSatellites}
        currentCategory={category}
        onCategoryChange={setCategory}
        onSelect={handleSelect} 
      />

      <InfoPanel 
        data={lastClickedSatellite} 
        isTracked={lastClickedSatellite && trackedSatelliteId === lastClickedSatellite.id}
        onTrack={() => lastClickedSatellite && setTrackedSatelliteId(lastClickedSatellite.id)}
        onUntrack={() => setTrackedSatelliteId(null)}
      />
    </div>
  );
}