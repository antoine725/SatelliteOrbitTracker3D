import { useEffect, useState } from 'react';
import * as satellite from 'satellite.js';

export default function InfoPanel({ data, isTracked, onTrack, onUntrack }) {
  const [telemetry, setTelemetry] = useState({ lat: '0.00', lon: '0.00', alt: '0.00', vel: '0.00' });
  const [orbitalData, setOrbitalData] = useState({ inc: '0', period: '0', ecc: '0', year: 'Inconnu' });

  useEffect(() => {
    if (!data) return;

    const satrec = satellite.twoline2satrec(data.tleLine1, data.tleLine2);

    const yearStr = data.tleLine1.substring(9, 11);
    const yearNum = parseInt(yearStr, 10);
    const launchYear = yearNum < 57 ? 2000 + yearNum : 1900 + yearNum;

    const incDegrees = (satrec.inclo * (180 / Math.PI)).toFixed(1);
    const periodMin = ((2 * Math.PI) / satrec.no).toFixed(1);
    const eccentricity = satrec.ecco.toFixed(4);

    setOrbitalData({ 
      inc: incDegrees, 
      period: periodMin, 
      ecc: eccentricity,
      year: launchYear
    });

    const updatePosition = () => {
      const rightNow = new Date();
      const positionAndVelocity = satellite.propagate(satrec, rightNow);

      if (positionAndVelocity.position && positionAndVelocity.velocity) {
        const positionEci = positionAndVelocity.position;
        const velocityEci = positionAndVelocity.velocity;
        
        const gmst = satellite.gstime(rightNow);
        const positionGd = satellite.eciToGeodetic(positionEci, gmst);

        const longitude = satellite.degreesLong(positionGd.longitude).toFixed(4);
        const latitude = satellite.degreesLat(positionGd.latitude).toFixed(4);
        const altitude = positionGd.height.toFixed(2);
        
        const speed = Math.sqrt(
          Math.pow(velocityEci.x, 2) + 
          Math.pow(velocityEci.y, 2) + 
          Math.pow(velocityEci.z, 2)
        ).toFixed(2);

        setTelemetry({ lat: latitude, lon: longitude, alt: altitude, vel: speed });
      }
    };

    updatePosition();
    const interval = setInterval(updatePosition, 100);

    return () => clearInterval(interval);
  }, [data]);

  return (
    <div className={`info-panel ${data ? 'visible' : ''}`}>
      {data && (
        <div style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2em' }}>{data.name}</h3>
          
          <div style={{ fontSize: '0.9em', color: '#ccc', marginBottom: '20px', lineHeight: '1.5' }}>
            <strong>ID NORAD :</strong> {data.id} <br />
            <strong>Année de lancement :</strong> {orbitalData.year} <br />
            
            <hr style={{ borderColor: '#444', margin: '10px 0' }} />
            
            <strong>Période orbitale :</strong> {orbitalData.period} min <br />
            <strong>Inclinaison :</strong> {orbitalData.inc}° <br />
            <strong>Excentricité :</strong> {orbitalData.ecc} <br />
            
            <hr style={{ borderColor: '#444', margin: '10px 0' }} />
            
            <strong>Vitesse :</strong> {telemetry.vel} km/s <br />
            <strong>Altitude :</strong> {telemetry.alt} km <br />
            <strong>Latitude :</strong> {telemetry.lat}° <br />
            <strong>Longitude :</strong> {telemetry.lon}° 
          </div>

          {isTracked ? (
            <button 
              onClick={onUntrack}
              style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#d9534f', color: 'white', border: 'none', borderRadius: '4px', width: '100%' }}
            >
              Arrêter le suivi
            </button>
          ) : (
            <button 
              onClick={onTrack}
              style={{ padding: '8px 12px', cursor: 'pointer', backgroundColor: '#5cb85c', color: 'white', border: 'none', borderRadius: '4px', width: '100%' }}
            >
              Suivre la caméra
            </button>
          )}
        </div>
      )}
    </div>
  );
}