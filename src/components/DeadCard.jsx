import Ghost from './Ghost.jsx';

export default function DeadCard({ data, onRevive }) {
  return (
    <div className="modal center dead">
      <div className="dead-card">
        <div className="dead-ghost"><Ghost def={data.def} size={100} /></div>
        <h2>Cạn dương khí</h2>
        <p className="desc">Nó đã hút hết dương khí của bạn.</p>
        {data.lost > 0 && <p className="penalty">−{data.lost} XP</p>}
        <button className="btn-primary" onClick={onRevive} autoFocus>Thắp nhang hồi dương</button>
      </div>
    </div>
  );
}
