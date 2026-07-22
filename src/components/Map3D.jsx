import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
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