export function getProfileData(experiment, t = -1) {
  const config = experiment.config;
  const output = experiment.output;
  if (config === undefined || output === undefined) {
    return { x: undefined, y: undefined };
  }

  const theta = output.theta.slice(t)[0];
  const dtheta = output.dtheta.slice(t)[0];
  const gammatheta = config.mixedLayer?.gammatheta;
  const q = output.q.slice(t)[0];
  const dq = output.dq.slice(t)[0];
  const gammaq = config.mixedLayer?.gammaq;

  const h = output.h.slice(t)[0];
  const dh = 100;

  const thetas = [
    theta,
    theta,
    theta + dtheta,
    theta + dtheta + dh * gammatheta,
    theta + dtheta + 2 * dh * gammatheta,
    theta + dtheta + 3 * dh * gammatheta,
    theta + dtheta + 4 * dh * gammatheta,
  ];
  const humidities = [
    q,
    q,
    q + dq,
    q + dq + dh * gammaq,
    q + dq + 2 * dh * gammaq,
    q + dq + 3 * dh * gammaq,
    q + dq + 4 * dh * gammaq,
  ];
  const height = [0, h, h, h + dh, h + 2 * dh, h + 3 * dh, h + 4 * dh];
  return { h: height, theta: thetas, q: humidities };
}
