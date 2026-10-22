import { useEffect, useMemo, useState } from 'react';
import { supabase, supabaseConfigured } from './supabase';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Plus, LogOut, Download, Trash2, ArrowUpRight, CircleAlert, LoaderCircle, Eye, EyeOff } from 'lucide-react';

const EXPENSES = [
  ['Продукты','🛒'], ['Транспорт','🚇'], ['Дом и счета','🏠'], ['Кафе и доставка','🍔'],
  ['Покупки','🛍️'], ['Здоровье','💊'], ['Развлечения','🎮'], ['Подписки','📱'],
  ['Образование','📚'], ['Другое','📦']
];
const INCOMES = [['Зарплата','💼'],['Подработка','🧑‍💻'],['Подарки','🎁'],['Возврат','↩️'],['Инвестиции','📈'],['Другое','💰']];
const iconFor = name => [...EXPENSES,...INCOMES].find(c => c[0] === name)?.[1] || '💳';
const money = n => new Intl.NumberFormat('ru-RU',{style:'currency',currency:'RUB',maximumFractionDigits:2}).format(Number(n || 0));
const localDate = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const localMonth = () => localDate().slice(0,7);
const escCsv = v => `"${String(v ?? '').replaceAll('"','""')}"`;

function Auth({ onNotice }) {
  const [mode,setMode] = useState('login');
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [busy,setBusy] = useState(false);
  const [showPassword,setShowPassword] = useState(false);
  const submit = async e => {
    e.preventDefault(); setBusy(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({ email: email.trim(), password });
        if (error) throw error;
        onNotice(data.session ? 'Аккаунт создан.' : 'Проверь почту и подтверди регистрацию, если подтверждение включено.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (error) throw error;
      }
    } catch (err) { onNotice(err.message || 'Не удалось выполнить вход.'); }
    finally { setBusy(false); }
  };
  return <main className="auth-wrap">
    <div className="auth-brand"><div className="logo"><Wallet size={24}/></div><div><div className="eyebrow">ЛИЧНЫЕ ФИНАНСЫ</div><h1>Мой бюджет</h1></div></div>
    <section className="panel auth-panel">
      <div className="auth-tabs"><button className={mode==='login'?'selected':''} onClick={()=>setMode('login')}>Войти</button><button className={mode==='signup'?'selected':''} onClick={()=>setMode('signup')}>Создать аккаунт</button></div>
      <h2>{mode==='login'?'С возвращением':'Начни контролировать бюджет'}</h2>
      <p className="muted">{mode==='login'?'Войди, чтобы увидеть свои финансы.':'Регистрация открыта для всех. Твои данные будут доступны после входа с разных устройств.'}</p>
      <form onSubmit={submit} className="stack">
        <label>Email<input required type="email" autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label>
        <label>Пароль<div className="password-field"><input required minLength={8} type={showPassword?'text':'password'} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="Минимум 8 символов"/><button type="button" className="icon-btn" aria-label="Показать пароль" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div></label>
        <button className="primary full" disabled={busy}>{busy?<LoaderCircle className="spin" size={17}/>:null}{mode==='login'?'Войти':'Зарегистрироваться'}</button>
      </form>
      <p className="tiny muted">Не используй пароль от банковского аккаунта. Для финансовых данных выбирай уникальный пароль.</p>
    </section>
  </main>;
}

