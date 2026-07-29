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
  const [apiError, setApiError] = useState(null);

  useEffect(() => {
    const fetchSatellites = async () => {
      setSatellites([]); 
      setApiError(null);
      
      const cacheKey = `celestrak_data_${category}`;
      const cacheTimeKey = `celestrak_time_${category}`;
      const cachedData = localStorage.getItem(cacheKey);
      const cachedTime = localStorage.getItem(cacheTimeKey);
      
      const isCacheValid = cachedData && cachedTime && (Date.now() - parseInt(cachedTime)) < 3600000;

      try {
        let textData = "";

        if (isCacheValid) {
          console.log(`[DATA] Chargement depuis le cache local pour la catégorie : ${category}`);
          textData = cachedData;
        } else {
          console.log(`[DATA] Téléchargement depuis l'API CelesTrak pour la catégorie : ${category}`);
          const response = await fetch(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${category}&FORMAT=tle`);
          textData = await response.text();

          if (textData.trim().startsWith('<')) {
            setApiError("CelesTrak a bloqué votre IP pour requêtes trop fréquentes. Utilisez un VPN ou patientez.");
            setSatellites([]);
            return;
          }

          if (!textData.includes('\n') || textData.includes('GP data has not updated')) {
            setSatellites([]);
            return;
          }

          localStorage.setItem(cacheKey, textData);
          localStorage.setItem(cacheTimeKey, Date.now().toString());
        }

        const lines = textData.split('\n');
        const parsedSatellites = [];
        
        for (let i = 0; i < lines.length; i += 3) {
          if (lines[i] && lines[i + 1] && lines[i + 2] && lines[i + 1].length > 20) {
            const noradId = lines[i + 1].substring(2, 7).trim();
            parsedSatellites.push({
              id: noradId,
              name: `${lines[i].trim()} (${noradId})`,
              tleLine1: lines[i + 1].trim(),
              tleLine2: lines[i + 2].trim(),
              category: category
            });
          }
        }
        
        setSatellites(parsedSatellites);
      } catch (error) {
        console.error(error);
        setApiError("Erreur de connexion à CelesTrak.");
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

  const handleToggleAll = () => {
    const allCurrentSelected = satellites.length > 0 && satellites.every(sat => 
      activeSatellites.some(active => active.id === sat.id)
    );

    if (allCurrentSelected) {
      setActiveSatellites(prev => prev.filter(p => !satellites.some(s => s.id === p.id)));
      setTrackedSatelliteId(null);
      setLastClickedSatellite(null);
    } else {
      setActiveSatellites(prev => {
        const newActive = [...prev];
        satellites.forEach(sat => {
          if (!newActive.some(active => active.id === sat.id)) {
            newActive.push(sat);
          }
        });
        return newActive;
      });
    }
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
        onToggleAll={handleToggleAll}
        apiError={apiError}
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