import NetworkPage from './NetworkPage'
import CustomerDetailPageOperator from './detail/CustomerDetailPageOperator'
export default function NetworkPageOperator(props) {
  return (
    <NetworkPage
      {...props}
      DetailPageComponent={CustomerDetailPageOperator}
    />
  )
}
