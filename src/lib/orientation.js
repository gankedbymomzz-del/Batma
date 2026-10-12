const D = Math.PI / 180;

// Góc lệch trong khoảng [-180, 180)
export const wrap180 = (d) => ((((d % 360) + 540) % 360) - 180);

// Từ alpha/beta/gamma → hướng camera sau đang nhìn (heading) và góc ngẩng (pitch).
// Tính bằng ma trận xoay Z-X-Y theo chuẩn W3C, lấy vector trục -Z của máy.
export function cameraDirection(alpha, beta, gamma) {
  const a = alpha * D, b = beta * D, g = gamma * D;
  const cA = Math.cos(a), sA = Math.sin(a);
  const cB = Math.cos(b), sB = Math.sin(b);
  const cG = Math.cos(g), sG = Math.sin(g);
  const x = -cA * sG - sA * sB * cG;
  const y = -sA * sG + cA * sB * cG;
  const z = -cB * cG;
  const heading = ((Math.atan2(x, y) / D) + 360) % 360;
  const pitch = Math.asin(Math.max(-1, Math.min(1, z))) / D;
  return { heading, pitch };
}

// iPhone bắt buộc xin quyền cảm biến, phải gọi trong lúc người dùng bấm nút
export async function requestOrientationPermission() {
  try {
    const DOE = window.DeviceOrientationEvent;
    if (DOE && typeof DOE.requestPermission === 'function') {
      return (await DOE.requestPermission()) === 'granted';
    }
    return !!DOE;
  } catch {
    return false;
  }
}
