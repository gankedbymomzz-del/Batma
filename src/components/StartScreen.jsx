import Ghost from './Ghost.jsx';
import Talisman from './Talisman.jsx';
import { GHOSTS } from '../ghosts.js';

export default function StartScreen({ onStart, loading }) {
  return (
    <div className="start">
      <div className="start-art">
        <div className="start-ghost"><Ghost def={GHOSTS[4]} size={130} /></div>
        <div className="start-tal"><Talisman kind="paper" /></div>
      </div>
      <h1>Săn Ma</h1>
      <p className="tag">Xoay điện thoại tìm ma quanh bạn,<br />vuốt bùa để phong ấn vào Sổ Ma.</p>
      <button className="btn-primary" onClick={onStart} disabled={loading}>
        {loading ? 'Đang mở camera…' : 'Bắt đầu săn ma'}
      </button>
      <ul className="notes">
        <li>Bấm <b>Cho phép</b> khi được hỏi quyền Camera và Chuyển động</li>
        <li>Cầm máy dọc, xoay người để dò theo sóng ma</li>
        <li>Trên máy tính: kéo chuột hoặc dùng phím mũi tên</li>
      </ul>
    </div>
  );
}
