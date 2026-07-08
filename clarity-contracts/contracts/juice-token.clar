;; juice-token.clar
;; SIP-010 Fungible Token: $JUICE (subscription token)
;; 0 decimals, capped at 100_000

(impl-trait .traits.ft-trait)

(define-constant DECIMALS u0)
(define-constant MAX_SUPPLY u100000)
(define-constant TOKEN_NAME "Juice")
(define-constant TOKEN_SYMBOL "JUICE")

(define-data-var total-supply uint u0)
(define-data-var authority principal tx-sender)

(define-map balances principal uint)

(define-private (emit-transfer (from principal) (to principal) (amount uint))
  (print {
    event: "transfer",
    from: from,
    to: to,
    amount: amount
  })
)

(define-private (emit-mint (to principal) (amount uint))
  (print {
    event: "mint",
    to: to,
    amount: amount
  })
)

(define-private (emit-burn (from principal) (amount uint))
  (print {
    event: "burn",
    from: from,
    amount: amount
  })
)

;; SIP-010 Implementation

(define-read-only (get-name)
  (ok (some TOKEN_NAME))
)

(define-read-only (get-symbol)
  (ok (some TOKEN_SYMBOL))
)

(define-read-only (get-decimals)
  (ok (some DECIMALS))
)

(define-read-only (get-balance (account principal))
  (ok (some (default-to u0 (map-get? balances account))))
)

(define-read-only (get-total-supply)
  (ok (some (var-get total-supply)))
)

(define-public (transfer (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err u1))
    (asserts! (> amount u0) (err u2))
    (let ((sender-balance (default-to u0 (map-get? balances sender))))
      (asserts! (>= sender-balance amount) (err u3))
      (map-set balances sender (- sender-balance amount))
      (map-set balances recipient (+ (default-to u0 (map-get? balances recipient)) amount))
      (emit-transfer sender recipient amount)
      (ok true)
    )
  )
)

;; Mint: restricted to authority contract
(define-public (mint (to principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u4))
    (asserts! (> amount u0) (err u2))
    (let ((new-supply (+ (var-get total-supply) amount)))
      (asserts! (<= new-supply MAX_SUPPLY) (err u5))
      (var-set total-supply new-supply)
      (map-set balances to (+ (default-to u0 (map-get? balances to)) amount))
      (emit-mint to amount)
      (ok true)
    )
  )
)

;; Burn: allowed by any holder
(define-public (burn (amount uint))
  (begin
    (asserts! (> amount u0) (err u2))
    (let ((sender-balance (default-to u0 (map-get? balances tx-sender))))
      (asserts! (>= sender-balance amount) (err u3))
      (var-set total-supply (- (var-get total-supply) amount))
      (map-set balances tx-sender (- sender-balance amount))
      (emit-burn tx-sender amount)
      (ok true)
    )
  )
)

;; Admin: set authority
(define-public (set-authority (new-authority principal))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u4))
    (var-set authority new-authority)
    (ok true)
  )
)

(ok true)
