export function Lighting() {
  return (
    <>
      <ambientLight intensity={0.4} />
      <hemisphereLight args={["#87ceeb", "#3a2a1a", 0.5]} />
      <directionalLight
        position={[50, 50, 30]}
        intensity={1}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-far={100}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
    </>
  );
}
