"use client";
import { useState, Fragment } from "react";
import { useRouter, usePathname } from "next/navigation";

function fmt(d) { if (!d) return "-"; return new Date(d).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' }); }
function rp(v) { if (!v) return "-"; return `Rp${v.toLocaleString("id-ID")}`; }

function StatusBadge({ status }) {
  if (status === 'present') return <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded text-xs border border-emerald-500/20">Hadir</span>;
  if (status === 'late') return <span className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded text-xs border border-red-500/20">Terlambat</span>;
  return <span className="px-2 py-0.5 bg-gray-500/10 text-gray-400 rounded text-xs border border-gray-500/20">Alpa</span>;
}

// ── EXCEL export helper ──────────────────────────────────────────
async function exportExcel(rows, filename) {
  const m = await import("xlsx");
  const XLSX = m.default ?? m;
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Absensi");
  XLSX.writeFile(wb, filename);
}

// ── CANVAS export helper ─────────────────────────────────────────
function exportCanvas(cols, rows, title, filename) {
  const PAD=28, RH=32, HH=40, TH=64, SW=80;
  const totalW = cols.reduce((s,c)=>s+c.w,0)+PAD*2;
  const totalH = PAD+TH+HH+rows.length*RH+SW+PAD;
  const cv=document.createElement('canvas');
  cv.width=totalW; cv.height=totalH;
  const ctx=cv.getContext('2d');
  ctx.fillStyle='#111827'; ctx.fillRect(0,0,totalW,totalH);
  ctx.fillStyle='#6B7280'; ctx.font='bold 10px Arial'; ctx.fillText('JT CELL GROUP',PAD,PAD+14);
  ctx.fillStyle='#F9FAFB'; ctx.font='bold 14px Arial'; ctx.fillText(title,PAD,PAD+34);
  const T=PAD+TH;
  ctx.fillStyle='rgba(99,102,241,0.12)'; ctx.fillRect(PAD,T,totalW-PAD*2,HH);
  let x=PAD;
  ctx.fillStyle='#9CA3AF'; ctx.font='bold 9px Arial';
  cols.forEach(c=>{ctx.fillText(c.label.toUpperCase(),x+6,T+24,c.w-8);x+=c.w;});
  rows.forEach((row,i)=>{
    const y=T+HH+i*RH;
    if(i%2===1){ctx.fillStyle='rgba(255,255,255,0.02)';ctx.fillRect(PAD,y,totalW-PAD*2,RH);}
    ctx.strokeStyle='rgba(255,255,255,0.04)';ctx.beginPath();ctx.moveTo(PAD,y);ctx.lineTo(totalW-PAD,y);ctx.stroke();
    x=PAD;
    row.forEach((v,vi)=>{
      ctx.fillStyle=vi===0?'#FFF':row._red?.includes(vi)?'#F87171':row._green?.includes(vi)?'#6EE7B7':'#D1D5DB';
      ctx.font=vi===0?'bold 10px Arial':'9px Arial';
      ctx.fillText(String(v??'-'),x+6,y+21,cols[vi].w-8);
      x+=cols[vi].w;
    });
  });
  const link=document.createElement('a');link.download=filename;link.href=cv.toDataURL('image/png');link.click();
}

// ════════════════════════════════════════════════════════════════
export default function AttendanceReportClient({ dailyData, rangeData, branches, user, currentParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mode, setMode] = useState(currentParams.mode);
  const [date, setDate] = useState(currentParams.date);
  const [startDate, setStartDate] = useState(currentParams.startDate);
  const [endDate, setEndDate] = useState(currentParams.endDate);
  const [branchId, setBranchId] = useState(currentParams.branchId);
  const [expanded, setExpanded] = useState({});

  const go = (m = mode) => {
    const p = new URLSearchParams({ mode: m, date, startDate, endDate, branchId });
    router.push(`${pathname}?${p}`);
  };

  const switchMode = (m) => { setMode(m); go(m); };

  // ── DAILY totals ─────────────────────────────────────────────
  const dailyDeduction = dailyData.reduce((s,r)=>s+(r.deduction||0),0);
  const dailyHadir = dailyData.filter(d=>d.status==='present'||d.status==='late').length;
  const dailyTelat = dailyData.filter(d=>d.status==='late').length;
  const dailyAbsen = dailyData.filter(d=>d.status==='absent').length;

  // ── RANGE totals ─────────────────────────────────────────────
  const rangeDeduction = rangeData.reduce((s,r)=>s+(r.totalDeduction||0),0);

  // ── EXPORT DAILY EXCEL ───────────────────────────────────────
  const handleDailyExcel = () => {
    const rows = dailyData.map(r=>({
      Nama: r.full_name, Role: r.role, Cabang: r.branches?.name||'-',
      Status: r.status==='present'?'Hadir':r.status==='late'?'Terlambat':'Alpa',
      Masuk: fmt(r.check_in), Istirahat: fmt(r.break_start), Kembali: fmt(r.break_end), Pulang: fmt(r.check_out),
      'Potongan (Rp)': r.deduction||0, Keterangan: r.deduction_notes||'-',
    }));
    if (dailyDeduction>0) rows.push({'Nama':'TOTAL POTONGAN','Potongan (Rp)':dailyDeduction});
    exportExcel(rows, `Absensi_${date}.xlsx`);
  };

  // ── EXPORT RANGE EXCEL ───────────────────────────────────────
  const handleRangeExcel = () => {
    const rows = rangeData.map(r=>({
      Nama: r.full_name, Role: r.role, Cabang: r.branches?.name||'-',
      'Hadir (hari)': r.totalPresent, 'Terlambat (hari)': r.totalLate, 'Alpa (hari)': r.totalAbsent,
      'Total Potongan (Rp)': r.totalDeduction,
    }));
    if (rangeDeduction>0) rows.push({'Nama':'TOTAL','Total Potongan (Rp)':rangeDeduction});
    exportExcel(rows, `Rekap_${startDate}_sd_${endDate}.xlsx`);
  };

  // ── EXPORT DAILY JPG ─────────────────────────────────────────
  const handleDailyJpg = () => {
    const cols=[{label:'Nama',w:180},{label:'Role',w:80},{label:'Cabang',w:140},{label:'Status',w:80},
      {label:'Masuk',w:60},{label:'Istirahat',w:70},{label:'Kembali',w:70},{label:'Pulang',w:60},
      {label:'Potongan',w:100},{label:'Ket.',w:150}];
    const rows = dailyData.map(r=>{
      const v=[r.full_name,r.role,r.branches?.name||'-',
        r.status==='present'?'Hadir':r.status==='late'?'Terlambat':'Alpa',
        fmt(r.check_in),fmt(r.break_start),fmt(r.break_end),fmt(r.check_out),
        r.deduction>0?rp(r.deduction):'-',r.deduction_notes||'-'];
      v._red=[8]; v._green=[];
      return v;
    });
    exportCanvas(cols, rows, `Rekap Absensi — ${date}`, `Absensi_${date}.png`);
  };

  // ── EXPORT RANGE JPG ─────────────────────────────────────────
  const handleRangeJpg = () => {
    const cols=[{label:'Nama',w:180},{label:'Role',w:80},{label:'Cabang',w:140},
      {label:'Hadir',w:70},{label:'Terlambat',w:90},{label:'Alpa',w:70},{label:'Total Potongan',w:130}];
    const rows = rangeData.map(r=>{
      const v=[r.full_name,r.role,r.branches?.name||'-',r.totalPresent,r.totalLate,r.totalAbsent,rp(r.totalDeduction)];
      v._red=[6]; v._green=[3];
      return v;
    });
    exportCanvas(cols, rows, `Rekap ${startDate} s/d ${endDate}`, `Rekap_${startDate}_${endDate}.png`);
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl w-fit">
        <button onClick={()=>switchMode('daily')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode==='daily'?'bg-indigo-500 text-white':'text-gray-400 hover:text-white'}`}>
          <span className="material-symbols-outlined text-[16px] mr-1.5 align-middle">today</span>Per Tanggal
        </button>
        <button onClick={()=>switchMode('range')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${mode==='range'?'bg-indigo-500 text-white':'text-gray-400 hover:text-white'}`}>
          <span className="material-symbols-outlined text-[16px] mr-1.5 align-middle">date_range</span>Rentang Tanggal
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-end gap-3 p-4 bg-white/5 border border-white/10 rounded-xl">
        {mode === 'daily' ? (
          <div className="flex-1 min-w-[160px]">
            <label className="block text-xs font-medium text-gray-400 mb-1">Tanggal</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)}
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500/50 transition-colors" />
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-400 mb-1">Dari Tanggal</label>
              <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
            <div className="flex-1 min-w-[140px]">
              <label className="block text-xs font-medium text-gray-400 mb-1">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)}
                className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500/50 transition-colors" />
            </div>
          </>
        )}

        {user.role === 'owner' && (
          <div className="flex-1 min-w-[140px]">
            <label className="block text-xs font-medium text-gray-400 mb-1">Cabang</label>
            <select value={branchId} onChange={e=>setBranchId(e.target.value)}
              className="w-full h-10 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-sm outline-none focus:border-indigo-500/50 transition-colors">
              <option value="all" className="bg-[#1a1c23]">Semua Cabang</option>
              {branches.map(b=><option key={b.id} value={b.id} className="bg-[#1a1c23]">{b.name}</option>)}
            </select>
          </div>
        )}

        <button onClick={()=>go()}
          className="h-10 px-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]">filter_list</span>Filter
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <button onClick={mode==='daily'?handleDailyExcel:handleRangeExcel}
            className="h-10 px-4 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">table_view</span>Excel
          </button>
          <button onClick={mode==='daily'?handleDailyJpg:handleRangeJpg}
            className="h-10 px-4 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px]">image</span>JPG
          </button>
        </div>
      </div>

      {/* ── DAILY TABLE ───────────────────────────────────────── */}
      {mode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-white">Rekap Absensi — {date}</p>
            {dailyDeduction>0 && <p className="text-sm font-bold text-red-400">Total Potongan: -{rp(dailyDeduction)}</p>}
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  {['Nama Tim','Role','Cabang','Status','Masuk','Istirahat','Kembali','Pulang','Potongan','Keterangan'].map(h=>(
                    <th key={h} className={`px-4 py-3 font-semibold${h==='Potongan'?' text-red-400':''}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {dailyData.length===0
                  ? <tr><td colSpan="10" className="px-4 py-8 text-center text-gray-500">Tidak ada data absensi.</td></tr>
                  : dailyData.map(row=>(
                    <tr key={row.profile_id} className="hover:bg-white/[0.02] transition-colors text-gray-300">
                      <td className="px-4 py-3 font-medium text-white">{row.full_name}</td>
                      <td className="px-4 py-3 capitalize text-xs text-gray-400">{row.role}</td>
                      <td className="px-4 py-3 text-xs">{row.branches?.name||'-'}</td>
                      <td className="px-4 py-3"><StatusBadge status={row.status}/></td>
                      <td className="px-4 py-3">{fmt(row.check_in)}</td>
                      <td className="px-4 py-3">{fmt(row.break_start)}</td>
                      <td className="px-4 py-3">{fmt(row.break_end)}</td>
                      <td className="px-4 py-3">{fmt(row.check_out)}</td>
                      <td className="px-4 py-3 font-bold">{row.deduction>0?<span className="text-red-400">{rp(row.deduction)}</span>:<span className="text-gray-600">-</span>}</td>
                      <td className="px-4 py-3 text-xs text-gray-400">{row.deduction_notes||'-'}</td>
                    </tr>
                  ))
                }
              </tbody>
              {dailyDeduction>0 && (
                <tfoot className="bg-red-500/5 border-t border-red-500/20">
                  <tr>
                    <td colSpan="8" className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-right">Total Potongan Hari Ini</td>
                    <td className="px-4 py-3 font-bold text-red-400">{rp(dailyDeduction)}</td><td/>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[{l:'Total Hadir',v:`${dailyHadir} Orang`,c:'emerald'},{l:'Terlambat',v:`${dailyTelat} Orang`,c:'red'},{l:'Tidak Hadir',v:`${dailyAbsen} Orang`,c:'gray'},{l:'Total Potongan',v:rp(dailyDeduction),c:'red'}].map(({l,v,c})=>(
              <div key={l} className={`p-4 bg-${c}-500/5 border border-${c}-500/10 rounded-xl`}>
                <span className="text-xs text-gray-400 block mb-1">{l}</span>
                <span className={`text-xl font-bold text-${c}-400`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── RANGE TABLE ───────────────────────────────────────── */}
      {mode === 'range' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-white">Rekap {startDate} s/d {endDate}</p>
            {rangeDeduction>0 && <p className="text-sm font-bold text-red-400">Total Potongan: -{rp(rangeDeduction)}</p>}
          </div>
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 font-semibold w-8"></th>
                  <th className="px-4 py-3 font-semibold">Nama</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Cabang</th>
                  <th className="px-4 py-3 font-semibold text-emerald-400">Hadir</th>
                  <th className="px-4 py-3 font-semibold text-amber-400">Terlambat</th>
                  <th className="px-4 py-3 font-semibold text-gray-400">Alpa</th>
                  <th className="px-4 py-3 font-semibold text-red-400">Total Potongan</th>
                </tr>
              </thead>
              <tbody>
                {rangeData.length===0
                  ? <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Tidak ada data untuk rentang tanggal ini.</td></tr>
                  : rangeData.map(row=>(
                    <Fragment key={row.profile_id}>
                      <tr className="border-t border-white/5 hover:bg-white/[0.02] transition-colors text-gray-300 cursor-pointer"
                        onClick={()=>setExpanded(e=>({...e,[row.profile_id]:!e[row.profile_id]}))}>
                        <td className="px-4 py-3">
                          <span className="material-symbols-outlined text-[16px] text-gray-500 transition-transform" style={{display:'block',transform:expanded[row.profile_id]?'rotate(90deg)':'rotate(0)'}}>chevron_right</span>
                        </td>
                        <td className="px-4 py-3 font-medium text-white">{row.full_name}</td>
                        <td className="px-4 py-3 capitalize text-xs text-gray-400">{row.role}</td>
                        <td className="px-4 py-3 text-xs">{row.branches?.name||'-'}</td>
                        <td className="px-4 py-3 font-bold text-emerald-400">{row.totalPresent} hari</td>
                        <td className="px-4 py-3 font-bold text-amber-400">{row.totalLate} hari</td>
                        <td className="px-4 py-3 font-bold text-gray-400">{row.totalAbsent} hari</td>
                        <td className="px-4 py-3 font-bold">{row.totalDeduction>0?<span className="text-red-400">{rp(row.totalDeduction)}</span>:<span className="text-gray-600">-</span>}</td>
                      </tr>
                      {expanded[row.profile_id] && row.dailyDetails?.map(d=>(
                        <tr key={`${row.profile_id}-${d.date}`} className="bg-white/[0.01] border-t border-white/[0.03]">
                          <td className="px-4 py-2"></td>
                          <td className="px-4 py-2 text-xs text-gray-500 pl-10">{d.date}</td>
                          <td colSpan="2" className="px-4 py-2"><StatusBadge status={d.status}/></td>
                          <td colSpan="3" className="px-4 py-2 text-xs text-gray-400">{d.deduction_notes||'-'}</td>
                          <td className="px-4 py-2 text-xs font-medium">{d.deduction>0?<span className="text-red-400">{rp(d.deduction)}</span>:'-'}</td>
                        </tr>
                      ))}
                    </Fragment>
                  ))
                }
              </tbody>
              {rangeDeduction>0 && (
                <tfoot className="bg-red-500/5 border-t border-red-500/20">
                  <tr>
                    <td colSpan="7" className="px-4 py-3 text-xs font-bold text-gray-400 uppercase text-right">Total Potongan Periode</td>
                    <td className="px-4 py-3 font-bold text-red-400">{rp(rangeDeduction)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {l:'Total Staf',v:`${rangeData.length} Orang`,c:'indigo'},
              {l:'Total Hari Terlambat',v:`${rangeData.reduce((s,r)=>s+r.totalLate,0)} Hari`,c:'amber'},
              {l:'Total Hari Alpa',v:`${rangeData.reduce((s,r)=>s+r.totalAbsent,0)} Hari`,c:'gray'},
              {l:'Total Potongan',v:rp(rangeDeduction),c:'red'},
            ].map(({l,v,c})=>(
              <div key={l} className={`p-4 bg-${c}-500/5 border border-${c}-500/10 rounded-xl`}>
                <span className="text-xs text-gray-400 block mb-1">{l}</span>
                <span className={`text-xl font-bold text-${c}-400`}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
