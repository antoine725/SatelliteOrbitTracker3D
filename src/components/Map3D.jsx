import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import * as satellite from 'satellite.js';
import 'cesium/Build/Cesium/Widgets/widgets.css';

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

export default function Map3D() {
  const cesiumContainer = useRef(null);

  useEffect(() => {
    let viewer;

    const initCesium = async () => {
      viewer = new Cesium.Viewer(cesiumContainer.current, {
        animation: false,
        timeline: false,
      });

      try {
        // Api call to get the TLE
        const response = await fetch('https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=tle');
        
        // Data extraction and parsing
        const textData = await response.text();
        const tleLines = textData.split('\n');
        
        const tleLine1 = tleLines[1].trim();
        const tleLine2 = tleLines[2].trim();

        const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

        const dynamicPosition = new Cesium.CallbackProperty(() => {
          const rightNow = new Date();
          const positionAndVelocity = satellite.propagate(satrec, rightNow);
          
          if (!positionAndVelocity.position) return null;

          const positionEci = positionAndVelocity.position;
          const gmst = satellite.gstime(rightNow);
          const positionGd = satellite.eciToGeodetic(positionEci, gmst);

          const longitude = satellite.degreesLong(positionGd.longitude);
          const latitude = satellite.degreesLat(positionGd.latitude);
          const heightInMeters = positionGd.height * 1000;

          return Cesium.Cartesian3.fromDegrees(longitude, latitude, heightInMeters);
        }, false);

        const issEntity = viewer.entities.add({
          id: 'ISS',
          name: tleLines[0].trim(), 
          position: dynamicPosition,
          point: {
            pixelSize: 15,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
          },
        });

        viewer.trackedEntity = issEntity;

      } catch (error) {
        console.error("Impossible de récupérer les données du satellite :", error);
      }
    };

    initCesium();

    return () => {
      if (viewer) {
        viewer.destroy();
      }
    };
  }, []);

  return <div ref={cesiumContainer} style={{ width: '100%', height: '100%' }} />;
}