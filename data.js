/* Formulir Data Siswa: simpan di perangkat (localStorage), ekspor/impor Excel, sinkron ke file Excel. */
const KEY = 'data_siswa_v1';
const O = {
  jk: ['Laki-laki', 'Perempuan'], agama: ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha', 'Konghucu', 'Lainnya'],
  goldar: ['A', 'B', 'AB', 'O', 'Tidak tahu'], kelas: ['VII', 'VIII', 'IX', 'X', 'XI', 'XII'],
  jurusan: ['Umum', 'IPA', 'IPS', 'Bahasa', 'TKJ', 'Akuntansi', 'Multimedia', 'Lainnya'], status: ['Aktif', 'Pindah', 'Lulus', 'Keluar']
};
// [kunci, label, tipe, bagian, wajib, opsi: {o:pilihan, w:lebar, ph:placeholder, im:inputmode}]
const F = [
  ['nis', 'NIS', 'text', 'pribadi', 1, { im: 'numeric', ph: 'contoh: 2024001' }],
  ['nisn', 'NISN', 'text', 'pribadi', 0, { im: 'numeric', ph: '10 digit' }],
  ['nama', 'Nama lengkap', 'text', 'pribadi', 1, {}],
  ['jk', 'Jenis kelamin', 'select', 'pribadi', 1, { o: O.jk }],
  ['tmpLahir', 'Tempat lahir', 'text', 'pribadi', 1, {}],
  ['tglLahir', 'Tanggal lahir', 'date', 'pribadi', 1, {}],
  ['agama', 'Agama', 'select', 'pribadi', 1, { o: O.agama }],
  ['goldar', 'Golongan darah', 'select', 'pribadi', 0, { o: O.goldar }],
  ['anakKe', 'Anak ke-', 'number', 'pribadi', 0, { min: 1 }],
  ['saudara', 'Jumlah saudara', 'number', 'pribadi', 0, { min: 0 }],
  ['hobi', 'Hobi', 'text', 'pribadi', 0, {}],
  ['cita', 'Cita-cita', 'text', 'pribadi', 0, {}],
  ['alamat', 'Alamat lengkap', 'textarea', 'kontak', 1, { w: 3 }],
  ['kota', 'Kota / Kabupaten', 'text', 'kontak', 1, {}],
  ['kodepos', 'Kode pos', 'text', 'kontak', 0, { im: 'numeric' }],
  ['hp', 'No. HP siswa', 'tel', 'kontak', 0, { ph: '08xxxxxxxxxx' }],
  ['email', 'Email', 'email', 'kontak', 0, { w: 2 }],
  ['kelas', 'Kelas', 'select', 'sekolah', 1, { o: O.kelas }],
  ['jurusan', 'Jurusan / peminatan', 'select', 'sekolah', 0, { o: O.jurusan }],
  ['tahunMasuk', 'Tahun masuk', 'number', 'sekolah', 1, { min: 2000 }],
  ['asalSekolah', 'Asal sekolah', 'text', 'sekolah', 0, { w: 2 }],
  ['status', 'Status siswa', 'select', 'sekolah', 1, { o: O.status }],
  ['ayah', 'Nama ayah', 'text', 'ortu', 0, {}],
  ['kerjaAyah', 'Pekerjaan ayah', 'text', 'ortu', 0, {}],
  ['ibu', 'Nama ibu', 'text', 'ortu', 1, {}],
  ['kerjaIbu', 'Pekerjaan ibu', 'text', 'ortu', 0, {}],
  ['wali', 'Nama wali (jika ada)', 'text', 'ortu', 0, {}],
  ['hpOrtu', 'No. HP orang tua / wali', 'tel', 'ortu', 1, { ph: '08xxxxxxxxxx' }],
  ['tinggi', 'Tinggi badan (cm)', 'number', 'sehat', 0, { min: 30 }],
  ['berat', 'Berat badan (kg)', 'number', 'sehat', 0, { min: 5 }]
];
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let data = [], editId = null, foto = '', fh = null;
try { data = JSON.parse(localStorage.getItem(KEY)) || []; } catch (_) { data = []; }

