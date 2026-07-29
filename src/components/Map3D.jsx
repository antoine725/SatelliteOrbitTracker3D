import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import * as satellite from 'satellite.js';
import 'cesium/Build/Cesium/Widgets/widgets.css';

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

export default function Map3D({ activeSatellites, trackedSatelliteId, selectedSatelliteId, onSatelliteSelect }) {
  const cesiumContainer = useRef(null);
  const [viewer, setViewer] = useState(null);

  useEffect(() => {
    const v = new Cesium.Viewer(cesiumContainer.current, {
      animation: false,
      timeline: false,
      infoBox: true,
      selectionIndicator: true
    });
    
    setViewer(v);

    return () => {
      v.destroy();
    };
  }, []);

  useEffect(() => {
    if (!viewer) return;

    const listener = (selectedEntity) => {
      if (selectedEntity) {
        onSatelliteSelect(selectedEntity.id);
      } else {
        onSatelliteSelect(null);
      }
    };

    viewer.selectedEntityChanged.addEventListener(listener);

    return () => {
      viewer.selectedEntityChanged.removeEventListener(listener);
    };
  }, [viewer, onSatelliteSelect]);

  useEffect(() => {
    if (!viewer) return;

    const currentIds = activeSatellites.map((sat) => sat.id);

    const entitiesToRemove = [];
    for (let i = 0; i < viewer.entities.values.length; i++) {
      const entity = viewer.entities.values[i];
      if (!currentIds.includes(entity.id)) {
        entitiesToRemove.push(entity);
      }
    }
    
    entitiesToRemove.forEach((entity) => {
      viewer.entities.remove(entity);
    });

    activeSatellites.forEach((sat) => {
      if (!viewer.entities.getById(sat.id)) {
        const satrec = satellite.twoline2satrec(sat.tleLine1, sat.tleLine2);

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

        viewer.entities.add({
          id: sat.id,
          name: sat.name,
          position: dynamicPosition,
          point: {
            pixelSize: 15,
            color: Cesium.Color.RED,
            outlineColor: Cesium.Color.WHITE,
            outlineWidth: 2,
          },
        });
      }
    });

  }, [activeSatellites, viewer]);

  useEffect(() => {
    if (!viewer) return;
    
    if (trackedSatelliteId) {
      const entity = viewer.entities.getById(trackedSatelliteId);
      if (entity) {
        viewer.trackedEntity = entity;
      }
    } else {
      viewer.trackedEntity = undefined;
    }
  }, [trackedSatelliteId, viewer]);

  useEffect(() => {
    if (!viewer) return;

    if (selectedSatelliteId) {
      const entity = viewer.entities.getById(selectedSatelliteId);
      if (entity && viewer.selectedEntity !== entity) {
        viewer.selectedEntity = entity;
      }
    } else {
      viewer.selectedEntity = undefined;
    }
  }, [selectedSatelliteId, viewer]);

  return <div ref={cesiumContainer} style={{ width: '100%', height: '100%' }} />;
}