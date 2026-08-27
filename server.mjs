import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const port = process.env.PORT || 3000;
const publicDir = join(process.cwd(), 'public');
const codalSearch = 'https://search.codal.ir/api/search/v2/q';

const sampleReports = [
  { symbol: 'فولاد', company: 'فولاد مبارکه اصفهان', title: 'گزارش فعالیت ماهانه دوره ۱ ماهه منتهی به ۱۴۰۵/۰۵/۳۱', date: '۱۴۰۵/۰۶/۰۸', value: 18420, previous: 15680, annual: 13390 },
  { symbol: 'شستا', company: 'شرکت سرمایه گذاری تامین اجتماعی', title: 'صورت‌های مالی میان‌دوره‌ای تلفیقی ۶ ماهه', date: '۱۴۰۵/۰۶/۰۷', value: 9210, previous: 8740, annual: 7020 },
  { symbol: 'کگل', company: 'صنعتی و معدنی گل گهر', title: 'گزارش فعالیت ماهانه دوره ۱ ماهه', date: '۱۴۰۵/۰۶/۰۶', value: 12480, previous: 11830, annual: 9860 },
  { symbol: 'فملی', company: 'ملی صنایع مس ایران', title: 'اطلاعات و صورت‌های مالی میان‌دوره‌ای', date: '۱۴۰۵/۰۶/۰۵', value: 16730, previous: 15120, annual: 12950 }
];

function json(res, payload, status = 200) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function normalizeReport(item) {
  return {
    symbol: item.Symbol || item.CompanySymbol || '—',
    company: item.CompanyName || 'شرکت پذیرفته‌شده در بورس',
    title: item.Title || item.LetterTitle || 'اطلاعیه کدال',
    date: item.PublishDateTime || item.SentDateTime || '—',
    url: item.Url ? `https://www.codal.ir${item.Url}` : 'https://www.codal.ir'
  };
}

async function reports(symbol) {
  const query = new URLSearchParams({ PageNumber: '1', PageSize: '12', search: 'true' });
  if (symbol) query.set('Symbol', symbol);
  const response = await fetch(`${codalSearch}?${query}`, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(7000) });
  if (!response.ok) throw new Error(`Codal returned ${response.status}`);
  const body = await response.json();
  const list = body?.Letters || body?.data?.Letters || body?.Data || [];
  if (!Array.isArray(list)) throw new Error('Unexpected Codal response');
  return list.map(normalizeReport);
}

const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/api/reports') {
    try { json(res, { source: 'live', reports: await reports(url.searchParams.get('symbol')?.trim()) }); }
    catch (error) { json(res, { source: 'sample', notice: 'دسترسی به کدال موقتاً برقرار نشد؛ داده‌های نمونه نمایش داده می‌شوند.', reports: sampleReports.map(({ previous, annual, value, ...report }) => report) }); }
    return;
  }
  const safePath = normalize(url.pathname === '/' ? '/index.html' : url.pathname).replace(/^\.\.\/(?:\.\.\/)+/, '');
  try {
    const file = await readFile(join(publicDir, safePath));
    res.writeHead(200, { 'content-type': mime[extname(safePath)] || 'application/octet-stream' });
    res.end(file);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, () => console.log(`Codal Insight running at http://localhost:${port}`));