/* ---------- Bentuk formulir ---------- */
F.forEach(([k, l, t, sec, req, o]) => {
  const w = o.w ? ' w' + o.w : '';
  const attrs = `id="f_${k}" name="${k}"${o.ph ? ` placeholder="${o.ph}"` : ''}${o.im ? ` inputmode="${o.im}"` : ''}${o.min !== undefined ? ` min="${o.min}"` : ''}`;
  const ctl = t === 'select' ? `<select ${attrs}><option value="">Pilih...</option>${o.o.map(x => `<option>${x}</option>`).join('')}</select>`
    : t === 'textarea' ? `<textarea ${attrs} rows="2"></textarea>` : `<input type="${t}" ${attrs}>`;
  $(`[data-sec="${sec}"]`).insertAdjacentHTML('beforeend', `<div class="field${w}" id="w_${k}"><label for="f_${k}">${l}${req ? ' <b class="req">*</b>' : ''}</label>${ctl}<span class="msg" id="m_${k}"></span></div>`);
});
$('#fKelas').innerHTML = '<option value="">Semua kelas</option>' + O.kelas.map(x => `<option>${x}</option>`).join('');
const resetForm = () => {
  $('#siswaForm').reset(); editId = null; foto = ''; setPv('');
  $('#formTitle').textContent = 'Tambah siswa baru'; $('#saveBtn').textContent = 'Simpan data'; $('#cancelEdit').hidden = true;
  document.querySelectorAll('.field.bad').forEach(f => f.classList.remove('bad')); document.querySelectorAll('.msg').forEach(m => { m.textContent = ''; });
  $('#f_tahunMasuk').value = new Date().getFullYear(); $('#f_status').value = 'Aktif';
};
resetForm();

/* ---------- Foto (diperkecil agar muat di penyimpanan) ---------- */
function setPv(src) { const p = $('#pv'); p.style.backgroundImage = src ? `url(${src})` : ''; p.textContent = src ? '' : 'Foto'; }
$('#foto').addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(), url = URL.createObjectURL(f);
  img.onload = () => {
    const W = 180, H = 225, c = document.createElement('canvas'); c.width = W; c.height = H;
    const r = Math.max(W / img.width, H / img.height), sw = W / r, sh = H / r;
    c.getContext('2d').drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, W, H);
    foto = c.toDataURL('image/jpeg', 0.8); setPv(foto); URL.revokeObjectURL(url);
  };
  img.onerror = () => toast('File foto tidak bisa dibaca.'); img.src = url;
});
$('#rmFoto').addEventListener('click', () => { foto = ''; $('#foto').value = ''; setPv(''); });

