import { colors } from '../../styles/tokens'

export function getStatusColor(status) {
  switch (status) {
    case 'ok':
      return colors.statusOk
    case 'warning':
      return colors.statusWarning
    case 'error':
      return colors.statusError
    case 'offline':
      return colors.statusOffline
    default:
      return colors.linkDefault
  }
}
