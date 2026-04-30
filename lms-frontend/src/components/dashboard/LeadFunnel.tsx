import { leadFunnel } from '@/data/mockData';

const funnelColors = ['bg-blue-500', 'bg-emerald-500', 'bg-yellow-500', 'bg-orange-500', 'bg-purple-500'];
const funnelWidths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/6', 'w-2/6'];

export default function LeadFunnel() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-gray-800 mb-4">Lead Funnel</h3>
      <div className="flex gap-4">
        {/* Funnel visual */}
        <div className="flex flex-col items-center gap-1 w-36">
          {leadFunnel.map((item, i) => (
            <div key={item.stage} className={`flex items-center justify-center h-8 rounded ${funnelColors[i]} ${funnelWidths[i]} transition-all`}>
              <span className="text-[10px] font-semibold text-white">{item.stage}</span>
            </div>
          ))}
        </div>
        {/* Table */}
        <div className="flex-1">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-gray-400 font-medium border-b border-gray-100">
                <th className="text-left pb-1.5">Stage</th>
                <th className="text-right pb-1.5">Leads</th>
                <th className="text-right pb-1.5">Conv.</th>
              </tr>
            </thead>
            <tbody>
              {leadFunnel.map((item) => (
                <tr key={item.stage} className="border-b border-gray-50 last:border-0">
                  <td className="py-1.5 text-xs text-gray-700">{item.stage}</td>
                  <td className="py-1.5 text-right text-xs text-gray-700 font-medium">{item.leads}</td>
                  <td className="py-1.5 text-right text-xs text-gray-500">{item.conversion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