/* ---------- Validasi & simpan ---------- */
function validate(d) {
  const err = {}, now = new Date(), yr = now.getFullYear();
  F.forEach(([k, l, , , req]) => { if (req && !String(d[k]).trim()) err[k] = l + ' wajib diisi.'; });
  if (!err.nis) { if (!/^\d{3,20}$/.test(d.nis)) err.nis = 'NIS hanya angka (3-20 digit).'; else if (data.some(x => x.nis === d.nis && x.id !== editId)) err.nis = 'NIS ini sudah terdaftar.'; }
  if (d.nisn && !/^\d{10}$/.test(d.nisn)) err.nisn = 'NISN harus 10 digit angka.';
  if (d.tglLahir && new Date(d.tglLahir) > now) err.tglLahir = 'Tanggal lahir tidak boleh di masa depan.';
  ['hp', 'hpOrtu'].forEach(k => { if (d[k] && !/^\+?\d{9,15}$/.test(d[k].replace(/[\s-]/g, ''))) err[k] = 'Nomor HP tidak valid (9-15 digit).'; });
  if (d.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.email)) err.email = 'Format email tidak valid.';
  if (d.kodepos && !/^\d{5}$/.test(d.kodepos)) err.kodepos = 'Kode pos 5 digit.';
  if (d.tahunMasuk && (d.tahunMasuk < 2000 || d.tahunMasuk > yr + 1)) err.tahunMasuk = 'Tahun masuk tidak masuk akal.';
  return err;
}
$('#siswaForm').addEventListener('submit', e => {
  e.preventDefault();
  const d = {}; F.forEach(([k]) => { d[k] = $('#f_' + k).value.trim(); });
  const err = validate(d);
  F.forEach(([k]) => { $('#w_' + k).classList.toggle('bad', !!err[k]); $('#m_' + k).textContent = err[k] || ''; });
  const first = Object.keys(err)[0];
  if (first) { $('#f_' + first).focus(); toast('Periksa kembali isian yang bertanda merah.'); return; }
  if (editId) { const i = data.findIndex(x => x.id === editId); data[i] = { ...data[i], ...d, foto }; toast('Perubahan disimpan.'); }
  else { data.unshift({ id: 'S' + Date.now(), ...d, foto, dibuat: new Date().toISOString() }); toast('Data siswa ditambahkan.'); }
  commit(); resetForm();
  $('#tableCard').scrollIntoView({ behavior: 'smooth' });
});
$('#resetBtn').addEventListener('click', resetForm);
$('#cancelEdit').addEventListener('click', resetForm);

function commit() {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (_) { toast('Penyimpanan penuh. Hapus foto atau unduh data ke Excel.'); }
  render(); syncExcel();
}

/* ---------- Tabel review ---------- */
const tgl = s => { if (!s) return '-'; const d = new Date(s + 'T00:00:00'); return isNaN(d) ? s : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }); };
const filtered = () => {
  const q = $('#q').value.trim().toLowerCase(), k = $('#fKelas').value;
  return data.filter(s => (!k || s.kelas === k) && (!q || [s.nama, s.nis, s.nisn, s.kelas, s.kota, s.jurusan].join(' ').toLowerCase().includes(q)));
};
function render() {
  const l = filtered();
  $('#rows').innerHTML = l.map((s, i) => `<tr data-id="${s.id}"><td>${i + 1}</td><td>${s.foto ? `<img class="av" src="${s.foto}" alt="">` : '<div class="av"></div>'}</td><td>${esc(s.nis)}</td><td class="nm">${esc(s.nama)}</td><td>${s.jk === 'Laki-laki' ? 'L' : s.jk === 'Perempuan' ? 'P' : '-'}</td><td>${esc(s.tmpLahir)}, ${tgl(s.tglLahir)}</td><td>${esc(s.kelas)}</td><td>${esc(s.jurusan || '-')}</td><td>${esc(s.hp || s.hpOrtu || '-')}</td><td><span class="chip ${s.status === 'Aktif' ? '' : s.status === 'Lulus' ? 'lulus' : 'off'}">${esc(s.status)}</span></td><td class="noprint"><div class="acts"><button class="btn ghost sm" data-a="d">Detail</button><button class="btn ghost sm" data-a="e">Ubah</button><button class="btn danger sm" data-a="x">Hapus</button></div></td></tr>`).join('');
  $('#empty').style.display = l.length ? 'none' : 'block';
  $('#empty').textContent = data.length ? 'Tidak ada data yang cocok dengan pencarian.' : 'Belum ada data. Isi formulir di atas lalu klik Simpan data.';
  $('#count').textContent = `Menampilkan ${l.length} dari ${data.length} siswa`;
  const L = data.filter(s => s.jk === 'Laki-laki').length, P = data.filter(s => s.jk === 'Perempuan').length;
  $('#stats').innerHTML = [['Total siswa', data.length], ['Laki-laki', L], ['Perempuan', P], ['Siswa aktif', data.filter(s => s.status === 'Aktif').length]].map(([a, b]) => `<div class="stat"><b>${b}</b><span>${a}</span></div>`).join('');
}
$('#q').addEventListener('input', render); $('#fKelas').addEventListener('change', render);
$('#rows').addEventListener('click', e => {
  const b = e.target.closest('button[data-a]'); if (!b) return;
  const s = data.find(x => x.id === b.closest('tr').dataset.id); if (!s) return;
  if (b.dataset.a === 'x') { if (confirm(`Hapus data ${s.nama}? Tindakan ini tidak bisa dibatalkan.`)) { data = data.filter(x => x !== s); commit(); toast('Data dihapus.'); } }
  else if (b.dataset.a === 'e') {
    editId = s.id; foto = s.foto || ''; setPv(foto);
    F.forEach(([k]) => { $('#f_' + k).value = s[k] ?? ''; });
    $('#formTitle').textContent = 'Ubah data: ' + s.nama; $('#saveBtn').textContent = 'Simpan perubahan'; $('#cancelEdit').hidden = false;
    $('#formCard').scrollIntoView({ behavior: 'smooth' });
  } else detail(s);
});
function detail(s) {
  $('#detailDlg').innerHTML = `<div class="dhead">${s.foto ? `<img class="av" style="width:84px;height:105px" src="${s.foto}" alt="">` : ''}<div><h2>${esc(s.nama)}</h2><span class="hint">NIS ${esc(s.nis)} · Kelas ${esc(s.kelas)}</span></div></div><div class="dgrid">${F.map(([k, l]) => `<div><small>${l}</small>${esc(k === 'tglLahir' ? tgl(s[k]) : s[k] || '-')}</div>`).join('')}</div><button class="btn" onclick="this.closest('dialog').close()">Tutup</button>`;
  $('#detailDlg').showModal();
}
$('#clearBtn').addEventListener('click', () => {
  if (data.length && confirm(`Hapus SEMUA ${data.length} data siswa? Unduh dulu ke Excel bila perlu cadangan.`)) { data = []; commit(); toast('Semua data dihapus.'); }
});
$('#printBtn').addEventListener('click', () => window.print());

