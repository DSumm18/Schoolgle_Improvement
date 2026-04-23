/**
 * Type declarations for React Three Fiber JSX elements
 * This file extends the JSX namespace to include Three.js elements
 */

import * as THREE from "three";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // Basic Three.js elements
      mesh: React.DetailedHTMLProps<React.HTMLAttributes<THREE.Mesh>, THREE.Mesh>;
      group: React.DetailedHTMLProps<React.HTMLAttributes<THREE.Group>, THREE.Group>;
      scene: React.DetailedHTMLProps<React.HTMLAttributes<THREE.Scene>, THREE.Scene>;
      ambientLight: React.DetailedHTMLProps<React.HTMLAttributes<THREE.AmbientLight>, THREE.AmbientLight>;
      directionalLight: React.DetailedHTMLProps<React.HTMLAttributes<THREE.DirectionalLight>, THREE.DirectionalLight>;
      pointLight: React.DetailedHTMLProps<React.HTMLAttributes<THREE.PointLight>, THREE.PointLight>;
      spotLight: React.DetailedHTMLProps<React.HTMLAttributes<THREE.SpotLight>, THREE.SpotLight>;
      hemisphereLight: React.DetailedHTMLProps<React.HTMLAttributes<THREE.HemisphereLight>, THREE.HemisphereLight>;

      // Geometry elements
      boxGeometry: React.DetailedHTMLProps<React.HTMLAttributes<THREE.BoxGeometry>, THREE.BoxGeometry>;
      sphereGeometry: React.DetailedHTMLProps<React.HTMLAttributes<THREE.SphereGeometry>, THREE.SphereGeometry>;
      cylinderGeometry: React.DetailedHTMLProps<React.HTMLAttributes<THREE.CylinderGeometry>, THREE.CylinderGeometry>;
      coneGeometry: React.DetailedHTMLProps<React.HTMLAttributes<THREE.ConeGeometry>, THREE.ConeGeometry>;
      torusGeometry: React.DetailedHTMLProps<React.HTMLAttributes<THREE.TorusGeometry>, THREE.TorusGeometry>;
      planeGeometry: React.DetailedHTMLProps<React.HTMLAttributes<THREE.PlaneGeometry>, THREE.PlaneGeometry>;
      tubeGeometry: React.DetailedHTMLProps<React.HTMLAttributes<THREE.TubeGeometry>, THREE.TubeGeometry>;

      // Material elements
      meshStandardMaterial: React.DetailedHTMLProps<React.HTMLAttributes<THREE.MeshStandardMaterial>, THREE.MeshStandardMaterial>;
      meshBasicMaterial: React.DetailedHTMLProps<React.HTMLAttributes<THREE.MeshBasicMaterial>, THREE.MeshBasicMaterial>;
      meshPhysicalMaterial: React.DetailedHTMLProps<React.HTMLAttributes<THREE.MeshPhysicalMaterial>, THREE.MeshPhysicalMaterial>;
      meshLambertMaterial: React.DetailedHTMLProps<React.HTMLAttributes<THREE.MeshLambertMaterial>, THREE.MeshLambertMaterial>;
      meshPhongMaterial: React.DetailedHTMLProps<React.HTMLAttributes<THREE.MeshPhongMaterial>, THREE.MeshPhongMaterial>;

      // Line elements
      lineSegments: React.DetailedHTMLProps<React.HTMLAttributes<THREE.LineSegments>, THREE.LineSegments>;
      lineBasicMaterial: React.DetailedHTMLProps<React.HTMLAttributes<THREE.LineBasicMaterial>, THREE.LineBasicMaterial>;
      edges: React.DetailedHTMLProps<React.HTMLAttributes<THREE.EdgesGeometry>, THREE.EdgesGeometry>;
    }
  }
}

export {};
