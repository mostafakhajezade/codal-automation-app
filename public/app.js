const list = document.querySelector('#report-list');
const notice = document.querySelector('#notice');
const symbol = document.querySelector('#symbol');
const load = document.querySelector('#load');

function escapeHtml(value) { const el = document.createElement('span'); el.textContent = value; return el.innerHTML; }
function render(reports) {
  list.innerHTML = reports.map((r, index) => `<article class="report"><span class="badge">${escapeHtml(r.symbol || 'کدال')}</span><div><h3>${escapeHtml(r.company)}</h3><p>${escapeHtml(r.title)}</p></div><time>${escapeHtml(r.date)}</time><a href="${r.url || 'https://www.codal.ir'}" target="_blank" rel="noreferrer">مشاهده ←</a></article>`).join('') || '<p>اطلاعیه‌ای پیدا نشد.</p>';
}
async function getReports() {
  load.disabled = true; load.firstChild.textContent = 'در حال دریافت… ';
  list.innerHTML = '<p>در حال دریافت اطلاعیه‌ها…</p>'; notice.hidden = true;
  try { const res = await fetch(`/api/reports?symbol=${encodeURIComponent(symbol.value)}`); const data = await res.json(); render(data.reports); if (data.notice) { notice.textContent = data.notice; notice.hidden = false; } }
  catch { list.innerHTML = '<p>دریافت داده‌ها ناموفق بود. دوباره تلاش کنید.</p>'; }
  finally { load.disabled = false; load.firstChild.textContent = 'بروزرسانی داده‌ها '; }
}
load.addEventListener('click', getReports); symbol.addEventListener('keydown', e => { if (e.key === 'Enter') getReports(); }); getReports();
