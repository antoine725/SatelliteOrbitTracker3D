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

      const tleLine1 = '1 25544U 98067A   23271.49841052  .00013340  00000-0  24294-3 0  9997';
      const tleLine2 = '2 25544  51.6416 288.7501 0005728 126.9631 294.7570 15.49811425417855';
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
        name: 'Station Spatiale Internationale',
        position: dynamicPosition,
        point: {
          pixelSize: 15,
          color: Cesium.Color.RED,
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
        },
      });

      viewer.trackedEntity = issEntity; 
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