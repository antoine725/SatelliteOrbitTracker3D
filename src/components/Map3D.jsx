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

        let satColor = Cesium.Color.RED;
        let satSize = 10;
        let maxDisplayDistance = 10000000.0;

        if (sat.category === 'visual') {
          satColor = Cesium.Color.RED;
          satSize = 8;
        } else if (sat.category === 'weather') {
          satColor = Cesium.Color.CYAN;
          satSize = 6;
        } else if (sat.category === 'starlink') {
          satColor = Cesium.Color.WHITE;
          satSize = 4;
          maxDisplayDistance = 2000000.0;
        }

        viewer.entities.add({
          id: sat.id,
          name: sat.name,
          position: dynamicPosition,
          point: {
            pixelSize: satSize,
            color: satColor,
            outlineWidth: 1,
          },
          label: {
            text: sat.name,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, maxDisplayDistance),
            show: true
          }
        });
      }
    });

  }, [activeSatellites, viewer]);

  useEffect(() => {
    if (!viewer) return;

    viewer.entities.values.forEach(entity => {
      if (entity.label) {
        entity.label.show = true;
      }
    });
    
    if (trackedSatelliteId) {
      const entity = viewer.entities.getById(trackedSatelliteId);
      if (entity) {
        viewer.trackedEntity = entity;
        if (entity.label) {
          entity.label.show = false;
        }
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