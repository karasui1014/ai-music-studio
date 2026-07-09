import { format, formatDistanceToNow } from 'date-fns'
import { ja } from 'date-fns/locale'

export function relativeTime(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: ja })
}

export function formatDate(iso: string, pattern = 'yyyy年M月d日') {
  return format(new Date(iso), pattern, { locale: ja })
}
