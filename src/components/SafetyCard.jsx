// Cảnh báo an toàn trước mỗi lần chơi: game bắt người chơi xoay người, mắt dán vào điện thoại
export default function SafetyCard({ onOk, onCancel }) {
  return (
    <div className="modal center safety-modal">
      <div className="night-card safety-card">
        <p className="night-kicker">Trước khi bắt đầu</p>
        <h2>Chơi an toàn</h2>
        <ul className="safety-list">
          <li><b>Đứng yên một chỗ</b>, chỉ xoay người. Không vừa đi vừa săn ma.</li>
          <li>Chọn chỗ có <b>khoảng trống 2 mét</b> xung quanh, không có đồ vật dưới chân.</li>
          <li><b>Không chơi</b> gần cầu thang, kệ hàng, lối đi của xe nâng hay khu vực đang làm việc.</li>
          <li>Thấy chóng mặt hoặc quá sợ, hãy dừng lại nghỉ.</li>
        </ul>
        <button className="btn-primary" onClick={onOk} autoFocus>Tôi đã hiểu, bắt đầu</button>
        <button className="link-btn" onClick={onCancel}>Quay lại</button>
      </div>
    </div>
  );
}
