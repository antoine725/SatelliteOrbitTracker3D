import { useEffect, useRef, useState } from 'react';
import * as Cesium from 'cesium';
import * as satellite from 'satellite.js';
import 'cesium/Build/Cesium/Widgets/widgets.css';

Cesium.Ion.defaultAccessToken = import.meta.env.VITE_CESIUM_TOKEN;

export default function Map3D({ activeSatellites, trackedSatelliteId, selectedSatelliteId, onSatelliteSelect, onSatelliteTrack }) {
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
        if (selectedEntity.id === 'current-orbit-track') {
          onSatelliteSelect(null);
          return;
        }
        if (typeof selectedEntity.id === 'string' && selectedEntity.id.endsWith('-label')) {
          const baseId = selectedEntity.id.replace('-label', '');
          viewer.selectedEntity = viewer.entities.getById(baseId);
          return;
        }
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

    const trackListener = () => {
      if (viewer.trackedEntity) {
        let id = viewer.trackedEntity.id;
        if (typeof id === 'string' && id.endsWith('-label')) id = id.replace('-label', '');
        onSatelliteTrack(id);
      } else {
        onSatelliteTrack(null);
      }
    };

    viewer.trackedEntityChanged.addEventListener(trackListener);

    return () => {
      viewer.trackedEntityChanged.removeEventListener(trackListener);
    };
  }, [viewer, onSatelliteTrack]);

  useEffect(() => {
    if (!viewer) return;

    const currentIds = activeSatellites.map((sat) => sat.id);

    const entitiesToRemove = [];
    for (let i = 0; i < viewer.entities.values.length; i++) {
      const entity = viewer.entities.values[i];
      if (entity.id === 'current-orbit-track') continue;
      
      const baseId = typeof entity.id === 'string' && entity.id.endsWith('-label') 
        ? entity.id.replace('-label', '') 
        : entity.id;

      if (!currentIds.includes(baseId)) {
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
          viewFrom: new Cesium.Cartesian3(0.0, -100000.0, 100000.0),
          point: {
            pixelSize: satSize,
            color: satColor,
            outlineWidth: 1,
          }
        });

        viewer.entities.add({
          id: `${sat.id}-label`,
          position: dynamicPosition,
          label: {
            text: sat.name,
            font: '12px sans-serif',
            fillColor: Cesium.Color.WHITE,
            style: Cesium.LabelStyle.FILL_AND_OUTLINE,
            outlineWidth: 2,
            verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
            pixelOffset: new Cesium.Cartesian2(0, -15),
            distanceDisplayCondition: new Cesium.DistanceDisplayCondition(0.0, maxDisplayDistance)
          }
        });
      }
    });

  }, [activeSatellites, viewer]);

  useEffect(() => {
    if (!viewer) return;
    
    if (trackedSatelliteId) {
      const entity = viewer.entities.getById(trackedSatelliteId);
      if (entity && viewer.trackedEntity !== entity) {
        viewer.trackedEntity = entity;
      }
    } else {
      if (viewer.trackedEntity !== undefined) {
        viewer.trackedEntity = undefined;
      }
    }
  }, [trackedSatelliteId, viewer]);

  useEffect(() => {
    if (!viewer) return;

    const existingOrbit = viewer.entities.getById('current-orbit-track');
    if (existingOrbit) {
      viewer.entities.remove(existingOrbit);
    }

    if (selectedSatelliteId) {
      const entity = viewer.entities.getById(selectedSatelliteId);
      const sat = activeSatellites.find(s => s.id === selectedSatelliteId);

      if (entity && viewer.selectedEntity !== entity) {
        viewer.selectedEntity = entity;
      }

      if (entity) {
        const position = entity.position.getValue(viewer.clock.currentTime);
        if (position) {
          const earthSphere = new Cesium.BoundingSphere(Cesium.Cartesian3.ZERO, Cesium.Ellipsoid.WGS84.minimumRadius);
          const occluder = new Cesium.Occluder(earthSphere, viewer.camera.positionWC);
          
          if (!occluder.isPointVisible(position)) {
            const currentZoomLevel = viewer.camera.positionCartographic.height;
            
            viewer.flyTo(entity, {
              duration: 1.5,
              offset: new Cesium.HeadingPitchRange(0, -Math.PI / 2, currentZoomLevel)
            });
          }
        }
      }

      if (entity && sat && selectedSatelliteId !== trackedSatelliteId) {
        const satrec = satellite.twoline2satrec(sat.tleLine1, sat.tleLine2);
        const periodMin = (2 * Math.PI) / satrec.no;
        const positions = [];
        const now = new Date();
        
        for (let i = 0; i <= Math.ceil(periodMin); i += 1) {
          const time = new Date(now.getTime() + i * 60000);
          const posVel = satellite.propagate(satrec, time);
          
          if (posVel.position) {
            const gmst = satellite.gstime(time);
            const posGd = satellite.eciToGeodetic(posVel.position, gmst);
            positions.push(Cesium.Cartesian3.fromDegrees(
              satellite.degreesLong(posGd.longitude),
              satellite.degreesLat(posGd.latitude),
              posGd.height * 1000
            ));
          }
        }

        const pointColor = entity.point.color.getValue();

        viewer.entities.add({
          id: 'current-orbit-track',
          polyline: {
            positions: positions,
            width: 2,
            material: new Cesium.ColorMaterialProperty(pointColor.withAlpha(0.6)),
            arcType: Cesium.ArcType.NONE
          }
        });
      }
    } else {
      viewer.selectedEntity = undefined;
    }
  }, [selectedSatelliteId, trackedSatelliteId, activeSatellites, viewer]);

  return <div ref={cesiumContainer} style={{ width: '100%', height: '100%' }} />;
}