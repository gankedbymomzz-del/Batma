// ====== DANH HIỆU THẦY PHÁP — theo số đêm đã qua ======
export const TITLES = [
  { min: 0, name: 'Tập sự' },
  { min: 2, name: 'Đạo sĩ' },
  { min: 4, name: 'Pháp sư' },
  { min: 7, name: 'Thiên sư' },   // hạ được trùm đêm 7
  { min: 10, name: 'Chưởng môn' },
  { min: 15, name: 'Tổ sư' },
];

export function titleFor(nights = 0) {
  let t = TITLES[0];
  for (const x of TITLES) if (nights >= x.min) t = x;
  return t.name;
}
