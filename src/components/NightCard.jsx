import { STORY_NIGHTS } from '../nights.js';
import { BOSS } from '../ghosts.js';
import { PROLOGUE, NIGHT_STORY, ENDLESS_INTRO } from '../story.js';

// Màn mở đầu đêm / qua đêm / thất bại
export default function NightCard({ data, coins = 0, onAction, onShop }) {
  const { type, night } = data;
  const endless = night.n > STORY_NIGHTS;

  if (type === 'prologue') {
    return (
      <div className="modal center night-modal">
        <div className="night-card story-card">
          <p className="night-kicker">Lời mở đầu</p>
          <h2 className="story-title">{PROLOGUE.title}</h2>
          <div className="letter">
            {PROLOGUE.paragraphs.map((p, i) => <p key={i}>{p}</p>)}
          </div>
          <button className="btn-primary" onClick={onAction} autoFocus>{PROLOGUE.button}</button>
        </div>
      </div>
    );
  }

  if (type === 'tutdone') {
    return (
      <div className="modal center night-modal">
        <div className="night-card">
          <p className="night-kicker">Hướng dẫn hoàn tất</p>
          <h2>Sẵn sàng</h2>
          <ul className="night-rules">
            <li>Mỗi con ma chỉ cho bạn <b>vài giây</b>. Hết giờ, nó lao tới tấn công</li>
            <li>Bắt hụt, ma <b>nổi điên</b> và chỉ còn tối đa 5 giây</li>
            <li><b>Pháp khí</b> bên trái giúp bạn lúc nguy, mua thêm ở tiệm trước mỗi đêm</li>
            <li>Mất hết <b>3 dương khí</b> là phải chơi lại đêm đó</li>
          </ul>
          <button className="btn-primary" onClick={onAction} autoFocus>Vào đêm 1</button>
        </div>
      </div>
    );
  }

  if (type === 'intro') {
    const tale = NIGHT_STORY[night.n]?.intro || (endless ? ENDLESS_INTRO : null);
    const omen = data.omen;
    return (
      <div className={`modal center night-modal ${night.boss ? 'boss-night' : ''}`}>
        <div className="night-card">
          <p className="night-kicker">{night.boss ? 'Đêm trùm' : endless ? 'Đêm vô tận' : `${night.n} / ${STORY_NIGHTS}`}</p>
          <h2>Đêm {night.n}</h2>
          {tale && <p className="tale">{tale}</p>}
          <p className="desc">{night.intro}</p>
          {omen?.tags.map((t) => (
            <p key={t.id} className={`omen-banner ${t.id}`}><b>{t.label}.</b> {t.desc}</p>
          ))}
          <ul className="night-rules">
            {night.boss ? (
              <>
                <li>Phong ấn trùm <b>3 lần</b>, mỗi lần nó đổi chiêu</li>
                <li><b>{BOSS.times.join(' / ')} giây</b> cho từng giai đoạn</li>
                <li>Bị tấn công thì trùm quay lại, <b>giữ nguyên tiến độ</b></li>
              </>
            ) : (
              <>
                <li><b>{night.quota}</b> oan hồn cần phong ấn</li>
                <li><b>{Number.isInteger(night.catchSec) ? night.catchSec : night.catchSec.toFixed(1)} giây</b> cho mỗi lần chạm trán</li>
                {night.behaviors && <li>Mỗi con ma có <b>chiêu riêng</b></li>}
                {night.multi > 1 && <li>Tối đa <b>2 con</b> cùng lúc</li>}
                {night.decoys && <li>Có <b>bản giả</b> lẫn vào</li>}
              </>
            )}
          </ul>
          <div className="night-actions">
            <button className="btn-ghost shop-btn" onClick={onShop}>
              Tiệm vàng mã <span className="coin-pill"><i className="coin" />{coins}</span>
            </button>
            <button className="btn-primary" onClick={onAction} autoFocus>Bắt đầu đêm</button>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'clear') {
    return (
      <div className="modal center night-modal dawn">
        <div className="night-card">
          <p className="night-kicker">Gà đã gáy</p>
          <h2>{night.boss ? 'Trùm đã bị phong ấn' : 'Trời sáng rồi'}</h2>
          <p className="desc">
            {night.boss ? 'Ngôi nhà yên tĩnh trở lại. Nhưng những đêm vô tận vẫn đang chờ.' : `Bạn sống sót qua đêm ${night.n}.`}
          </p>
          {data.page && (
            <div className="journal-page">
              <p className="jp-kicker">Nhặt được: {data.page.title}</p>
              <p className="jp-text">{data.page.text}</p>
              <p className="jp-author">— {data.page.author}</p>
            </div>
          )}
          {data.newTitle && <p className="title-up">Thăng danh hiệu: <b>{data.newTitle}</b></p>}
          <div className="rewards">
            <span>+{data.bonusXp} XP</span>
            <span><i className="coin" />+{data.bonusCoins} vàng mã</span>
            <span>+2 Bùa Vàng</span>
            <span>+5 Bùa Giấy</span>
          </div>
          <button className="btn-primary" onClick={onAction} autoFocus>Sang đêm {night.n + 1}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal center night-modal dead">
      <div className="night-card failed">
        <p className="night-kicker">Đêm {night.n}</p>
        <h2>Cạn dương khí</h2>
        <p className="desc">
          {night.boss ? 'Trùm đã nuốt chửng bạn.' : `Bạn gục ngã khi mới phong ấn ${data.caught}/${night.quota} oan hồn.`}
        </p>
        <button className="btn-primary" onClick={onAction} autoFocus>Thử lại đêm {night.n}</button>
      </div>
    </div>
  );
}