/*XLSX-START*/
const HEAD = [...F.map(f => f[1]), 'Tanggal input'];
const rowsOut = () => data.map(s => [...F.map(([k]) => k === 'tglLahir' && s[k] ? s[k].split('-').reverse().join('/') : String(s[k] ?? '')), (s.dibuat || '').slice(0, 10)]);
const xe = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '');
const colL = i => { let s = ''; for (i++; i > 0; i = (i - 1) / 26 | 0) s = String.fromCharCode(65 + (i - 1) % 26) + s; return s; };
const CT = [0, 1, 2, 3, 4, 5, 6, 7].map(() => 0); // placeholder agar tabel CRC dibuat sekali di bawah
const CRCT = (() => { const t = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = b => { let c = -1; for (let i = 0; i < b.length; i++) c = CRCT[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
function zipStore(files) {
  const enc = new TextEncoder(), parts = [], cen = []; let off = 0;
  const u16 = n => [n & 255, n >> 8 & 255], u32 = n => [n & 255, n >> 8 & 255, n >> 16 & 255, n >>> 24 & 255];
  files.forEach(f => {
    const nm = enc.encode(f.name), d = enc.encode(f.text), crc = crc32(d), sz = d.length;
    const lh = new Uint8Array([0x50, 0x4b, 3, 4, 20, 0, 0, 0, 0, 0, 0, 0, 33, 0, ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), 0, 0]);
    parts.push(lh, nm, d);
    cen.push(new Uint8Array([0x50, 0x4b, 1, 2, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 33, 0, ...u32(crc), ...u32(sz), ...u32(sz), ...u16(nm.length), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, ...u32(off)]), nm);
    off += lh.length + nm.length + sz;
  });
  const cl = cen.reduce((a, b) => a + b.length, 0);
  const end = new Uint8Array([0x50, 0x4b, 5, 6, 0, 0, 0, 0, ...u16(files.length), ...u16(files.length), ...u32(cl), ...u32(off), 0, 0]);
  return new Blob([...parts, ...cen, end], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
function buildXlsx() {
  const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main', R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const all = [HEAD, ...rowsOut()];
  const cell = (v, r, c) => `<c r="${colL(c)}${r + 1}" t="inlineStr"${r === 0 ? ' s="1"' : ''}><is><t xml:space="preserve">${xe(v)}</t></is></c>`;
  const sheet = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="${NS}"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${HEAD.map((h, i) => `<col min="${i + 1}" max="${i + 1}" width="${Math.max(14, Math.min(34, h.length + 6))}" customWidth="1"/>`).join('')}</cols><sheetData>${all.map((r, i) => `<row r="${i + 1}">${r.map((v, c) => cell(v, i, c)).join('')}</row>`).join('')}</sheetData></worksheet>`;
  const styles = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="${NS}"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1E4FD8"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>`;
  const H = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';
  return zipStore([
    { name: '[Content_Types].xml', text: `${H}<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { name: '_rels/.rels', text: `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: 'xl/workbook.xml', text: `${H}<workbook xmlns="${NS}" xmlns:r="${R}"><sheets><sheet name="Data Siswa" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: 'xl/_rels/workbook.xml.rels', text: `${H}<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="${R}/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="${R}/styles" Target="styles.xml"/></Relationships>` },
    { name: 'xl/styles.xml', text: styles },
    { name: 'xl/worksheets/sheet1.xml', text: sheet }
  ]);
}
/*XLSX-END*/

/* ---------- Unduh, impor, hubungkan ke Excel ---------- */
function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000); }
const stamp = () => new Date().toISOString().slice(0, 10);
$('#xlsxBtn').addEventListener('click', () => { if (!data.length) return toast('Belum ada data untuk diunduh.'); download(buildXlsx(), `data-siswa-${stamp()}.xlsx`); setStatus('File Excel diunduh. Buka dengan Microsoft Excel.'); });
$('#csvBtn').addEventListener('click', () => {
  if (!data.length) return toast('Belum ada data untuk diunduh.');
  const q = v => '"' + String(v).replace(/"/g, '""') + '"';
  const csv = '\ufeff' + [HEAD, ...rowsOut()].map(r => r.map(q).join(';')).join('\r\n'); // titik koma: cocok untuk Excel berbahasa Indonesia
  download(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `data-siswa-${stamp()}.csv`);
});
async function syncExcel() {
  if (!fh) return;
  try { const w = await fh.createWritable(); await w.write(buildXlsx()); await w.close(); setStatus(`Tersinkron ke "${fh.name}" pukul ${new Date().toLocaleTimeString('id-ID')}.`); }
  catch (e) { setStatus('Gagal menulis ke file Excel. Tutup file itu di Excel lalu simpan data lagi. (' + e.message + ')'); }
}
$('#linkBtn').addEventListener('click', async () => {
  if (!window.showSaveFilePicker) return alert('Fitur ini hanya ada di Chrome atau Edge pada komputer. Di browser lain, pakai tombol Unduh Excel.');
  try {
    fh = await showSaveFilePicker({ suggestedName: 'data-siswa.xlsx', types: [{ description: 'Excel', accept: { 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } }] });
    await syncExcel(); toast('File Excel terhubung. Setiap perubahan otomatis ditulis.');
  } catch (_) { /* dibatalkan */ }
});
$('#impBtn').addEventListener('click', () => $('#importFile').click());
$('#importFile').addEventListener('change', async e => {
  const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try {
    const rows = /\.xlsx$/i.test(f.name) ? await readXlsx(await f.arrayBuffer()) : parseCsv(await f.text());
    const n = importRows(rows); commit();
    setStatus(`Impor selesai: ${n.ok} data ditambahkan, ${n.skip} dilewati (NIS/nama kosong atau NIS sudah ada).`);
  } catch (err) { alert('File tidak bisa dibaca: ' + err.message); }
});
const norm = s => String(s).toLowerCase().replace(/[^a-z0-9]/g, '');
function importRows(rows) {
  const map = {}; (rows[0] || []).forEach((h, i) => { const f = F.find(([k, l]) => norm(l) === norm(h) || norm(k) === norm(h)); if (f) map[i] = f[0]; });
  let ok = 0, skip = 0;
  rows.slice(1).forEach(r => {
    const s = { id: 'S' + Date.now() + ok + skip, foto: '', dibuat: new Date().toISOString() };
    Object.entries(map).forEach(([i, k]) => { let v = String(r[i] ?? '').trim(); if (k === 'tglLahir') v = toIso(v); s[k] = v; });
    if (!s.nis || !s.nama || data.some(x => x.nis === s.nis)) { skip++; return; }
    F.forEach(([k]) => { s[k] = s[k] ?? ''; }); data.push(s); ok++;
  });
  return { ok, skip };
}
function toIso(v) {
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const m = v.match(/^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})$/); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (/^\d{5}(\.\d+)?$/.test(v)) return new Date(Date.UTC(1899, 11, 30) + Math.floor(v) * 864e5).toISOString().slice(0, 10);
  return '';
}
function parseCsv(t) {
  t = t.replace(/^\ufeff/, ''); const d = (t.split('\n')[0].match(/;/g) || []).length >= (t.split('\n')[0].match(/,/g) || []).length ? ';' : ',';
  const rows = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true; else if (ch === d) { r.push(c); c = ''; }
    else if (ch === '\n') { r.push(c.replace(/\r$/, '')); rows.push(r); r = []; c = ''; } else c += ch;
  }
  if (c || r.length) { r.push(c); rows.push(r); } return rows.filter(x => x.some(v => v.trim()));
}
async function inflate(b) { return new Uint8Array(await new Response(new Blob([b]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer()); }
async function readXlsx(buf) {
  const dv = new DataView(buf), u8 = new Uint8Array(buf), td = new TextDecoder(), out = {};
  let e = u8.length - 22; while (e >= 0 && dv.getUint32(e, true) !== 0x06054b50) e--;
  if (e < 0) throw new Error('bukan file .xlsx yang valid');
  let n = dv.getUint16(e + 10, true), p = dv.getUint32(e + 16, true);
  for (let i = 0; i < n; i++) {
    const m = dv.getUint16(p + 10, true), cs = dv.getUint32(p + 20, true), nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
    const name = td.decode(u8.subarray(p + 46, p + 46 + nl)); p += 46 + nl + el + cl;
    if (/xl\/worksheets\/sheet1\.xml$|xl\/sharedStrings\.xml$/.test(name)) {
      const ds = lo + 30 + dv.getUint16(lo + 26, true) + dv.getUint16(lo + 28, true), raw = u8.subarray(ds, ds + cs);
      out[name.split('/').pop()] = td.decode(m === 0 ? raw : await inflate(raw));
    }
  }
  if (!out['sheet1.xml']) throw new Error('lembar pertama tidak ditemukan');
  const px = s => new DOMParser().parseFromString(s, 'application/xml');
  const ss = out['sharedStrings.xml'] ? [...px(out['sharedStrings.xml']).getElementsByTagName('si')].map(si => [...si.getElementsByTagName('t')].map(t => t.textContent).join('')) : [];
  const rows = [];
  [...px(out['sheet1.xml']).getElementsByTagName('row')].forEach(row => {
    const r = [];
    [...row.getElementsByTagName('c')].forEach(c => {
      const col = (c.getAttribute('r') || '').replace(/\d+/g, ''); let idx = 0; for (const ch of col) idx = idx * 26 + ch.charCodeAt(0) - 64;
      const t = c.getAttribute('t'), v = c.getElementsByTagName('v')[0];
      r[idx - 1] = t === 's' ? ss[+v.textContent] : t === 'inlineStr' ? [...c.getElementsByTagName('t')].map(x => x.textContent).join('') : v ? v.textContent : '';
    });
    rows.push(Array.from(r, x => x ?? ''));
  });
  return rows.filter(x => x.some(v => String(v).trim()));
}

/* ---------- Pesan ---------- */
function setStatus(t) { $('#status').textContent = t; }
let tt; function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('show'); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('show'), 2600); }
render();