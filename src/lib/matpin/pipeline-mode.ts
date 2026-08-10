export type MatpinPipelineMode = "mock" | "maintenance" | "live";
export type MatpinDeploymentEnvironment = "production" | "non-production";

export type MatpinPipelineModeState =
  | {
    valid: true;
    mode: MatpinPipelineMode;
    environment: MatpinDeploymentEnvironment;
  }
  | {
    valid: false;
    mode: "invalid";
    environment: MatpinDeploymentEnvironment;
  };

export function getMatpinPipelineModeState(): MatpinPipelineModeState {
  const mode = process.env.MATPIN_INSTAGRAM_PIPELINE_MODE?.trim();
  const environment: MatpinDeploymentEnvironment =
    process.env.VERCEL_ENV?.trim() === "production" ? "production" : "non-production";

  if (mode === "maintenance" && environment === "production") {
    return { valid: true, mode, environment };
  }
  if (mode === "mock" && environment === "non-production") {
    return { valid: true, mode, environment };
  }
  if (mode === "live" && environment === "production") {
    return { valid: true, mode, environment };
  }
  return { valid: false, mode: "invalid", environment };
}

export function isMatpinPipelineLive(): boolean {
  const state = getMatpinPipelineModeState();
  return state.valid && state.mode === "live";
}
