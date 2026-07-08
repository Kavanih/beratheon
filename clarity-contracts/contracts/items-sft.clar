;; items-sft.clar
;; SIP-013 Semi-Fungible Token: Game Items
;; Categories: MATERIAL=1, SKIN=2, CONSUMABLE=3, GEAR=4, STUB=5, COLLECTIBLE=6

(impl-trait .traits.sft-trait)

(define-constant TOKEN_NAME "Beratheon Items")
(define-constant TOKEN_SYMBOL "ITEMS")

(define-data-var authority principal tx-sender)
(define-data-var last-token-id uint u0)

(define-map balances { token-id: uint, owner: principal } uint)
(define-map token-metadata uint { category: uint, name: (string-ascii 64), supply-cap: (optional uint) })

(define-private (emit-transfer (token-id uint) (from principal) (to principal) (amount uint))
  (print {
    event: "transfer",
    token_id: token-id,
    from: from,
    to: to,
    amount: amount
  })
)

(define-private (emit-mint (token-id uint) (to principal) (amount uint))
  (print {
    event: "mint",
    token_id: token-id,
    to: to,
    amount: amount
  })
)

(define-private (emit-burn (token-id uint) (from principal) (amount uint))
  (print {
    event: "burn",
    token_id: token-id,
    from: from,
    amount: amount
  })
)

;; SIP-013 Implementation

(define-read-only (get-balance (token-id uint) (owner principal))
  (ok (some (default-to u0 (map-get? balances { token-id: token-id, owner: owner }))))
)

(define-read-only (get-overall-balance (owner principal))
  (ok (some u0))
)

(define-read-only (get-total-supply (token-id uint))
  (ok (some u0))
)

(define-public (transfer (token-id uint) (amount uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) (err u1))
    (asserts! (> amount u0) (err u2))
    (let ((sender-balance (default-to u0 (map-get? balances { token-id: token-id, owner: sender }))))
      (asserts! (>= sender-balance amount) (err u3))
      (map-set balances { token-id: token-id, owner: sender } (- sender-balance amount))
      (map-set balances { token-id: token-id, owner: recipient } (+ (default-to u0 (map-get? balances { token-id: token-id, owner: recipient })) amount))
      (emit-transfer token-id sender recipient amount)
      (ok true)
    )
  )
)

;; Mint: restricted to authority
(define-public (mint (token-id uint) (to principal) (amount uint))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u4))
    (asserts! (> amount u0) (err u2))
    (map-set balances { token-id: token-id, owner: to } (+ (default-to u0 (map-get? balances { token-id: token-id, owner: to })) amount))
    (emit-mint token-id to amount)
    (ok true)
  )
)

;; Burn: allowed by any holder
(define-public (burn (token-id uint) (amount uint))
  (begin
    (asserts! (> amount u0) (err u2))
    (let ((sender-balance (default-to u0 (map-get? balances { token-id: token-id, owner: tx-sender }))))
      (asserts! (>= sender-balance amount) (err u3))
      (map-set balances { token-id: token-id, owner: tx-sender } (- sender-balance amount))
      (emit-burn token-id tx-sender amount)
      (ok true)
    )
  )
)

;; Bulk transfer: max 200 items per call
(define-public (transfer-many (transfers (list 200 { token-id: uint, amount: uint, to: principal })))
  (begin
    (asserts! (> (len transfers) u0) (err u5))
    (fold transfer-one transfers (ok true))
  )
)

(define-private (transfer-one (item { token-id: uint, amount: uint, to: principal }) (result (response bool uint)))
  (match result
    ok-val (transfer (get token-id item) (get amount item) tx-sender (get to item))
    err-val (err err-val)
  )
)

;; Register new item type
(define-public (register-item (category uint) (name (string-ascii 64)) (supply-cap (optional uint)))
  (begin
    (asserts! (is-eq tx-sender (var-get authority)) (err u4))
    (asserts! (and (>= category u1) (<= category u6)) (err u6))
    (let ((new-id (+ (var-get last-token-id) u1)))
      (var-set last-token-id new-id)
      (map-set token-metadata new-id { category: category, name: name, supply-cap: supply-cap })
      (ok new-id)
    )
  )
)

;; Get item metadata
(define-read-only (get-item-metadata (token-id uint))
  (map-get? token-metadata token-id)
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
