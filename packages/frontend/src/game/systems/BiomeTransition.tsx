/**
 * BiomeTransition -- wraps Skybox + Lighting + BackgroundDecor and
 * drives smooth cross-fade between biomes using BiomeState.
 */
import React from "react";
import type { BiomeState } from "./BiomeManager";
import { Skybox } from "./Skybox";
import { Lighting } from "./Lighting";
import { BackgroundDecor } from "./BackgroundDecor";

interface BiomeTransitionProps {
  biomeState: BiomeState;
  playerXRef: React.RefObject<{ x: number; y: number }>;
}

export function BiomeTransition({ biomeState, playerXRef }: BiomeTransitionProps) {
  const { current, next, transitionFactor } = biomeState;

  return (
    <>
      <Skybox
        theme={current}
        nextTheme={next}
        transitionFactor={transitionFactor}
      />
      <Lighting
        theme={current}
        nextTheme={next}
        transitionFactor={transitionFactor}
      />
      <BackgroundDecor
        theme={current}
        playerXRef={playerXRef}
        nextTheme={next}
        transitionFactor={transitionFactor}
      />
    </>
  );
}
