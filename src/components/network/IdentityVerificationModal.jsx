import { useState } from 'react'
import { ShieldCheck, X, Phone, CreditCard, KeyRound, ChevronDown, AlertTriangle } from 'lucide-react'
import { maskPhone, maskAccount } from '../../data/mockCustomers'

const SKIP_REASONS = [
  'Emergency override — immediate access required',
  'Returning caller — already verified this session',
  'Internal testing / lab device',
  'Manager override — authorized by supervisor',
]

export default function IdentityVerificationModal({ customer, onVerified, onClose, onLog }) {
  const [method, setMethod] = useState(null)
  const [pinValue, setPinValue] = useState('')
  const [last4Value, setLast4Value] = useState('')
  const [skipReason, setSkipReason] = useState('')
  const [showSkip, setShowSkip] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)

  if (!customer) return null

  const maskedPhone = maskPhone(customer.phone)
  const maskedAccount = maskAccount(customer.accountNumber)

  function getInputValue() {
    if (method === 'pin') return pinValue
    if (method === 'last4') return last4Value
    return ''
  }

  const canVerify = method === 'callback' || (getInputValue().length === 4)

  function handleVerify() {
    setVerifying(true)
    onLog?.('IDENTITY_VERIFIED', {
      serial: customer.serial,
      subscriber: customer.subscriber,
      method,
      masked: method === 'pin' ? '****' : method === 'last4' ? `****` : 'callback',
    })
    setTimeout(() => {
      setVerified(true)
      setTimeout(() => onVerified(customer), 600)
    }, 800)
  }

  function handleSkip() {
    if (!skipReason) return
    onLog?.('IDENTITY_VERIFICATION_SKIPPED', {
      serial: customer.serial,
      subscriber: customer.subscriber,
      reason: skipReason,
    })
    onVerified(customer)
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
    >
      <div className="bg-noc-raised border border-noc-border rounded-xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-noc-border">
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-noc-info" />
            <h2 id="verify-modal-title" className="text-noc-fg font-semibold text-sm">
              Verify Customer Identity
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-noc-muted hover:text-noc-fg transition-colors cursor-pointer"
            aria-label="Close verification modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Customer summary */}
          <div className="bg-noc-surface rounded-lg p-3 border border-noc-border space-y-1">
            <p className="text-noc-fg text-sm font-medium">{customer.subscriber || 'No Subscriber'}</p>
            <div className="flex gap-4 text-xs text-noc-muted font-code">
              {maskedAccount && <span>Account: {maskedAccount}</span>}
              <span>Device: {customer.serial}</span>
            </div>
          </div>

          {/* Instruction */}
          <p className="text-noc-muted text-sm">
            Before accessing full account details, please verify the caller's identity using one of the methods below.
          </p>

          {/* Verification methods */}
          <div className="space-y-2" role="radiogroup" aria-label="Verification method">
            {/* Account PIN */}
            <label className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors duration-150
              ${method === 'pin' ? 'border-noc-info bg-noc-info/5' : 'border-noc-border hover:border-noc-muted'}
            `}>
              <input
                type="radio"
                name="verify-method"
                value="pin"
                checked={method === 'pin'}
                onChange={() => { setMethod('pin'); setPinValue(''); setLast4Value('') }}
                className="mt-0.5 accent-noc-info"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <KeyRound size={13} className="text-noc-muted" />
                  <span className="text-noc-fg text-sm font-medium">Account PIN</span>
                  <span className="text-noc-muted text-2xs">(4-digit)</span>
                </div>
                {method === 'pin' && (
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={4}
                    value={pinValue}
                    onChange={(e) => setPinValue(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="• • • •"
                    autoFocus
                    className="mt-2 w-24 bg-noc-surface border border-noc-border rounded-md px-3 py-1.5 text-noc-fg text-sm font-code focus:outline-none focus:border-noc-info tracking-widest"
                    aria-label="Enter 4-digit account PIN"
                  />
                )}
              </div>
            </label>

            {/* Last 4 of payment method */}
            <label className={`
              flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors duration-150
              ${method === 'last4' ? 'border-noc-info bg-noc-info/5' : 'border-noc-border hover:border-noc-muted'}
            `}>
              <input
                type="radio"
                name="verify-method"
                value="last4"
                checked={method === 'last4'}
                onChange={() => { setMethod('last4'); setPinValue(''); setLast4Value('') }}
                className="mt-0.5 accent-noc-info"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CreditCard size={13} className="text-noc-muted" />
                  <span className="text-noc-fg text-sm font-medium">Last 4 of payment method</span>
                </div>
                {method === 'last4' && (
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={4}
                    value={last4Value}
                    onChange={(e) => setLast4Value(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="e.g. 4321"
                    autoFocus
                    className="mt-2 w-24 bg-noc-surface border border-noc-border rounded-md px-3 py-1.5 text-noc-fg text-sm font-code focus:outline-none focus:border-noc-info"
                    aria-label="Enter last 4 digits of payment method"
                  />
                )}
              </div>
            </label>

            {/* Callback verification */}
            {maskedPhone && (
              <label className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors duration-150
                ${method === 'callback' ? 'border-noc-info bg-noc-info/5' : 'border-noc-border hover:border-noc-muted'}
              `}>
                <input
                  type="radio"
                  name="verify-method"
                  value="callback"
                  checked={method === 'callback'}
                  onChange={() => { setMethod('callback'); setPinValue(''); setLast4Value('') }}
                  className="mt-0.5 accent-noc-info"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-noc-muted" />
                    <span className="text-noc-fg text-sm font-medium">Callback to registered number</span>
                  </div>
                  <p className="text-noc-muted text-xs font-code mt-0.5">{maskedPhone}</p>
                </div>
              </label>
            )}
          </div>

          {/* Compliance note */}
          <div className="flex gap-2 text-noc-muted text-xs bg-noc-surface rounded-lg p-3 border border-noc-border">
            <ShieldCheck size={13} className="shrink-0 mt-0.5 text-noc-info" />
            <span>Verification is recommended per CPNI policy. All access attempts are logged with your operator ID and timestamp.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-noc-border flex items-center gap-3">
          {/* Skip dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSkip((s) => !s)}
              className="flex items-center gap-1.5 text-noc-muted hover:text-noc-fg text-sm transition-colors cursor-pointer"
            >
              <span>Skip</span>
              <ChevronDown size={13} className={`transition-transform duration-150 ${showSkip ? 'rotate-180' : ''}`} />
            </button>
            {showSkip && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowSkip(false)} />
                <div className="absolute bottom-8 left-0 w-72 bg-noc-raised border border-noc-border rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="flex items-center gap-2 px-3 py-2 border-b border-noc-border">
                    <AlertTriangle size={13} className="text-noc-warning" />
                    <span className="text-noc-muted text-xs">Select a reason to proceed without verification</span>
                  </div>
                  {SKIP_REASONS.map((reason) => (
                    <button
                      key={reason}
                      onClick={() => { setSkipReason(reason); setShowSkip(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-noc-muted hover:bg-noc-surface hover:text-noc-fg transition-colors cursor-pointer"
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {skipReason && (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 text-noc-warning text-sm hover:text-noc-fg transition-colors cursor-pointer"
            >
              Proceed ({skipReason.split('—')[0].trim()})
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Verify button */}
          <button
            onClick={handleVerify}
            disabled={!canVerify || verifying}
            className={`
              flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium
              transition-all duration-150 cursor-pointer
              ${canVerify && !verifying
                ? 'bg-noc-info text-white hover:bg-noc-info/80'
                : 'bg-noc-raised text-noc-muted cursor-not-allowed'}
              ${verified ? 'bg-noc-accent text-white' : ''}
            `}
            aria-disabled={!canVerify || verifying}
          >
            {verifying && !verified && (
              <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
            )}
            {verified ? (
              <><ShieldCheck size={14} /> Verified</>
            ) : (
              'Verify & Continue →'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
