import { useEffect, useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'expense-tracker-records'
const categories = ['餐饮', '交通', '购物', '其他']
const transactionTypes = [
  { label: '支出', value: 'expense' },
  { label: '收入', value: 'income' },
]
const categoryClasses = {
  餐饮: 'food',
  交通: 'transport',
  购物: 'shopping',
  其他: 'other',
}

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
})

function readStoredExpenses() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    const parsed = stored ? JSON.parse(stored) : []
    return Array.isArray(parsed)
      ? parsed.map((expense) => ({
          ...expense,
          type: expense.type || 'expense',
          createdAt: expense.createdAt || new Date().toISOString(),
        }))
      : []
  } catch {
    return []
  }
}

function App() {
  const [expenses, setExpenses] = useState(readStoredExpenses)
  const [form, setForm] = useState({
    name: '',
    amount: '',
    category: categories[0],
    type: 'expense',
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses))
  }, [expenses])

  const totalExpense = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + (expense.type === 'expense' ? expense.amount : 0),
        0,
      ),
    [expenses],
  )

  const totalIncome = useMemo(
    () =>
      expenses.reduce(
        (sum, expense) => sum + (expense.type === 'income' ? expense.amount : 0),
        0,
      ),
    [expenses],
  )

  const categoryStats = useMemo(
    () =>
      categories.map((category) => {
        const categoryExpenses = expenses.filter(
          (expense) =>
            expense.category === category && expense.type === 'expense',
        )
        const total = categoryExpenses.reduce(
          (sum, expense) => sum + expense.amount,
          0,
        )

        return {
          category,
          count: categoryExpenses.length,
          total,
          percentage: totalExpense > 0 ? Math.round((total / totalExpense) * 100) : 0,
        }
      }),
    [expenses, totalExpense],
  )

  const recentExpenses = useMemo(
    () =>
      expenses
        .filter((expense) => expense.type === 'expense')
        .slice(0, 4),
    [expenses],
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const cleanName = form.name.trim()
    const amount = Number(form.amount)

    if (!cleanName || !Number.isFinite(amount) || amount <= 0) {
      return
    }

    const nextExpense = {
      id: crypto.randomUUID(),
      name: cleanName,
      amount,
      category: form.category,
      type: form.type,
      createdAt: new Date().toISOString(),
    }

    setExpenses((current) => [nextExpense, ...current])
    setForm({
      name: '',
      amount: '',
      category: form.category,
      type: form.type,
    })
  }

  const deleteExpense = (id) => {
    setExpenses((current) => current.filter((expense) => expense.id !== id))
  }

  return (
    <main className="app-shell">
      <section className="summary">
        <div>
          <p className="eyebrow">Expense Tracker</p>
          <h1>个人记账</h1>
        </div>
        <div className="total-panel" aria-label="总支出金额">
          <span>总支出</span>
          <strong>{currencyFormatter.format(totalExpense)}</strong>
          <small>收入 {currencyFormatter.format(totalIncome)}</small>
        </div>
      </section>

      <section className="content-grid">
        <form className="expense-form" onSubmit={handleSubmit}>
          <h2>添加{form.type === 'income' ? '收入' : '支出'}</h2>
          <div className="type-toggle" aria-label="记录类型">
            {transactionTypes.map((type) => (
              <label key={type.value}>
                <input
                  type="radio"
                  name="type"
                  value={type.value}
                  checked={form.type === type.value}
                  onChange={handleChange}
                />
                <span>{type.label}</span>
              </label>
            ))}
          </div>
          <label>
            名称
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="例如：午餐"
              autoComplete="off"
            />
          </label>
          <label>
            金额
            <input
              type="number"
              name="amount"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              min="0.01"
              step="0.01"
              inputMode="decimal"
            />
          </label>
          <label>
            分类
            <select name="category" value={form.category} onChange={handleChange}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <button type="submit">按 Enter 添加</button>
        </form>

        <div className="dashboard-stack">
          <section className="stats-panel" aria-label="按分类统计">
            <div className="list-header">
              <h2>分类统计</h2>
              <span>按支出统计</span>
            </div>

            {totalExpense === 0 ? (
              <div className="empty-state compact">
                <p>暂无分类统计</p>
                <span>添加支出后会自动汇总各分类占比。</span>
              </div>
            ) : (
              <ul className="stats-list">
                {categoryStats.map((stat) => (
                  <li key={stat.category}>
                    <div className="stat-row">
                      <span
                        className={`category-dot ${categoryClasses[stat.category]}`}
                      ></span>
                      <strong>{stat.category}</strong>
                      <em>{currencyFormatter.format(stat.total)}</em>
                    </div>
                    <div className="progress-track">
                      <span
                        className={categoryClasses[stat.category]}
                        style={{ width: `${stat.percentage}%` }}
                      ></span>
                    </div>
                    <p>
                      {stat.count} 笔 · {stat.percentage}%
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="recent-panel" aria-label="最近消费列表">
            <div className="list-header">
              <h2>最近消费</h2>
              <span>{recentExpenses.length} 条</span>
            </div>

            {recentExpenses.length === 0 ? (
              <div className="empty-state compact">
                <p>最近还没有消费</p>
                <span>添加一笔支出后，这里会显示最新记录。</span>
              </div>
            ) : (
              <ul className="mini-list">
                {recentExpenses.map((expense) => (
                  <li key={expense.id}>
                    <span
                      className={`category-dot ${categoryClasses[expense.category]}`}
                    ></span>
                    <div>
                      <h3>{expense.name}</h3>
                      <p>
                        {new Date(expense.createdAt).toLocaleDateString('zh-CN', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <strong>{currencyFormatter.format(expense.amount)}</strong>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="expense-list" aria-label="全部记录">
            <div className="list-header">
              <h2>全部记录</h2>
              <span>{expenses.length} 条</span>
            </div>

            {expenses.length === 0 ? (
              <div className="empty-state">
                <p>还没有记账记录</p>
                <span>填写名称、金额和分类，按 Enter 就能快速添加。</span>
              </div>
            ) : (
              <ul>
                {expenses.map((expense) => (
                  <li key={expense.id} className="expense-item">
                    <div className="expense-main">
                      <span
                        className={`category-tag ${categoryClasses[expense.category]}`}
                      >
                        {expense.category}
                      </span>
                      <div>
                        <h3>{expense.name}</h3>
                        <p>
                          <span className={`type-text ${expense.type}`}>
                            {expense.type === 'income' ? '收入' : '支出'}
                          </span>
                          {' · '}
                          {new Date(expense.createdAt).toLocaleDateString('zh-CN', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="expense-actions">
                      <strong className={expense.type}>
                        {expense.type === 'income' ? '+' : '-'}
                        {currencyFormatter.format(expense.amount)}
                      </strong>
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        aria-label={`删除 ${expense.name}`}
                      >
                        删除
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </section>
    </main>
  )
}

export default App
