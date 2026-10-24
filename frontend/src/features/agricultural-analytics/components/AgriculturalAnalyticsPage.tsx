import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card } from '../../../components/ui/Card'
import { analyticsSummary, profitabilityData, resourceUseData, yieldData } from '../data/sampleData'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function AgriculturalAnalyticsPage() {
  return (
    <>
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Insights / Agricultural analytics</p>
          <h1 className="page-title">Measure what moves the farm</h1>
          <p className="page-description">Review illustrative trends in yield, resource use, water, operating expenses, and estimated profitability.</p>
        </div>
        <span className="tag neutral">Sample analytics</span>
      </div>
      <div className="notice warning">
        <span aria-hidden="true">i</span>
        <span>Every chart and summary value is fabricated demo data for interface illustration; this page is not connected to farm records or financial systems.</span>
      </div>
      <div className="content-grid four" style={{ marginTop: 16 }}>
        <Card className="stat-card"><span className="stat-label">Season yield</span><p className="stat-value">{analyticsSummary.totalYieldTons} t</p><span className="stat-note">Sample total</span></Card>
        <Card className="stat-card"><span className="stat-label">Water used</span><p className="stat-value">{analyticsSummary.waterUsedKgal} kgal</p><span className="stat-note">Sample season-to-date</span></Card>
        <Card className="stat-card"><span className="stat-label">Operating expenses</span><p className="stat-value">{money.format(analyticsSummary.operatingExpenses)}</p><span className="stat-note">Illustrative costs</span></Card>
        <Card className="stat-card"><span className="stat-label">Estimated net</span><p className="stat-value">{money.format(analyticsSummary.estimatedNet)}</p><span className="stat-note">Not an accounting result</span></Card>
      </div>
      <div className="content-grid two">
        <section>
          <div className="section-heading"><div><h2>Yield by season</h2><p>Illustrative harvest totals in metric tons</p></div></div>
          <Card>
            <div aria-label="Bar chart showing sample yield increasing from 58 tons in 2022 to 84.6 tons in 2026" className="chart-area" role="img">
              <ResponsiveContainer height="100%" width="100%">
                <BarChart data={yieldData} margin={{ top: 12, right: 6, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#edf0e9" strokeDasharray="4 4" vertical={false} />
                  <XAxis axisLine={false} dataKey="season" tick={{ fill: '#879084', fontSize: 10 }} tickLine={false} />
                  <YAxis axisLine={false} tick={{ fill: '#879084', fontSize: 10 }} tickLine={false} />
                  <Tooltip formatter={(value) => [`${value} t`, 'Sample yield']} />
                  <Bar dataKey="yieldTons" fill="#6d984f" name="Yield (tons)" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
        <section>
          <div className="section-heading"><div><h2>Resource consumption</h2><p>Sample water and fertilizer use by month</p></div></div>
          <Card>
            <div aria-label="Line chart showing monthly sample water and fertilizer use from June to October" className="chart-area" role="img">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart data={resourceUseData} margin={{ top: 12, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid stroke="#edf0e9" strokeDasharray="4 4" vertical={false} />
                  <XAxis axisLine={false} dataKey="month" tick={{ fill: '#879084', fontSize: 10 }} tickLine={false} />
                  <YAxis axisLine={false} tick={{ fill: '#879084', fontSize: 10 }} tickLine={false} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line dataKey="waterKgal" dot={false} name="Water (kgal)" stroke="#5285a4" strokeWidth={2} type="monotone" />
                  <Line dataKey="fertilizerTons" dot={false} name="Fertilizer (tons)" stroke="#9a8545" strokeWidth={2} type="monotone" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      </div>
      <div className="section-heading"><div><h2>Expenses and profitability</h2><p>Illustrative revenue, expense, and net amounts by category (USD)</p></div></div>
      <Card>
        <div aria-label="Bar chart comparing sample revenue and expenses across produce, orchard, and other categories" className="chart-area" role="img">
          <ResponsiveContainer height="100%" width="100%">
            <BarChart data={profitabilityData} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
              <CartesianGrid stroke="#edf0e9" strokeDasharray="4 4" vertical={false} />
              <XAxis axisLine={false} dataKey="category" tick={{ fill: '#879084', fontSize: 10 }} tickLine={false} />
              <YAxis axisLine={false} tick={{ fill: '#879084', fontSize: 10 }} tickFormatter={(value: number) => `$${Math.round(value / 1000)}k`} tickLine={false} />
              <Tooltip formatter={(value) => money.format(Number(value))} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Bar dataKey="revenue" fill="#6d984f" name="Revenue" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="#d5a85d" name="Expenses" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  )
}

export { AgriculturalAnalyticsPage }
