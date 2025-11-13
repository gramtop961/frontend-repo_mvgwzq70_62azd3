import { useEffect, useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Wallet, PiggyBank, Plus, TrendingUp, TrendingDown } from 'lucide-react'

const API = import.meta.env.VITE_BACKEND_URL || ''

function formatCurrency(n){
  return new Intl.NumberFormat('id-ID', { style:'currency', currency:'IDR', maximumFractionDigits:0 }).format(Number(n||0))
}

function StatCard({ title, value, icon: Icon, gradient }){
  return (
    <div className={`rounded-2xl p-5 text-white shadow-lg shadow-black/10 bg-gradient-to-br ${gradient}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm/5 opacity-90">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
        </div>
        <div className="p-3 bg-white/15 rounded-xl">
          <Icon size={28} />
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, action }){
  return (
    <div className="bg-white/70 rounded-2xl p-5 border border-white/60">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  )
}

export default function App(){
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0,7))
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  // forms
  const [showAdd, setShowAdd] = useState(null) // 'account' | 'category' | 'transaction' | 'budget'
  const [form, setForm] = useState({
    account: { name:'', type:'cash', initial_balance:0, color:'#6366F1' },
    category: { name:'', type:'expense', color:'#22C55E' },
    transaction: { date: new Date().toISOString().slice(0,10), amount: 0, type:'expense', category_id:'', account_id:'', note:'' },
    budget: { category_id:'', month: new Date().toISOString().slice(0,7), amount: 0 }
  })

  async function fetchSummary(m){
    setLoading(true)
    const res = await fetch(`${API}/api/summary${m?`?month=${m}`:''}`)
    const data = await res.json()
    setSummary(data)
    setLoading(false)
  }

  useEffect(()=>{ fetchSummary(month) },[])

  const recent = useMemo(()=> (summary?.transactions || []).slice(0,8), [summary])

  async function submit(endpoint, payload){
    const res = await fetch(`${API}${endpoint}`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) })
    if(!res.ok){
      const e = await res.json().catch(()=>({detail:'Gagal'}))
      alert(e.detail || 'Gagal menyimpan')
      return false
    }
    setShowAdd(null)
    await fetchSummary(month)
    return true
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-fuchsia-100 via-sky-100 to-emerald-100">
      <header className="sticky top-0 z-10 backdrop-blur bg-white/50 border-b border-white/40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-fuchsia-500 to-indigo-500" />
            <h1 className="text-xl font-bold">FinansiQ</h1>
          </div>
          <div className="flex items-center gap-3">
            <input value={month} onChange={e=>{setMonth(e.target.value); fetchSummary(e.target.value)}} type="month" className="px-3 py-2 rounded-xl border border-slate-200 bg-white/60" />
            <button onClick={()=>setShowAdd('transaction')} className="inline-flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-indigo-500 to-fuchsia-500 text-white rounded-xl text-sm">
              <Plus size={16}/> Transaksi
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {loading && <div className="animate-pulse h-32 rounded-2xl bg-white/60" />}
        {!loading && summary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Pemasukan" value={formatCurrency(summary.total_income)} icon={ArrowDownCircle} gradient="from-emerald-500/90 to-emerald-600/90" />
              <StatCard title="Pengeluaran" value={formatCurrency(summary.total_expense)} icon={ArrowUpCircle} gradient="from-rose-500/90 to-rose-600/90" />
              <StatCard title="Saldo Total" value={formatCurrency(summary.overall_balance)} icon={Wallet} gradient="from-indigo-500/90 to-violet-600/90" />
              <StatCard title="Jumlah Akun" value={Object.keys(summary.accounts||{}).length} icon={PiggyBank} gradient="from-cyan-500/90 to-sky-600/90" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Section title="Transaksi Terbaru" action={
                <button onClick={()=>setShowAdd('transaction')} className="inline-flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm">
                  <Plus size={16}/> Tambah
                </button>
              }>
                <div className="divide-y">
                  {recent.length===0 && <div className="py-10 text-center text-slate-500">Belum ada transaksi</div>}
                  {recent.map(t => (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl grid place-content-center ${t.type==='income'?'bg-emerald-100 text-emerald-600':'bg-rose-100 text-rose-600'}`}>
                          {t.type==='income' ? <TrendingUp size={20}/> : <TrendingDown size={20}/>} 
                        </div>
                        <div>
                          <p className="font-medium">{t.note || 'Transaksi'}</p>
                          <p className="text-xs text-slate-500">{new Date(t.date).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                      <div className={`font-semibold ${t.type==='income'?'text-emerald-600':'text-rose-600'}`}>{t.type==='income'?'+':'-'}{formatCurrency(t.amount)}</div>
                    </div>
                  ))}
                </div>
              </Section>

              <div className="space-y-4">
                <Section title="Saldo Akun" action={
                  <button onClick={()=>setShowAdd('account')} className="px-3 py-2 text-xs rounded-lg bg-sky-600 text-white">Tambah</button>
                }>
                  <div className="space-y-3">
                    {Object.keys(summary.accounts||{}).length===0 && <div className="text-sm text-slate-500">Belum ada akun</div>}
                    {Object.entries(summary.accounts||{}).map(([id,acc]) => (
                      <div key={id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full" style={{background:acc.color}} />
                          <span>{acc.name}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(acc.balance)}</span>
                      </div>
                    ))}
                  </div>
                </Section>

                <Section title="Anggaran Bulan Ini" action={
                  <button onClick={()=>setShowAdd('budget')} className="px-3 py-2 text-xs rounded-lg bg-emerald-600 text-white">Tambah</button>
                }>
                  <div className="space-y-4">
                    {(summary.budgets||[]).length===0 && <div className="text-sm text-slate-500">Belum ada anggaran</div>}
                    {(summary.budgets||[]).map(b => {
                      const pct = Math.min(100, Math.round((b.spent / Math.max(1,b.amount)) * 100))
                      return (
                        <div key={b.budget_id}>
                          <div className="flex items-center justify-between mb-1 text-sm">
                            <span>Kategori {b.category_id.slice(-4)}</span>
                            <span className="tabular-nums">{formatCurrency(b.spent)} / {formatCurrency(b.amount)}</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className={`h-full ${pct>90?'bg-rose-500':pct>70?'bg-amber-500':'bg-emerald-500'}`} style={{width:`${pct}%`}} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </Section>

                <Section title="Kategori" action={
                  <button onClick={()=>setShowAdd('category')} className="px-3 py-2 text-xs rounded-lg bg-fuchsia-600 text-white">Tambah</button>
                }>
                  <div className="flex flex-wrap gap-2">
                    {(summary.categories||[]).length===0 && <div className="text-sm text-slate-500">Belum ada kategori</div>}
                    {(summary.categories||[]).map(c => (
                      <span key={c.id} className="px-3 py-1 rounded-full text-xs border" style={{background:`${c.color}1A`, borderColor:`${c.color}40`}}>
                        {c.name}
                      </span>
                    ))}
                  </div>
                </Section>
              </div>
            </div>
          </>
        )}
      </main>

      {showAdd && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/40 p-4" onClick={()=>setShowAdd(null)}>
          <div className="w-full max-w-md bg-white rounded-2xl p-5" onClick={e=>e.stopPropagation()}>
            {showAdd==='account' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Tambah Akun</h3>
                <div className="space-y-3">
                  <input className="w-full px-3 py-2 border rounded-xl" placeholder="Nama Akun" value={form.account.name} onChange={e=>setForm(f=>({...f, account:{...f.account, name:e.target.value}}))} />
                  <select className="w-full px-3 py-2 border rounded-xl" value={form.account.type} onChange={e=>setForm(f=>({...f, account:{...f.account, type:e.target.value}}))}>
                    <option value="cash">Cash</option>
                    <option value="bank">Bank</option>
                    <option value="ewallet">E-Wallet</option>
                  </select>
                  <input type="number" className="w-full px-3 py-2 border rounded-xl" placeholder="Saldo Awal" value={form.account.initial_balance} onChange={e=>setForm(f=>({...f, account:{...f.account, initial_balance:Number(e.target.value)}}))} />
                  <input type="color" className="w-16 h-10 p-1 border rounded-xl" value={form.account.color} onChange={e=>setForm(f=>({...f, account:{...f.account, color:e.target.value}}))} />
                  <button onClick={()=>submit('/api/accounts', form.account)} className="w-full mt-2 py-2 rounded-xl bg-sky-600 text-white">Simpan</button>
                </div>
              </>
            )}
            {showAdd==='category' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Tambah Kategori</h3>
                <div className="space-y-3">
                  <input className="w-full px-3 py-2 border rounded-xl" placeholder="Nama Kategori" value={form.category.name} onChange={e=>setForm(f=>({...f, category:{...f.category, name:e.target.value}}))} />
                  <select className="w-full px-3 py-2 border rounded-xl" value={form.category.type} onChange={e=>setForm(f=>({...f, category:{...f.category, type:e.target.value}}))}>
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                  <input type="color" className="w-16 h-10 p-1 border rounded-xl" value={form.category.color} onChange={e=>setForm(f=>({...f, category:{...f.category, color:e.target.value}}))} />
                  <button onClick={()=>submit('/api/categories', form.category)} className="w-full mt-2 py-2 rounded-xl bg-fuchsia-600 text-white">Simpan</button>
                </div>
              </>
            )}
            {showAdd==='transaction' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Tambah Transaksi</h3>
                <div className="space-y-3">
                  <input type="date" className="w-full px-3 py-2 border rounded-xl" value={form.transaction.date} onChange={e=>setForm(f=>({...f, transaction:{...f.transaction, date:e.target.value}}))} />
                  <input type="number" className="w-full px-3 py-2 border rounded-xl" placeholder="Jumlah" value={form.transaction.amount} onChange={e=>setForm(f=>({...f, transaction:{...f.transaction, amount:Number(e.target.value)}}))} />
                  <select className="w-full px-3 py-2 border rounded-xl" value={form.transaction.type} onChange={e=>setForm(f=>({...f, transaction:{...f.transaction, type:e.target.value}}))}>
                    <option value="expense">Pengeluaran</option>
                    <option value="income">Pemasukan</option>
                  </select>
                  <input className="w-full px-3 py-2 border rounded-xl" placeholder="Catatan (opsional)" value={form.transaction.note} onChange={e=>setForm(f=>({...f, transaction:{...f.transaction, note:e.target.value}}))} />
                  <select className="w-full px-3 py-2 border rounded-xl" value={form.transaction.account_id} onChange={e=>setForm(f=>({...f, transaction:{...f.transaction, account_id:e.target.value}}))}>
                    <option value="">Pilih Akun</option>
                    {Object.entries(summary.accounts||{}).map(([id,acc]) => (
                      <option key={id} value={id}>{acc.name}</option>
                    ))}
                  </select>
                  <select className="w-full px-3 py-2 border rounded-xl" value={form.transaction.category_id} onChange={e=>setForm(f=>({...f, transaction:{...f.transaction, category_id:e.target.value}}))}>
                    <option value="">Pilih Kategori</option>
                    {(summary.categories||[]).map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
                    ))}
                  </select>
                  <button onClick={()=>submit('/api/transactions', form.transaction)} className="w-full mt-2 py-2 rounded-xl bg-indigo-600 text-white">Simpan</button>
                </div>
              </>
            )}
            {showAdd==='budget' && (
              <>
                <h3 className="text-lg font-semibold mb-4">Tambah Anggaran</h3>
                <div className="space-y-3">
                  <input type="month" className="w-full px-3 py-2 border rounded-xl" value={form.budget.month} onChange={e=>setForm(f=>({...f, budget:{...f.budget, month:e.target.value}}))} />
                  <input type="number" className="w-full px-3 py-2 border rounded-xl" placeholder="Jumlah" value={form.budget.amount} onChange={e=>setForm(f=>({...f, budget:{...f.budget, amount:Number(e.target.value)}}))} />
                  <select className="w-full px-3 py-2 border rounded-xl" value={form.budget.category_id} onChange={e=>setForm(f=>({...f, budget:{...f.budget, category_id:e.target.value}}))}>
                    <option value="">Pilih Kategori (Expense)</option>
                    {(summary.categories||[]).filter(c=>c.type==='expense').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <button onClick={()=>submit('/api/budgets', form.budget)} className="w-full mt-2 py-2 rounded-xl bg-emerald-600 text-white">Simpan</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
