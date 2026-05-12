export function getStatusColor(
  status: string
) {

  switch (status) {

    case 'pending_hr':
      return 'bg-amber-100 text-amber-700'

    case 'pending_finance':
      return 'bg-blue-100 text-blue-700'

    case 'approved':
      return 'bg-emerald-100 text-emerald-700'

    case 'rejected':
      return 'bg-red-100 text-red-700'

    default:
      return 'bg-slate-100 text-slate-700'
  }
}