export default function App() {
  const [session,setSession] = useState(null);
  const [authReady,setAuthReady] = useState(false);
  const [transactions,setTransactions] = useState([]);
  const [budgets,setBudgets] = useState({});
  const [month,setMonth] = useState(localMonth());
  const [type,setType] = useState('expense');
  const [amount,setAmount] = useState('');
  const [category,setCategory] = useState('Продукты');
  const [description,setDescription] = useState('');
  const [date,setDate] = useState(localDate());
  const [filter,setFilter] = useState('all');
  const [notice,setNotice] = useState('');
  const [busy,setBusy] = useState(false);
  const [loadingData,setLoadingData] = useState(false);
  const [budgetCat,setBudgetCat] = useState('Продукты');
  const [budgetValue,setBudgetValue] = useState('');
  const [showBudgetForm,setShowBudgetForm] = useState(false);

  useEffect(() => {
    if (!supabaseConfigured) { setAuthReady(true); return; }
    supabase.auth.getSession().then(({data})=>{setSession(data.session);setAuthReady(true);});
    const { data: listener } = supabase.auth.onAuthStateChange((_event,next)=>{setSession(next);setAuthReady(true);});
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) { setTransactions([]); setBudgets({}); return; }
    loadData();
  }, [session?.user?.id]);

  async function loadData() {
    if (!session?.user?.id) return;
    setLoadingData(true);
    try {
      const [tx,bg] = await Promise.all([
        supabase.from('transactions').select('id,type,amount,category,description,occurred_on,created_at').order('occurred_on',{ascending:false}).order('created_at',{ascending:false}).limit(2000),
        supabase.from('budgets').select('id,category,month,limit_amount')
      ]);
      if (tx.error) throw tx.error;
      if (bg.error) throw bg.error;
      setTransactions(tx.data || []);
      const mapped = {};
      (bg.data || []).forEach(b => { if (String(b.month).slice(0,7) === month) mapped[b.category] = Number(b.limit_amount); });
      setBudgets(mapped);
    } catch (err) { setNotice(`Не удалось загрузить данные: ${err.message}`); }
    finally { setLoadingData(false); }
  }

  useEffect(() => {
    if (!session?.user?.id) return;
    let alive = true;
    (async () => {
      const { data, error } = await supabase.from('budgets').select('category,limit_amount').eq('month',`${month}-01`);
      if (!alive) return;
      if (error) { setNotice(error.message); return; }
      const next = {}; (data||[]).forEach(b=>next[b.category]=Number(b.limit_amount)); setBudgets(next);
    })();
    return () => { alive = false; };
  }, [month,session?.user?.id]);

  const monthTransactions = useMemo(()=>transactions.filter(t=>String(t.occurred_on).slice(0,7)===month),[transactions,month]);
  const totals = useMemo(()=>monthTransactions.reduce((a,t)=>{a[t.type]+=Number(t.amount);return a;},{income:0,expense:0}),[monthTransactions]);
  const balance = totals.income-totals.expense;
  const totalBudget = Object.values(budgets).reduce((a,n)=>a+Number(n),0);
  const categorySpend = name => monthTransactions.filter(t=>t.type==='expense'&&t.category===name).reduce((s,t)=>s+Number(t.amount),0);
  const categories = type==='expense'?EXPENSES:INCOMES;

  async function addTransaction(e) {
    e.preventDefault(); const n=Number(amount);
    if (!Number.isFinite(n)||n<=0) { setNotice('Сумма должна быть больше нуля.'); return; }
    setBusy(true);
    try {
      const payload={user_id:session.user.id,type,amount:n,category,description:description.trim()||null,occurred_on:date};
      const {data,error}=await supabase.from('transactions').insert(payload).select('id,type,amount,category,description,occurred_on,created_at').single();
      if(error) throw error;
      setTransactions(prev=>[data,...prev]);setAmount('');setDescription('');setNotice(type==='income'?'Доход добавлен.':'Расход добавлен.');
    } catch(err){setNotice(`Не удалось сохранить операцию: ${err.message}`);}
    finally{setBusy(false);}
  }

  async function removeTransaction(id) {
    if(!window.confirm('Удалить эту операцию?')) return;
    const {error}=await supabase.from('transactions').delete().eq('id',id);
    if(error){setNotice(`Не удалось удалить: ${error.message}`);return;}
    setTransactions(prev=>prev.filter(t=>t.id!==id));setNotice('Операция удалена.');
  }

  async function saveBudget() {
    const n=Number(budgetValue);
    if(!Number.isFinite(n)||n<0){setNotice('Введи корректный лимит.');return;}
    setBusy(true);
    try {
      if(n===0) {
        const {error}=await supabase.from('budgets').delete().eq('category',budgetCat).eq('month',`${month}-01`);
        if(error) throw error;
        setBudgets(prev=>{const x={...prev};delete x[budgetCat];return x;});
      } else {
        const {data,error}=await supabase.from('budgets').upsert({user_id:session.user.id,category:budgetCat,month:`${month}-01`,limit_amount:n},{onConflict:'user_id,category,month'}).select('category,limit_amount').single();
        if(error) throw error;
        setBudgets(prev=>({...prev,[data.category]:Number(data.limit_amount)}));
      }
      setBudgetValue('');setShowBudgetForm(false);setNotice('Лимит сохранён.');
    } catch(err){setNotice(`Не удалось сохранить лимит: ${err.message}`);}
    finally{setBusy(false);}
  }

  function exportCsv() {
    const rows=[['Дата','Тип','Категория','Описание','Сумма']];
    monthTransactions.forEach(t=>rows.push([t.occurred_on,t.type==='income'?'Доход':'Расход',t.category,t.description,Number(t.amount)]));
    const blob=new Blob(['\uFEFF'+rows.map(r=>r.map(escCsv).join(';')).join('\r\n')],{type:'text/csv;charset=utf-8;'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`finansy-${month}.csv`;a.click();URL.revokeObjectURL(url);
  }

  if (!supabaseConfigured) return <div className="setup-wrap"><section className="panel setup-panel"><div className="logo"><Wallet size={24}/></div><h1>Почти готово</h1><p>Приложение подготовлено для облачной версии, но ещё не подключено к Supabase.</p><ol><li>Создай проект Supabase.</li><li>Скопируй <code>.env.example</code> в <code>.env.local</code>.</li><li>Укажи URL проекта и publishable/anon key.</li><li>Выполни SQL из <code>supabase/migrations/001_initial_schema.sql</code>.</li><li>Перезапусти приложение.</li></ol><p className="muted">Инструкция находится в <code>docs/DEPLOYMENT.md</code>. Не помещай service_role key во frontend.</p></section></div>;
  if (!authReady) return <div className="center-loader"><LoaderCircle className="spin" size={24}/><span>Проверяем сессию…</span></div>;
  if (!session) return <><Auth onNotice={setNotice}/>{notice&&<div className="toast">{notice}<button onClick={()=>setNotice('')}>×</button></div>}</>;

  return <div className="app-shell">
    <header className="topbar"><div className="brand"><div className="logo"><Wallet size={23}/></div><div><div className="eyebrow">ЛИЧНЫЕ ФИНАНСЫ</div><h1>Мой бюджет</h1></div></div><div className="top-actions"><span className="user-email">{session.user.email}</span><button className="secondary" onClick={exportCsv}><Download size={16}/> CSV</button><button className="secondary" onClick={()=>supabase.auth.signOut()}><LogOut size={16}/> Выйти</button></div></header>
    <div className="month-bar"><div><h2>Обзор бюджета</h2><p className="muted">Твои доходы, расходы и финансовые привычки.</p></div><label className="month-label">Месяц<input type="month" value={month} onChange={e=>setMonth(e.target.value)}/></label></div>
    {notice&&<div className="notice"><span>{notice}</span><button onClick={()=>setNotice('')}>×</button></div>}
    {loadingData&&<div className="loading-strip"><LoaderCircle className="spin" size={15}/> Синхронизируем данные…</div>}
    <section className="summary">
      <Metric icon={<TrendingUp/>} label="Доходы за месяц" value={money(totals.income)} tone="green" hint="Все поступления"/>
      <Metric icon={<TrendingDown/>} label="Расходы за месяц" value={money(totals.expense)} tone="red" hint="Все траты"/>
      <Metric icon={<ArrowUpRight/>} label="Баланс за месяц" value={money(balance)} tone={balance<0?'red':'blue'} hint="Доходы минус расходы"/>
      <Metric icon={<PiggyBank/>} label="Лимиты расходов" value={money(totalBudget)} tone="yellow" hint="Сумма лимитов этого месяца"/>
    </section>
    <div className="main-grid">
      <section className="panel">
        <div className="section-head"><h3>Добавить операцию</h3><span className="tag">Облачное сохранение</span></div>
        <form className="stack" onSubmit={addTransaction}>
          <div className="segmented"><button type="button" className={type==='expense'?'active expense':''} onClick={()=>{setType('expense');setCategory('Продукты');}}>− Расход</button><button type="button" className={type==='income'?'active income':''} onClick={()=>{setType('income');setCategory('Зарплата');}}>＋ Доход</button></div>
          <div className="form-two"><label>Сумма, ₽<input type="number" min="0.01" step="0.01" required value={amount} onChange={e=>setAmount(e.target.value)} placeholder="1500"/></label><label>Категория<select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(([n,ic])=><option key={n} value={n}>{ic} {n}</option>)}</select></label></div>
          <label>Описание <input maxLength="120" value={description} onChange={e=>setDescription(e.target.value)} placeholder="Например, продукты на неделю"/></label>
          <label>Дата <input type="date" required value={date} onChange={e=>setDate(e.target.value)}/></label>
          <button className="primary full" disabled={busy}><Plus size={17}/>{busy?'Сохраняем…':'Добавить операцию'}</button>
        </form>
      </section>
      <section className="panel">
        <div className="section-head"><h3>Лимиты по категориям</h3><button className="text-button" onClick={()=>setShowBudgetForm(!showBudgetForm)}><Plus size={16}/> Настроить</button></div>
        {showBudgetForm&&<div className="budget-editor"><label>Категория<select value={budgetCat} onChange={e=>setBudgetCat(e.target.value)}>{EXPENSES.map(([n,ic])=><option key={n} value={n}>{ic} {n}</option>)}</select></label><label>Лимит на месяц, ₽<input type="number" min="0" step="100" value={budgetValue} onChange={e=>setBudgetValue(e.target.value)} placeholder="Например, 10000"/></label><button className="primary full" disabled={busy} onClick={saveBudget}>Сохранить лимит</button><p className="tiny muted">Введи 0, чтобы удалить лимит. Лимит действует только на выбранный месяц.</p></div>}
        <div className="budget-list">{EXPENSES.filter(([n])=>Number(budgets[n])>0).map(([name,emoji])=>{
          const limit=Number(budgets[name]),used=categorySpend(name),pct=used/limit*100;
          return <div className="budget-item" key={name}><div className="budget-title"><strong>{emoji} {name}</strong><span>{money(used)} <i>/ {money(limit)}</i></span></div><div className="progress"><div className={pct>=100?'over':pct>=80?'warn':''} style={{width:`${Math.min(100,pct)}%`}}/></div><div className="budget-sub"><span>{pct>=100?<><CircleAlert size={13}/> Лимит превышен</>:pct>=80?'Почти достигнут':`Осталось ${money(Math.max(0,limit-used))}`}</span><button onClick={()=>{setBudgetCat(name);setBudgetValue('0');setShowBudgetForm(true);}}>Изменить</button></div></div>
        })}{!EXPENSES.some(([n])=>Number(budgets[n])>0)&&<div className="empty">Лимитов пока нет. Нажми «Настроить», чтобы задать бюджет.</div>}</div>
      </section>
    </div>
    <div className="charts-grid"><CategoryChart title="Расходы по категориям" type="expense" rows={monthTransactions}/><CategoryChart title="Доходы по категориям" type="income" rows={monthTransactions}/></div>
    <section className="panel history-panel"><div className="section-head history-head"><h3>История операций</h3><div className="history-tools"><select value={filter} onChange={e=>setFilter(e.target.value)}><option value="all">Все типы</option><option value="expense">Расходы</option><option value="income">Доходы</option></select><span className="tag">{monthTransactions.filter(t=>filter==='all'||t.type===filter).length} записей</span></div></div>
      <div className="transactions">{monthTransactions.filter(t=>filter==='all'||t.type===filter).map(t=><div className="transaction" key={t.id}><div className="tx-icon">{iconFor(t.category)}</div><div className="tx-main"><strong>{t.description||t.category}</strong><span>{t.category} · {new Date(`${t.occurred_on}T12:00:00`).toLocaleDateString('ru-RU')}</span></div><div className={`tx-amount ${t.type==='income'?'green':'red'}`}>{t.type==='income'?'+':'−'}{money(t.amount)}</div><button className="icon-btn delete-btn" title="Удалить операцию" aria-label="Удалить операцию" onClick={()=>removeTransaction(t.id)}><Trash2 size={16}/></button></div>)}
      {!monthTransactions.some(t=>filter==='all'||t.type===filter)&&<div className="empty">За этот месяц операций нет.</div>}</div>
    </section>
    <footer>Данные сохраняются в облаке вашего аккаунта. Не передавайте пароль другим людям.</footer>
  </div>;
}

function Metric({icon,label,value,tone,hint}) {
 return <div className="metric-card"><div className="metric-label"><span className={`metric-icon ${tone}`}>{icon}</span>{label}</div><div className={`metric-value ${tone}`}>{value}</div><div className="muted tiny">{hint}</div></div>;
}
function CategoryChart({title,type,rows}) {
 const groups={};rows.filter(t=>t.type===type).forEach(t=>groups[t.category]=(groups[t.category]||0)+Number(t.amount));
 const sorted=Object.entries(groups).sort((a,b)=>b[1]-a[1]);const total=sorted.reduce((a,r)=>a+r[1],0);
 return <section className="panel chart-panel"><div className="section-head"><h3>{title}</h3><span className="tag">За месяц</span></div>{!sorted.length?<div className="empty">Добавь операцию, чтобы увидеть распределение.</div>:<div className="chart-list">{sorted.map(([name,value])=><div className="chart-row" key={name}><span>{iconFor(name)} {name}</span><div className="progress"><div className={type==='income'?'income-bar':''} style={{width:`${total?value/total*100:0}%`}}/></div><b>{money(value)}</b></div>)}</div>}</section>;
}
